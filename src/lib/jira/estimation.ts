import { getJiraOrigin, sendJiraRequest } from "./request"

type JiraBoardConfiguration = { estimation?: { type?: string; field?: { fieldId?: string; displayName?: string } } }
type JiraAgileEstimation = { fieldId?: string; value?: string | number | null }
type JiraIssueTimeTracking = { fields?: { timeoriginalestimate?: number | null; timetracking?: { originalEstimate?: string; originalEstimateSeconds?: number } } }

const boardConfigurationCache = new Map<string, Promise<JiraBoardConfiguration | null>>()

async function getBoardConfiguration(boardId: number): Promise<JiraBoardConfiguration | null> {
  if (!Number.isInteger(boardId) || boardId <= 0) return null
  const cacheKey = `${getJiraOrigin() || "current"}:${boardId}`
  const existing = boardConfigurationCache.get(cacheKey)
  if (existing) return existing
  const request = sendJiraRequest<JiraBoardConfiguration>(`/rest/agile/1.0/board/${encodeURIComponent(String(boardId))}/configuration`).catch(() => null)
  boardConfigurationCache.set(cacheKey, request)
  return request
}

function boardUsesOriginalTimeEstimate(configuration: JiraBoardConfiguration | null) {
  const fieldId = configuration?.estimation?.field?.fieldId?.trim().toLowerCase()
  return fieldId === "timeoriginalestimate" || fieldId === "timetracking"
}

function hasSavedTimeEstimate(issue: JiraIssueTimeTracking) {
  const seconds = issue.fields?.timeoriginalestimate ?? issue.fields?.timetracking?.originalEstimateSeconds
  if (typeof seconds === "number") return Number.isFinite(seconds) && seconds > 0
  const display = issue.fields?.timetracking?.originalEstimate
  return typeof display === "string" && Boolean(display.trim())
}

async function readSavedOriginalEstimate(issueKey: string) {
  return sendJiraRequest<JiraIssueTimeTracking>(`/rest/api/2/issue/${encodeURIComponent(issueKey)}?fields=timeoriginalestimate,timetracking`)
}

async function setOriginalEstimateViaCoreApi(issueKey: string, estimate: string) {
  await sendJiraRequest<unknown>(`/rest/api/2/issue/${encodeURIComponent(issueKey)}`, "PUT", { fields: { timetracking: { originalEstimate: estimate } } })
  if (!hasSavedTimeEstimate(await readSavedOriginalEstimate(issueKey))) throw new Error("Jira accepted the estimate update but Original Estimate was still empty when QueueMint verified the issue.")
}

async function setOriginalEstimateViaAgileApi(issueKey: string, estimate: string, boardId: number) {
  const path = `/rest/agile/1.0/issue/${encodeURIComponent(issueKey)}/estimation?boardId=${encodeURIComponent(String(boardId))}`
  const updated = await sendJiraRequest<JiraAgileEstimation>(path, "PUT", { value: estimate })
  if (updated?.value !== null && updated?.value !== undefined && String(updated.value).trim() && String(updated.value).trim() !== "0") return
  const value = (await sendJiraRequest<JiraAgileEstimation>(path))?.value
  if (value === null || value === undefined || !String(value).trim() || String(value).trim() === "0") throw new Error("Jira's board estimation endpoint did not report a saved estimate after the update.")
}

export async function applyOriginalEstimate(issueKey: string, estimate: string, boardId?: number | null) {
  const normalizedEstimate = estimate.trim()
  if (!normalizedEstimate) return
  const errors: string[] = []
  const validBoardId = typeof boardId === "number" && Number.isInteger(boardId) && boardId > 0 ? boardId : undefined
  const boardConfiguration = validBoardId ? await getBoardConfiguration(validBoardId) : null
  if (validBoardId && boardUsesOriginalTimeEstimate(boardConfiguration)) {
    try { await setOriginalEstimateViaAgileApi(issueKey, normalizedEstimate, validBoardId); return } catch (error) { errors.push(`board estimation API: ${error instanceof Error ? error.message : "update failed"}`) }
  }
  try { await setOriginalEstimateViaCoreApi(issueKey, normalizedEstimate); return } catch (error) { errors.push(`issue time-tracking API: ${error instanceof Error ? error.message : "update failed"}`) }
  if (validBoardId && !boardConfiguration) {
    try { await setOriginalEstimateViaAgileApi(issueKey, normalizedEstimate, validBoardId); return } catch (error) { errors.push(`fallback board estimation API: ${error instanceof Error ? error.message : "update failed"}`) }
  }
  const boardField = boardConfiguration?.estimation?.field
  const boardHint = boardField?.fieldId && !boardUsesOriginalTimeEstimate(boardConfiguration) ? ` The selected board estimates with '${boardField.displayName ?? boardField.fieldId}', so QueueMint kept the requested Jira duration as Original Estimate instead of writing into that field.` : ""
  throw new Error(`Could not persist Original Estimate '${normalizedEstimate}'. ${errors.join(" | ")}.${boardHint}`)
}
