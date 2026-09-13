import type { JiraLiveIssue } from "@/types"

export type JiraPowerToolKind = "assign-unassigned" | "missing-estimate" | "missing-labels" | "backlog-to-sprint"

export type JiraPowerToolPreparation = {
  kind: JiraPowerToolKind
  keys: string[]
}

function hasEstimate(issue: JiraLiveIssue) {
  return (issue.originalEstimateSeconds ?? 0) > 0 || (issue.storyPoints ?? 0) > 0
}

export function powerToolCandidates(kind: JiraPowerToolKind, issues: JiraLiveIssue[]) {
  if (kind === "assign-unassigned") return issues.filter((issue) => !issue.assignee && !issue.assigneeId)
  if (kind === "missing-estimate") return issues.filter((issue) => !hasEstimate(issue))
  if (kind === "missing-labels") return issues.filter((issue) => issue.labels.length === 0)
  return issues.filter((issue) => issue.placement === "backlog")
}
