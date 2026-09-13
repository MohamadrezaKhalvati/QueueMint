import type { JiraProject } from "@/types"
import type { QueueMintPageContext } from "@/lib/capture"

export type SmartTemplateId = "auto" | "frontend" | "regression" | "backend" | "performance"

export interface SmartCaptureSuggestion {
  category: Exclude<SmartTemplateId, "auto">
  summary: string
  description: string
  priority?: string
  issueType?: string
  component?: string
  labels: string[]
  reasons: string[]
}

export interface SmartPreflightItem {
  id: string
  level: "ok" | "warning" | "error"
  label: string
}

interface SuggestionInput {
  context?: QueueMintPageContext | null
  currentSummary?: string
  currentDescription?: string
  template?: SmartTemplateId
  priorityNames?: string[]
  issueTypeNames?: string[]
  project?: JiraProject | null
}

interface PreflightInput {
  summary: string
  projectKey: string
  issueType: string
  priority?: string
  assignee?: string
  description?: string
  screenshotAttached: boolean
  contextIncluded: boolean
  boardSelected: boolean
  sprintSelected: boolean
  locale: "en" | "fa"
}

const CATEGORY_LABELS: Record<Exclude<SmartTemplateId, "auto">, string> = {
  frontend: "UI",
  regression: "Regression",
  backend: "API",
  performance: "Performance",
}

const CATEGORY_LABEL_TAGS: Record<Exclude<SmartTemplateId, "auto">, string[]> = {
  frontend: ["frontend", "ui"],
  regression: ["regression"],
  backend: ["backend", "api"],
  performance: ["performance"],
}

function normalized(value?: string | null) {
  return (value ?? "").toLowerCase()
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function pageTitle(context?: QueueMintPageContext | null) {
  const title = (context?.title ?? "").replace(/\s+/g, " ").trim()
  if (!title || /^(new tab|untitled page)$/i.test(title)) return context?.hostname || "Captured page"
  return title
}

function inferCategory(context?: QueueMintPageContext | null): Exclude<SmartTemplateId, "auto"> {
  const source = normalized([context?.title, context?.url, context?.selection].filter(Boolean).join(" "))
  if (/\b(regression|again|used to work|previously worked|broke after)\b/.test(source)) return "regression"
  if (/\b(api|endpoint|request|response|json|graphql|rest|500|502|503|server|backend|database|db|timeout)\b/.test(source)) return "backend"
  if (/\b(slow|latency|performance|lag|freeze|frozen|loading|timeout|memory|cpu)\b/.test(source)) return "performance"
  return "frontend"
}

function pickPriority(priorityNames: string[], category: Exclude<SmartTemplateId, "auto">, source: string) {
  if (!priorityNames.length) return undefined
  const lower = priorityNames.map((name) => ({ name, value: name.toLowerCase() }))
  const severe = /\b(crash|fatal|data loss|payment|security|permission|unauthorized|forbidden|401|403|500|blocker|blocked)\b/.test(source)
  const preferred = severe
    ? ["blocker", "critical", "highest", "high", "major"]
    : category === "performance"
      ? ["major", "medium", "normal", "high"]
      : ["medium", "normal", "major", "high"]
  for (const candidate of preferred) {
    const exact = lower.find((item) => item.value === candidate)
    if (exact) return exact.name
  }
  return undefined
}

function pickIssueType(issueTypeNames: string[]) {
  return issueTypeNames.find((name) => name.toLowerCase() === "bug") ?? issueTypeNames.find((name) => name.toLowerCase().includes("defect"))
}

function pickComponent(project: JiraProject | null | undefined, category: Exclude<SmartTemplateId, "auto">, context?: QueueMintPageContext | null) {
  const components = project?.components ?? []
  if (!components.length) return undefined
  const source = normalized([context?.title, context?.url, context?.selection].filter(Boolean).join(" "))
  const categoryTokens: Record<Exclude<SmartTemplateId, "auto">, string[]> = {
    frontend: ["frontend", "front-end", "web", "ui", "client"],
    regression: ["frontend", "backend", "web", "api"],
    backend: ["backend", "back-end", "api", "server", "service"],
    performance: ["performance", "platform", "frontend", "backend"],
  }
  const scored = components.map((component) => {
    const name = normalized(component.name)
    let score = 0
    for (const token of categoryTokens[category]) if (name.includes(token)) score += 4
    for (const token of name.split(/[^a-z0-9]+/).filter((token) => token.length > 2)) if (source.includes(token)) score += 2
    return { name: component.name, score }
  }).sort((a, b) => b.score - a.score)
  return scored[0]?.score > 0 ? scored[0].name : undefined
}

function buildDescription(category: Exclude<SmartTemplateId, "auto">, context?: QueueMintPageContext | null) {
  const title = pageTitle(context)
  const url = context?.url ?? ""
  const selection = context?.selection?.trim()
  const categoryHint: Record<Exclude<SmartTemplateId, "auto">, string> = {
    frontend: "Visual or interaction issue captured on the page.",
    regression: "Behavior appears to have regressed from an earlier working state.",
    backend: "Request, response, or server-side behavior appears incorrect.",
    performance: "The page or action appears slower or less responsive than expected.",
  }
  return [
    "Observed behavior:",
    categoryHint[category],
    "",
    "Expected behavior:",
    "Describe the expected result.",
    "",
    "Steps to reproduce:",
    url ? `1. Open ${url}` : "1. Open the affected page.",
    "2. Repeat the action shown in the attached capture.",
    "3. Observe the unexpected result.",
    "",
    `Page: ${title}`,
    selection ? `Selected text: ${selection}` : "",
  ].filter(Boolean).join("\n")
}

export function buildSmartCaptureSuggestion(input: SuggestionInput): SmartCaptureSuggestion {
  const category = input.template && input.template !== "auto" ? input.template : inferCategory(input.context)
  const source = normalized([input.context?.title, input.context?.url, input.context?.selection, input.currentSummary].filter(Boolean).join(" "))
  const title = pageTitle(input.context)
  const currentSummary = (input.currentSummary ?? "").trim()
  const genericSummary = !currentSummary || /^bug:\s*/i.test(currentSummary)
  const summary = (genericSummary ? `${CATEGORY_LABELS[category]}: ${title}` : currentSummary).slice(0, 180)
  const currentDescription = (input.currentDescription ?? "").trim()
  const description = currentDescription || buildDescription(category, input.context)
  const priority = pickPriority(input.priorityNames ?? [], category, source)
  const issueType = pickIssueType(input.issueTypeNames ?? [])
  const component = pickComponent(input.project, category, input.context)
  const hostParts = (input.context?.hostname ?? "").split(".").filter(Boolean)
  const hostLabel = (hostParts[0] === "www" ? hostParts[1] : hostParts[0]) || ""
  const labels = unique(["capture", ...CATEGORY_LABEL_TAGS[category], hostLabel])
  const reasons = [
    `Detected ${CATEGORY_LABELS[category]} context from the captured page.`,
    priority ? `Matched Jira priority: ${priority}.` : "Kept Jira default priority because no reliable priority match was available.",
    component ? `Matched project component: ${component}.` : "No project component was changed automatically.",
  ]
  return { category, summary, description, priority, issueType, component, labels, reasons }
}

function fa(value: string) {
  const map: Record<string, string> = {
    "Summary is ready": "عنوان آماده است",
    "Summary is required": "عنوان الزامي است",
    "Project is selected": "پروژه انتخاب شده است",
    "Project is required": "پروژه الزامي است",
    "Issue type is selected": "نوع تسک انتخاب شده است",
    "Issue type is required": "نوع تسک الزامي است",
    "Screenshot will be attached": "تصوير به تسک پيوست مي شود",
    "Attach a screenshot when visual evidence matters": "اگر مشکل بصري است بهتر است تصوير پيوست شود",
    "Description is ready": "توضيحات آماده است",
    "Add a short observed and expected behavior": "رفتار فعلي و رفتار مورد انتظار را کوتاه بنويس",
    "Priority is explicit": "اولويت مشخص شده است",
    "Jira default priority will be used": "اولويت پيش فرض Jira استفاده مي شود",
    "Assignee is explicit": "مسئول مشخص شده است",
    "Jira default assignee will be used": "مسئول پيش فرض Jira استفاده مي شود",
    "Page context will be included": "اطلاعات صفحه اضافه مي شود",
    "Page context is disabled": "اطلاعات صفحه غيرفعال است",
    "Sprint is selected": "اسپرينت انتخاب شده است",
    "Issue will stay in backlog": "تسک در بک لاگ مي ماند",
    "No board is selected": "بوردي انتخاب نشده است",
  }
  return map[value] ?? value
}

export function buildCapturePreflight(input: PreflightInput): SmartPreflightItem[] {
  const items: SmartPreflightItem[] = [
    { id: "summary", level: input.summary.trim() ? "ok" : "error", label: input.summary.trim() ? "Summary is ready" : "Summary is required" },
    { id: "project", level: input.projectKey ? "ok" : "error", label: input.projectKey ? "Project is selected" : "Project is required" },
    { id: "type", level: input.issueType ? "ok" : "error", label: input.issueType ? "Issue type is selected" : "Issue type is required" },
    { id: "screenshot", level: input.screenshotAttached ? "ok" : "warning", label: input.screenshotAttached ? "Screenshot will be attached" : "Attach a screenshot when visual evidence matters" },
    { id: "description", level: input.description?.trim() ? "ok" : "warning", label: input.description?.trim() ? "Description is ready" : "Add a short observed and expected behavior" },
    { id: "priority", level: input.priority ? "ok" : "warning", label: input.priority ? "Priority is explicit" : "Jira default priority will be used" },
    { id: "assignee", level: input.assignee ? "ok" : "warning", label: input.assignee ? "Assignee is explicit" : "Jira default assignee will be used" },
    { id: "context", level: input.contextIncluded ? "ok" : "warning", label: input.contextIncluded ? "Page context will be included" : "Page context is disabled" },
    { id: "routing", level: input.boardSelected ? "ok" : "warning", label: input.boardSelected ? (input.sprintSelected ? "Sprint is selected" : "Issue will stay in backlog") : "No board is selected" },
  ]
  return input.locale === "fa" ? items.map((item) => ({ ...item, label: fa(item.label) })) : items
}
