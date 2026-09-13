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
  type: string
  priority: string
  status: string
  assignee: string
  sprint: string
  label: string
  estimate: string
  myIssuesOnly: boolean
  currentUser?: string | null
}

export function filterManageIssues(source: JiraLiveIssue[], filters: ManageIssueFilterState) {
  const q = filters.search.trim().toLowerCase()
  return source
    .filter((issue) => !q || issue.key.toLowerCase().includes(q) || issue.summary.toLowerCase().includes(q) || issue.labels.some((label) => label.toLowerCase().includes(q)) || issue.assignee?.toLowerCase().includes(q) || issue.status?.toLowerCase().includes(q))
    .filter((issue) => filters.type === "all" || issue.type === filters.type)
    .filter((issue) => filters.priority === "all" || issue.priority === filters.priority)
    .filter((issue) => filters.status === "all" || issue.status === filters.status)
    .filter((issue) => filters.assignee === "all" || (filters.assignee === "__unassigned__" ? !issue.assignee && !issue.assigneeId : issue.assignee === filters.assignee))
    .filter((issue) => filters.sprint === "all" || (filters.sprint === "backlog" ? issue.placement === "backlog" : issue.sprintId === Number(filters.sprint)))
    .filter((issue) => filters.label === "all" || issue.labels.includes(filters.label))
    .filter((issue) => filters.estimate === "all" || (filters.estimate === "estimated" ? formatEstimate(issue) !== "—" : formatEstimate(issue) === "—"))
    .filter((issue) => !filters.myIssuesOnly || Boolean(filters.currentUser && issue.assignee === filters.currentUser))
}
