export function safeOrigin(value?: string) {
  if (!value) return ""
  try { return new URL(value).origin } catch { return "" }
}

export function looksLikeJiraCandidate(candidate?: { url?: string; title?: string } | null) {
  if (!candidate) return false
  return /jira|atlassian/i.test(`${candidate.title ?? ""} ${candidate.url ?? ""}`)
}
