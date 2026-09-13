import type { AutomationRule } from "@/lib/storage"
import type { JiraIssueSearchResult, JiraLiveIssue, JiraUser } from "@/types"

export type SimilarIssue = Pick<JiraIssueSearchResult, "key" | "summary" | "type" | "status" | "priority" | "assignee" | "avatarUrl" | "labels">

export interface DuplicateMatch {
  issue: SimilarIssue
  score: number
}

export interface AssigneeSuggestion {
  identity: string
  displayName: string
  avatarUrl?: string
  workload: number
  related: number
  score: number
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokens(value: string) {
  return new Set(normalizeText(value).split(" ").filter((token) => token.length > 1))
}

function bigrams(value: string) {
  const normalized = normalizeText(value).replace(/\s+/g, " ")
  const result = new Set<string>()
  for (let index = 0; index < normalized.length - 1; index += 1) result.add(normalized.slice(index, index + 2))
  return result
}

function overlapScore(a: Set<string>, b: Set<string>) {
  if (!a.size || !b.size) return 0
  let shared = 0
  for (const value of a) if (b.has(value)) shared += 1
  return shared / (a.size + b.size - shared)
}

export function duplicateSimilarity(summary: string, candidate: string) {
  const left = normalizeText(summary)
  const right = normalizeText(candidate)
  if (!left || !right) return 0
  if (left === right) return 1
  if (left.length >= 8 && (left.includes(right) || right.includes(left))) return 0.94
  const tokenScore = overlapScore(tokens(left), tokens(right))
  const bigramScore = overlapScore(bigrams(left), bigrams(right))
  return Math.min(1, tokenScore * 0.72 + bigramScore * 0.28)
}

export function findPotentialDuplicates(summary: string, issues: SimilarIssue[], limit = 4): DuplicateMatch[] {
  if (normalizeText(summary).length < 5) return []
  return issues
    .map((issue) => ({ issue, score: Math.round(duplicateSimilarity(summary, issue.summary) * 100) }))
    .filter((match) => match.score >= 42)
    .sort((a, b) => b.score - a.score || a.issue.key.localeCompare(b.issue.key))
    .slice(0, limit)
}

function userIdentity(user: JiraUser) {
  return user.name ?? user.key ?? ""
}

function isClosedStatus(status?: string) {
  const value = normalizeText(status ?? "")
  return ["done", "closed", "resolved", "complete", "completed"].some((token) => value.includes(token))
}

export function suggestAssignees(
  targets: Array<Pick<JiraLiveIssue, "type" | "labels">>,
  boardIssues: JiraLiveIssue[],
  users: JiraUser[],
  limit = 3,
): AssigneeSuggestion[] {
  if (!targets.length || !boardIssues.length || !users.length) return []

  const targetTypes = new Set(targets.map((issue) => normalizeText(issue.type)).filter(Boolean))
  const targetLabels = new Set(targets.flatMap((issue) => issue.labels.map(normalizeText)).filter(Boolean))

  return users
    .filter((user) => user.active !== false && Boolean(userIdentity(user)))
    .map((user) => {
      const identity = userIdentity(user)
      const displayName = user.displayName ?? identity
      const aliases = new Set([identity, user.name, user.key, user.displayName].filter((value): value is string => Boolean(value)).map(normalizeText))
      const owned = boardIssues.filter((issue) => {
        const issueOwner = normalizeText(issue.assigneeId ?? issue.assignee ?? "")
        return issueOwner && aliases.has(issueOwner)
      })
      const workload = owned.filter((issue) => !isClosedStatus(issue.status)).length
      let related = 0
      for (const issue of owned) {
        const typeMatch = targetTypes.has(normalizeText(issue.type))
        const labelMatch = issue.labels.some((label) => targetLabels.has(normalizeText(label)))
        if (typeMatch) related += 1
        if (labelMatch) related += 2
      }
      const score = related * 4 - workload + (owned.length ? 1 : 0)
      const avatarUrl = user.avatarUrls?.["32x32"] ?? user.avatarUrls?.["24x24"] ?? user.avatarUrls?.["48x48"]
      return { identity, displayName, avatarUrl, workload, related, score }
    })
    .sort((a, b) => b.score - a.score || a.workload - b.workload || a.displayName.localeCompare(b.displayName))
    .slice(0, limit)
}

export function automationRuleMatches(rule: AutomationRule, issue: JiraLiveIssue) {
  const value = normalizeText(rule.condition.value ?? "")
  switch (rule.condition.kind) {
    case "unassigned":
      return !issue.assignee
    case "no-estimate":
      return !issue.originalEstimateSeconds && !issue.storyPoints
    case "backlog":
      return issue.placement === "backlog"
    case "priority-is":
      return normalizeText(issue.priority ?? "") === value
    case "status-is":
      return normalizeText(issue.status ?? "") === value
    case "type-is":
      return normalizeText(issue.type) === value
    case "label-has":
      return issue.labels.some((label) => normalizeText(label) === value)
    default:
      return false
  }
}

export function matchingIssuesForRule(rule: AutomationRule, issues: JiraLiveIssue[]) {
  return issues.filter((issue) => automationRuleMatches(rule, issue))
}
