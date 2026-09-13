import type { AppLocale, JiraLiveIssue, JiraSprint } from "@/types"

export function buildSprintShareSummary(locale: AppLocale, projectKey: string | undefined, sprints: JiraSprint[], issues: JiraLiveIssue[]) {
  const sprint = sprints.find((item) => item.state === "active")
  if (!sprint) return null
  const scoped = issues.filter((issue) => issue.placement === "sprint" && issue.sprintId === sprint.id)
  const statuses = new Map<string, number>()
  for (const issue of scoped) statuses.set(issue.status || "Unknown", (statuses.get(issue.status || "Unknown") ?? 0) + 1)
  const statusText = Array.from(statuses.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => `${name}: ${count}`).join(" | ")
  const unassigned = scoped.filter((issue) => !issue.assignee && !issue.assigneeId).length
  const unestimated = scoped.filter((issue) => typeof issue.storyPoints !== "number" && !((issue.originalEstimateSeconds ?? 0) > 0 || (issue.remainingEstimateSeconds ?? 0) > 0)).length
  const header = projectKey ? `${projectKey} · ${sprint.name}` : sprint.name
  const text = locale === "fa"
    ? `*${header}*\nتعداد: ${scoped.length} | بدون مسئول: ${unassigned} | بدون تخمین: ${unestimated}${statusText ? `\nوضعیت: ${statusText}` : ""}`
    : `*${header}*\nTotal: ${scoped.length} | Unassigned: ${unassigned} | No estimate: ${unestimated}${statusText ? `\nStatus: ${statusText}` : ""}`
  return { sprint, issueCount: scoped.length, text }
}
