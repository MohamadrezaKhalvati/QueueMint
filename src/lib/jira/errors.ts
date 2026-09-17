import type { JiraRequestResponse } from "@/types"

type ErrorOptions = {
  code?: string
  status?: number
  data?: unknown
  rawMessage?: string
}

export class JiraRequestError extends Error {
  readonly code?: string
  readonly status?: number
  readonly data?: unknown
  readonly rawMessage?: string

  constructor(message: string, options: ErrorOptions = {}) {
    super(message)
    this.name = "JiraRequestError"
    this.code = options.code
    this.status = options.status
    this.data = options.data
    this.rawMessage = options.rawMessage
  }
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function fieldScreenMessage(raw: string) {
  const fieldMatch = /Field ['"]([^'"]+)['"] cannot be set/i.exec(raw)
  const field = fieldMatch?.[1]?.toLowerCase()
  if (field === "timetracking" || /time ?tracking/i.test(raw)) {
    return "Jira does not allow Time Tracking to be edited for this issue. Add Time Tracking to the issue's Edit screen or remove the estimate change from this bulk edit."
  }
  if (field) {
    return `Jira does not allow '${fieldMatch?.[1]}' to be edited for this issue. Check the issue's Edit screen and field configuration.`
  }
  return "Jira does not allow one of the requested fields to be edited for this issue. Check the issue's Edit screen and field configuration."
}

export function friendlyJiraMessage(rawMessage: string | undefined, status?: number, code?: string) {
  const raw = compact(rawMessage || "")
  const normalizedCode = code?.toUpperCase() ?? ""

  if (normalizedCode === "AUTH_REQUIRED" || status === 401) return "Your Jira session is not authenticated. Sign in to Jira and retry."
  if (normalizedCode === "NO_JIRA_TAB") return raw || "Open the connected Jira site in a browser tab and retry."
  if (normalizedCode === "BRIDGE_UNAVAILABLE") return "QueueMint lost access to the Jira tab. Reload that Jira tab and retry."
  if (normalizedCode === "NETWORK_ERROR") return "QueueMint could not reach Jira. Check the Jira tab and network connection, then retry."
  if (/receiving end does not exist|message port closed|extension context invalidated/i.test(raw)) return "QueueMint lost access to its browser bridge. Reload the extension and the Jira tab, then retry."
  if (/failed to fetch|networkerror|network request failed|load failed/i.test(raw)) return "QueueMint could not reach Jira. Check the Jira tab and network connection, then retry."
  if (status === 403) return raw || "Jira rejected this action because your account does not have permission."
  if (status === 404) return raw || "Jira could not find the requested issue, board, or REST resource. Refresh QueueMint and retry."
  if (status === 409) return raw || "Jira reported a conflict because the issue changed while QueueMint was updating it. Refresh and retry."
  if (status === 429) return "Jira is rate limiting requests. Wait a short time and retry."
  if (/cannot be set.*appropriate screen|not on the appropriate screen|field .* cannot be set/i.test(raw)) return fieldScreenMessage(raw)
  if (/does not exist or you do not have permission/i.test(raw)) return "Jira could not access this issue. It may have been deleted or your account may not have permission to view it."
  if (/issue does not exist/i.test(raw)) return "This Jira issue no longer exists. Refresh QueueMint to remove stale data."
  return raw || (status ? `Jira request failed with HTTP ${status}.` : "Jira request failed.")
}

export function jiraErrorFromResponse<T>(response: JiraRequestResponse<T> | undefined, fallback = "Jira request failed.") {
  const raw = response?.error?.message || fallback
  return new JiraRequestError(friendlyJiraMessage(raw, response?.status, response?.error?.code), {
    code: response?.error?.code,
    status: response?.status,
    data: response?.data,
    rawMessage: raw,
  })
}

export function jiraErrorMessage(error: unknown, fallback = "Jira request failed.") {
  if (error instanceof JiraRequestError) return error.message
  if (error instanceof Error) return friendlyJiraMessage(error.message)
  return fallback
}

export function summarizeBatchFailures(results: Array<{ key: string; ok: boolean; error?: string }>, total: number, fallback: string) {
  const failed = results.filter((item) => !item.ok)
  if (!failed.length) return ""
  const first = failed[0]
  const detail = first?.error ? ` ${first.key}: ${friendlyJiraMessage(first.error)}` : ""
  return `${failed.length}/${Math.max(total, failed.length)} failed.${detail || ` ${fallback}`}`
}
