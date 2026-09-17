import type { JiraAttachmentUpload, JiraEpic, JiraPage, JiraRequestResponse, JiraUser } from "@/types"
import { jiraErrorFromResponse } from "./errors"
import { sendJiraRequest } from "./request"

export async function getEpicsForBoard(boardId: number) {
  if (!Number.isInteger(boardId) || boardId <= 0) return []
  const page = await sendJiraRequest<JiraPage<JiraEpic>>(`/rest/agile/1.0/board/${encodeURIComponent(String(boardId))}/epic?done=false&maxResults=100`)
  return Array.isArray(page?.values) ? page.values : []
}

export async function getProjectEpics(projectKey: string, limit = 100) {
  const safeProjectKey = projectKey.replace(/[^A-Za-z0-9_-]/g, "")
  if (!safeProjectKey) return []
  const page = await sendJiraRequest<{ issues?: Array<{ id?: string; key?: string; fields?: { summary?: string } }> }>("/rest/api/2/search", "POST", {
    jql: `project = "${safeProjectKey}" AND issuetype = Epic ORDER BY updated DESC`, startAt: 0, maxResults: Math.min(Math.max(limit, 1), 200), fields: ["summary"],
  })
  return (Array.isArray(page?.issues) ? page.issues : []).filter((issue): issue is { id?: string; key: string; fields?: { summary?: string } } => typeof issue?.key === "string" && Boolean(issue.key)).map((issue, index) => ({
    id: Number(issue.id) || index + 1, key: issue.key, summary: issue.fields?.summary ?? issue.key, name: issue.fields?.summary ?? issue.key, done: false,
  })) satisfies JiraEpic[]
}

export async function getLabelSuggestions(projectKey: string, query = "") {
  const safeProjectKey = projectKey.replace(/[^A-Za-z0-9_-]/g, "")
  if (!safeProjectKey) return []
  const params = new URLSearchParams({ fieldName: "labels", fieldValue: query.trim() })
  const response = await sendJiraRequest<{ results?: Array<{ value?: string; displayName?: string }> }>(`/rest/api/2/jql/autocompletedata/suggestions?${params.toString()}`)
  const labels = new Set<string>()
  for (const item of response?.results ?? []) {
    const raw = typeof item.value === "string" ? item.value : typeof item.displayName === "string" ? item.displayName : ""
    const label = raw.replace(/<[^>]*>/g, "").trim(); if (label) labels.add(label)
  }
  return Array.from(labels).sort((a, b) => a.localeCompare(b))
}

export async function getProjectLabels(projectKey: string, limit = 500) {
  const safeProjectKey = projectKey.replace(/[^A-Za-z0-9_-]/g, "")
  if (!safeProjectKey) return []
  const labels = new Set<string>()
  try {
    const autocomplete = await sendJiraRequest<{ results?: Array<{ value?: string; displayName?: string }> }>("/rest/api/2/jql/autocompletedata/suggestions?fieldName=labels&fieldValue=")
    for (const item of autocomplete?.results ?? []) {
      const raw = typeof item.value === "string" ? item.value : typeof item.displayName === "string" ? item.displayName : ""
      const label = raw.replace(/<[^>]*>/g, "").trim(); if (label) labels.add(label)
    }
  } catch { /* Optional suggestion endpoint. */ }
  let startAt = 0; const pageSize = 100
  while (startAt < limit) {
    const page = await sendJiraRequest<{ issues?: Array<{ fields?: { labels?: string[] } }>; total?: number }>("/rest/api/2/search", "POST", {
      jql: `project = "${safeProjectKey}" ORDER BY updated DESC`, startAt, maxResults: Math.min(pageSize, limit - startAt), fields: ["labels"], validateQuery: false,
    })
    const issues = Array.isArray(page?.issues) ? page.issues : []
    for (const issue of issues) for (const label of issue.fields?.labels ?? []) if (typeof label === "string" && label.trim()) labels.add(label.trim())
    if (!issues.length || startAt + issues.length >= (page.total ?? 0) || issues.length < pageSize) break
    startAt += issues.length
  }
  return Array.from(labels).sort((a, b) => a.localeCompare(b))
}

export async function getAssignableUsers(projectKey: string, query = "", maxResults = 100) {
  const safeProjectKey = projectKey.replace(/[^A-Za-z0-9_-]/g, "")
  if (!safeProjectKey) return []
  const params = new URLSearchParams({ project: safeProjectKey, username: query, maxResults: String(Math.min(Math.max(maxResults, 1), 200)) })
  const users = await sendJiraRequest<JiraUser[]>(`/rest/api/2/user/assignable/search?${params.toString()}`)
  return (Array.isArray(users) ? users : []).filter((user) => user.active !== false && (user.name || user.key || user.displayName))
}

export async function uploadIssueAttachments(issueKey: string, attachments: JiraAttachmentUpload[]) {
  if (!attachments.length) return
  if (!/^[A-Z][A-Z0-9_]*-\d+$/i.test(issueKey)) throw new Error("Invalid Jira issue key for attachment upload.")
  if (typeof chrome === "undefined" || !chrome.runtime?.id) throw new Error("Chrome extension APIs are unavailable. Load the built dist folder as an unpacked extension.")
  const response = (await chrome.runtime.sendMessage({ type: "QUEUEMINT_JIRA_UPLOAD_ATTACHMENTS", request: { issueKey, attachments } })) as JiraRequestResponse<unknown>
  if (!response?.ok) throw jiraErrorFromResponse(response, "Jira attachment upload failed.")
}
