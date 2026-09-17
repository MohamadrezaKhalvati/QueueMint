export type WorklogCommentContext = {
  issueKey: string
  summary?: string | null
  comment?: string | null
}

function cleanLine(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim()
  return /^(undefined|null)$/i.test(cleaned) ? "" : cleaned
}

export function buildWorklogFallbackComment(issueKey: string, summary?: string | null) {
  const key = cleanLine(issueKey)
  const cleanSummary = cleanLine(summary ?? "")
  if (cleanSummary) return `Worked on ${key}: ${cleanSummary}`
  return `Worked on issue ${key}`
}

export function resolveWorklogComment(entry: WorklogCommentContext, defaultComment = "") {
  const explicit = cleanLine(entry.comment ?? "")
  if (explicit) return explicit
  const shared = cleanLine(defaultComment)
  if (shared) return shared
  return buildWorklogFallbackComment(entry.issueKey, entry.summary)
}
