import type { JiraLiveIssue, JiraSprint } from "@/types"

export function groupLiveIssues(entries: JiraLiveIssue[], sprints: JiraSprint[]) {
  const groups = new Map<string, { key: string; label: string; sprint?: JiraSprint; entries: JiraLiveIssue[] }>()
  const orderedSprints = [...sprints].sort((a, b) => (a.state === "active" ? 0 : 1) - (b.state === "active" ? 0 : 1) || a.name.localeCompare(b.name))
  for (const sprint of orderedSprints) groups.set(`sprint:${sprint.id}`, { key: `sprint:${sprint.id}`, label: sprint.name, sprint, entries: [] })
  groups.set("backlog", { key: "backlog", label: "Backlog", entries: [] })
  for (const issue of entries) {
    const sprint = typeof issue.sprintId === "number" ? sprints.find((item) => item.id === issue.sprintId) : undefined
    const key = sprint ? `sprint:${sprint.id}` : "backlog"
    const group = groups.get(key) ?? { key, label: sprint?.name ?? "Backlog", sprint, entries: [] }
    group.entries.push(issue)
    groups.set(key, group)
  }
  return Array.from(groups.values())
}

export function formatEstimate(issue: JiraLiveIssue) {
  if (typeof issue.storyPoints === "number") return `${issue.storyPoints} SP`
  const seconds = issue.remainingEstimateSeconds ?? issue.originalEstimateSeconds
  if (typeof seconds !== "number" || seconds <= 0) return "—"
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours && !minutes) return `${hours}h`
  if (hours) return `${hours}h ${minutes}m`
  return `${minutes || 1}m`
}

export type ManageIssueFilterState = {
  search: string
  type: string[]
  priority: string[]
  status: string[]
  assignee: string[]
  sprint: string[]
  label: string[]
  estimate: string
  myIssuesOnly: boolean
  currentUser?: string | null
}

function includesAny(values: string[], actual?: string) {
  return values.length === 0 || Boolean(actual && values.includes(actual))
}

export function filterManageIssues(source: JiraLiveIssue[], filters: ManageIssueFilterState) {
  const q = filters.search.trim().toLowerCase()
  return source
    .filter((issue) => !q || issue.key.toLowerCase().includes(q) || issue.summary.toLowerCase().includes(q) || issue.labels.some((label) => label.toLowerCase().includes(q)) || issue.assignee?.toLowerCase().includes(q) || issue.status?.toLowerCase().includes(q))
    .filter((issue) => includesAny(filters.type, issue.type))
    .filter((issue) => includesAny(filters.priority, issue.priority))
    .filter((issue) => includesAny(filters.status, issue.status))
    .filter((issue) => filters.assignee.length === 0 || filters.assignee.some((value) => value === "__unassigned__" ? !issue.assignee && !issue.assigneeId : issue.assignee === value))
    .filter((issue) => filters.sprint.length === 0 || filters.sprint.some((value) => value === "backlog" ? issue.placement === "backlog" : issue.sprintId === Number(value)))
    .filter((issue) => filters.label.length === 0 || filters.label.some((value) => issue.labels.includes(value)))
    .filter((issue) => filters.estimate === "all" || (filters.estimate === "estimated" ? formatEstimate(issue) !== "—" : formatEstimate(issue) === "—"))
    .filter((issue) => !filters.myIssuesOnly || Boolean(filters.currentUser && issue.assignee === filters.currentUser))
}
