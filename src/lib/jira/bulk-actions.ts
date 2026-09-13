import type { JiraBulkEditPatch, JiraIssueFieldSnapshot } from "@/types"
import { applyOriginalEstimate } from "./estimation"
import { sendJiraRequest } from "./request"

export async function getIssueFieldSnapshots(issueKeys: string[], fieldIds: string[]): Promise<JiraIssueFieldSnapshot[]> {
  const safeKeys = Array.from(new Set(issueKeys.filter((key) => /^[A-Z][A-Z0-9_]*-\d+$/i.test(key))))
  const safeFields = Array.from(new Set(fieldIds.filter((fieldId) => /^(customfield_\d+|[a-zA-Z][a-zA-Z0-9_]*)$/.test(fieldId))))
  if (!safeKeys.length || !safeFields.length) return []
  const snapshots: JiraIssueFieldSnapshot[] = []
  for (let offset = 0; offset < safeKeys.length; offset += 50) {
    const keys = safeKeys.slice(offset, offset + 50)
    const page = await sendJiraRequest<{ issues?: Array<{ key?: string; fields?: Record<string, unknown> }> }>("/rest/api/2/search", "POST", {
      jql: `key in (${keys.map((key) => `\"${key}\"`).join(",")})`, startAt: 0, maxResults: keys.length, fields: safeFields,
    })
    for (const issue of Array.isArray(page?.issues) ? page.issues : []) if (typeof issue?.key === "string") snapshots.push({ key: issue.key, fields: issue.fields ?? {} })
  }
  return snapshots
}

function normalizeRestorableValue(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.map(normalizeRestorableValue)
  if (typeof value !== "object") return value
  const record = value as Record<string, unknown>
  if (typeof record.id === "string" || typeof record.id === "number") return { id: String(record.id) }
  if (typeof record.accountId === "string") return { accountId: record.accountId }
  if (typeof record.name === "string") return { name: record.name }
  if (typeof record.key === "string") return { key: record.key }
  if (typeof record.value === "string" || typeof record.value === "number") return { value: record.value }
  return value
}

function secondsToJiraDuration(value: unknown) {
  const seconds = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
  if (!seconds) return "0m"
  const days = Math.floor(seconds / 28800); const hours = Math.floor((seconds % 28800) / 3600); const minutes = Math.max(0, Math.round((seconds % 3600) / 60))
  const parts: string[] = []
  if (days) parts.push(`${days}d`); if (hours) parts.push(`${hours}h`); if (minutes) parts.push(`${minutes}m`)
  return parts.join(" ") || "1m"
}

export async function restoreIssueFieldSnapshots(snapshots: JiraIssueFieldSnapshot[], fieldIds: string[], boardId?: number | null) {
  const fieldsToRestore = Array.from(new Set(fieldIds))
  const results: Array<{ key: string; ok: boolean; error?: string }> = []
  for (const snapshot of snapshots) {
    try {
      const fields: Record<string, unknown> = {}
      for (const fieldId of fieldsToRestore) {
        if (fieldId === "timeoriginalestimate" || fieldId === "timeestimate") continue
        fields[fieldId] = normalizeRestorableValue(snapshot.fields[fieldId])
      }
      if (Object.keys(fields).length) await sendJiraRequest<unknown>(`/rest/api/2/issue/${encodeURIComponent(snapshot.key)}`, "PUT", { fields })
      if (fieldsToRestore.includes("timeoriginalestimate")) {
        const original = snapshot.fields.timeoriginalestimate
        if (typeof original === "number" && original > 0) await applyOriginalEstimate(snapshot.key, secondsToJiraDuration(original), boardId)
        else await sendJiraRequest<unknown>(`/rest/api/2/issue/${encodeURIComponent(snapshot.key)}`, "PUT", { fields: { timetracking: { originalEstimate: "0m" } } })
      }
      if (fieldsToRestore.includes("timeestimate")) await sendJiraRequest<unknown>(`/rest/api/2/issue/${encodeURIComponent(snapshot.key)}`, "PUT", { fields: { timetracking: { remainingEstimate: secondsToJiraDuration(snapshot.fields.timeestimate) } } })
      results.push({ key: snapshot.key, ok: true })
    } catch (error) { results.push({ key: snapshot.key, ok: false, error: error instanceof Error ? error.message : "Undo failed." }) }
  }
  return results
}

export async function moveIssueKeysToBacklog(boardId: number, issueKeys: string[]) {
  if (!Number.isInteger(boardId) || boardId <= 0) throw new Error("Invalid board id.")
  const safeKeys = issueKeys.filter((key) => /^[A-Z][A-Z0-9_]*-\d+$/i.test(key))
  for (let offset = 0; offset < safeKeys.length; offset += 50) await sendJiraRequest<unknown>("/rest/agile/1.0/backlog/issue", "POST", { issues: safeKeys.slice(offset, offset + 50) })
}

export async function bulkEditIssues(issueKeys: string[], patch: JiraBulkEditPatch, boardId?: number | null) {
  const safeKeys = issueKeys.filter((key) => /^[A-Z][A-Z0-9_]*-\d+$/i.test(key))
  const results: Array<{ key: string; ok: boolean; error?: string }> = []
  for (const key of safeKeys) {
    const fields: Record<string, unknown> = {}
    if (patch.priority) fields.priority = { name: patch.priority }
    if (patch.assignee !== undefined) fields.assignee = patch.assignee ? { name: patch.assignee } : null
    if (patch.issueType) fields.issuetype = { name: patch.issueType }
    if (patch.epicLink?.fieldId) fields[patch.epicLink.fieldId] = patch.epicLink.value
    if (patch.labels) fields.labels = patch.labels
    if (patch.remainingEstimate) fields.timetracking = { remainingEstimate: patch.remainingEstimate }
    if (patch.storyPoints?.fieldId) fields[patch.storyPoints.fieldId] = patch.storyPoints.value
    for (const [fieldId, value] of Object.entries(patch.dynamicFields ?? {})) if (/^(customfield_\d+|[a-zA-Z][a-zA-Z0-9_]*)$/.test(fieldId)) fields[fieldId] = value
    try {
      if (Object.keys(fields).length) await sendJiraRequest<unknown>(`/rest/api/2/issue/${encodeURIComponent(key)}`, "PUT", { fields })
      if (patch.originalEstimate) await applyOriginalEstimate(key, patch.originalEstimate, boardId)
      results.push({ key, ok: true })
    } catch (error) { results.push({ key, ok: false, error: error instanceof Error ? error.message : "Update failed." }) }
  }
  return results
}

export async function getProjectPermissions(projectKey: string) {
  const safeProjectKey = projectKey.replace(/[^A-Za-z0-9_-]/g, "")
  if (!safeProjectKey) return { edit: false, assign: false, delete: false }
  const params = new URLSearchParams({ projectKey: safeProjectKey, permissions: "EDIT_ISSUES,ASSIGN_ISSUES,DELETE_ISSUES" })
  const response = await sendJiraRequest<{ permissions?: Record<string, { havePermission?: boolean }> }>(`/rest/api/2/mypermissions?${params.toString()}`)
  return { edit: response?.permissions?.EDIT_ISSUES?.havePermission === true, assign: response?.permissions?.ASSIGN_ISSUES?.havePermission === true, delete: response?.permissions?.DELETE_ISSUES?.havePermission === true }
}

export async function deleteJiraIssues(issueKeys: string[]) {
  const safeKeys = issueKeys.filter((key) => /^[A-Z][A-Z0-9_]*-\d+$/i.test(key))
  const results: Array<{ key: string; ok: boolean; error?: string }> = []
  for (const key of safeKeys) {
    try { await sendJiraRequest<unknown>(`/rest/api/2/issue/${encodeURIComponent(key)}?deleteSubtasks=false`, "DELETE"); results.push({ key, ok: true }) }
    catch (error) { results.push({ key, ok: false, error: error instanceof Error ? error.message : "Delete failed." }) }
  }
  return results
}
