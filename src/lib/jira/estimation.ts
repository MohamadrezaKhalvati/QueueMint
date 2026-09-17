import { getJiraOrigin, sendJiraRequest } from "./request"

type JiraBoardConfiguration = { estimation?: { type?: string; field?: { fieldId?: string; displayName?: string } } }
type JiraAgileEstimation = { fieldId?: string; value?: string | number | null }
type JiraTimeTrackingConfig = { workingDaysPerWeek?: number; workingHoursPerDay?: number }
type JiraIssueTimeTracking = {
  fields?: {
    timeoriginalestimate?: number | null
    timeestimate?: number | null
    timetracking?: {
      originalEstimate?: string
      originalEstimateSeconds?: number
      remainingEstimate?: string
      remainingEstimateSeconds?: number
    }
  }
}
type EstimatePatch = { originalEstimate?: string; remainingEstimate?: string }

const boardConfigurationCache = new Map<string, Promise<JiraBoardConfiguration | null>>()
const timeTrackingConfigurationCache = new Map<string, Promise<JiraTimeTrackingConfig>>()
const DEFAULT_TIME_TRACKING: Required<JiraTimeTrackingConfig> = { workingDaysPerWeek: 5, workingHoursPerDay: 8 }

async function getBoardConfiguration(boardId: number): Promise<JiraBoardConfiguration | null> {
  if (!Number.isInteger(boardId) || boardId <= 0) return null
  const cacheKey = `${getJiraOrigin() || "current"}:${boardId}`
  const existing = boardConfigurationCache.get(cacheKey)
  if (existing) return existing
  const request = sendJiraRequest<JiraBoardConfiguration>(`/rest/agile/1.0/board/${encodeURIComponent(String(boardId))}/configuration`).catch(() => null)
  boardConfigurationCache.set(cacheKey, request)
  return request
}

async function getTimeTrackingConfiguration(): Promise<Required<JiraTimeTrackingConfig>> {
  const cacheKey = getJiraOrigin() || "current"
  const existing = timeTrackingConfigurationCache.get(cacheKey)
  if (existing) return { ...DEFAULT_TIME_TRACKING, ...(await existing) }
  const request = sendJiraRequest<{ timeTrackingConfiguration?: JiraTimeTrackingConfig }>("/rest/api/2/configuration")
    .then((response) => response?.timeTrackingConfiguration ?? DEFAULT_TIME_TRACKING)
    .catch(() => DEFAULT_TIME_TRACKING)
  timeTrackingConfigurationCache.set(cacheKey, request)
  return { ...DEFAULT_TIME_TRACKING, ...(await request) }
}

export async function canSetOriginalEstimateViaBoard(boardId?: number | null) {
  if (typeof boardId !== "number" || !Number.isInteger(boardId) || boardId <= 0) return false
  return boardUsesOriginalTimeEstimate(await getBoardConfiguration(boardId))
}

function boardUsesOriginalTimeEstimate(configuration: JiraBoardConfiguration | null) {
  const fieldId = configuration?.estimation?.field?.fieldId?.trim().toLowerCase()
  return fieldId === "timeoriginalestimate" || fieldId === "timetracking"
}

function normalizeEstimatePatch(patch: EstimatePatch): EstimatePatch {
  const originalEstimate = patch.originalEstimate?.trim()
  const remainingEstimate = patch.remainingEstimate?.trim()
  return {
    ...(originalEstimate ? { originalEstimate } : {}),
    ...(remainingEstimate ? { remainingEstimate } : {}),
  }
}

function jiraEstimateSeconds(value: string, config: Required<JiraTimeTrackingConfig>) {
  const compact = value.replace(/\s+/g, "").toLowerCase()
  const matches = Array.from(value.toLowerCase().matchAll(/(\d+)\s*([wdhm])/g))
  if (!matches.length || matches.map((match) => `${match[1]}${match[2]}`).join("") !== compact) return null
  const daySeconds = Math.round(config.workingHoursPerDay * 3600)
  const weekSeconds = Math.round(config.workingDaysPerWeek * daySeconds)
  return matches.reduce((sum, match) => {
    const amount = Number(match[1])
    const unit = match[2]
    return sum + amount * (unit === "w" ? weekSeconds : unit === "d" ? daySeconds : unit === "h" ? 3600 : 60)
  }, 0)
}

async function readSavedTimeTracking(issueKey: string) {
  return sendJiraRequest<JiraIssueTimeTracking>(`/rest/api/2/issue/${encodeURIComponent(issueKey)}?fields=timeoriginalestimate,timeestimate,timetracking`)
}

function savedEstimateSeconds(issue: JiraIssueTimeTracking, field: keyof EstimatePatch) {
  const time = issue.fields?.timetracking
  return field === "originalEstimate"
    ? issue.fields?.timeoriginalestimate ?? time?.originalEstimateSeconds
    : issue.fields?.timeestimate ?? time?.remainingEstimateSeconds
}

function savedEstimateText(issue: JiraIssueTimeTracking, field: keyof EstimatePatch) {
  const time = issue.fields?.timetracking
  return field === "originalEstimate" ? time?.originalEstimate : time?.remainingEstimate
}

async function verifySavedEstimate(issueKey: string, field: keyof EstimatePatch, requested: string) {
  const config = await getTimeTrackingConfiguration()
  const expectedSeconds = jiraEstimateSeconds(requested, config)
  let actual: JiraIssueTimeTracking | null = null
  for (const delay of [0, 140, 320]) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    actual = await readSavedTimeTracking(issueKey)
    const seconds = savedEstimateSeconds(actual, field)
    if (expectedSeconds !== null && typeof seconds === "number" && Math.abs(seconds - expectedSeconds) <= 1) return
    if (expectedSeconds === null && savedEstimateText(actual, field)?.replace(/\s+/g, "").toLowerCase() === requested.replace(/\s+/g, "").toLowerCase()) return
  }
  const label = field === "originalEstimate" ? "Original Estimate" : "Remaining Estimate"
  const actualValue = savedEstimateText(actual ?? {}, field) ?? String(savedEstimateSeconds(actual ?? {}, field) ?? "empty")
  throw new Error(`Jira accepted the update but ${label} is '${actualValue}' instead of '${requested}'.`)
}

async function verifyTimeTrackingPatch(issueKey: string, patch: EstimatePatch) {
  const normalized = normalizeEstimatePatch(patch)
  if (normalized.originalEstimate) await verifySavedEstimate(issueKey, "originalEstimate", normalized.originalEstimate)
  if (normalized.remainingEstimate) await verifySavedEstimate(issueKey, "remainingEstimate", normalized.remainingEstimate)
}

async function setTimeTrackingViaCoreApi(issueKey: string, patch: EstimatePatch) {
  const normalized = normalizeEstimatePatch(patch)
  if (!Object.keys(normalized).length) return
  const path = `/rest/api/2/issue/${encodeURIComponent(issueKey)}`
  const errors: string[] = []
  try {
    await sendJiraRequest<unknown>(path, "PUT", { fields: { timetracking: normalized } })
    await verifyTimeTrackingPatch(issueKey, normalized)
    return
  } catch (error) { errors.push(`fields.timetracking: ${error instanceof Error ? error.message : "update failed"}`) }
  try {
    await sendJiraRequest<unknown>(path, "PUT", { update: { timetracking: [{ edit: normalized }] } })
    await verifyTimeTrackingPatch(issueKey, normalized)
    return
  } catch (error) { errors.push(`update.timetracking: ${error instanceof Error ? error.message : "update failed"}`) }
  throw new Error(errors.join(" | "))
}

async function setOriginalEstimateViaAgileApi(issueKey: string, estimate: string, boardId: number) {
  const path = `/rest/agile/1.0/issue/${encodeURIComponent(issueKey)}/estimation?boardId=${encodeURIComponent(String(boardId))}`
  const updated = await sendJiraRequest<JiraAgileEstimation>(path, "PUT", { value: estimate })
  if (updated?.value === null || updated?.value === undefined || String(updated.value).trim() === "") {
    const value = (await sendJiraRequest<JiraAgileEstimation>(path))?.value
    if (value === null || value === undefined || String(value).trim() === "") throw new Error("Jira's board estimation endpoint did not report a saved estimate after the update.")
  }
  await verifySavedEstimate(issueKey, "originalEstimate", estimate)
}

export async function applyOriginalEstimate(issueKey: string, estimate: string, boardId?: number | null) {
  const normalizedEstimate = estimate.trim()
  if (!normalizedEstimate) return
  const errors: string[] = []
  const validBoardId = typeof boardId === "number" && Number.isInteger(boardId) && boardId > 0 ? boardId : undefined
  const boardConfiguration = validBoardId ? await getBoardConfiguration(validBoardId) : null
  if (validBoardId && boardUsesOriginalTimeEstimate(boardConfiguration)) {
    try { await setOriginalEstimateViaAgileApi(issueKey, normalizedEstimate, validBoardId); return }
    catch (error) { errors.push(`board estimation API: ${error instanceof Error ? error.message : "update failed"}`) }
  }
  try { await setTimeTrackingViaCoreApi(issueKey, { originalEstimate: normalizedEstimate }); return }
  catch (error) { errors.push(`issue time-tracking API: ${error instanceof Error ? error.message : "update failed"}`) }
  if (validBoardId && !boardConfiguration) {
    try { await setOriginalEstimateViaAgileApi(issueKey, normalizedEstimate, validBoardId); return }
    catch (error) { errors.push(`fallback board estimation API: ${error instanceof Error ? error.message : "update failed"}`) }
  }
  const boardField = boardConfiguration?.estimation?.field
  const boardHint = boardField?.fieldId && !boardUsesOriginalTimeEstimate(boardConfiguration) ? ` The selected board estimates with '${boardField.displayName ?? boardField.fieldId}', so QueueMint kept the requested Jira duration as Original Estimate instead of writing into that field.` : ""
  throw new Error(`Could not persist Original Estimate '${normalizedEstimate}'. ${errors.join(" | ")}.${boardHint}`)
}

export async function applyRemainingEstimate(issueKey: string, estimate: string) {
  const normalizedEstimate = estimate.trim()
  if (!normalizedEstimate) return
  try { await setTimeTrackingViaCoreApi(issueKey, { remainingEstimate: normalizedEstimate }) }
  catch (error) { throw new Error(`Could not persist Remaining Estimate '${normalizedEstimate}'. ${error instanceof Error ? error.message : "update failed"}`) }
}

export async function applyTimeTrackingEstimates(issueKey: string, patch: EstimatePatch, boardId?: number | null) {
  const normalized = normalizeEstimatePatch(patch)
  if (!normalized.originalEstimate && !normalized.remainingEstimate) return
  if (normalized.originalEstimate && normalized.remainingEstimate) {
    try { await setTimeTrackingViaCoreApi(issueKey, normalized); return }
    catch {
      await applyOriginalEstimate(issueKey, normalized.originalEstimate, boardId)
      await applyRemainingEstimate(issueKey, normalized.remainingEstimate)
      return
    }
  }
  if (normalized.originalEstimate) await applyOriginalEstimate(issueKey, normalized.originalEstimate, boardId)
  if (normalized.remainingEstimate) await applyRemainingEstimate(issueKey, normalized.remainingEstimate)
}
