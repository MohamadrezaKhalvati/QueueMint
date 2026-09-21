import type { JiraBoard, JiraField, JiraMetadata, JiraPage, JiraPriority, JiraProject, JiraServerInfo, JiraSprint, JiraUser } from "@/types"
import { sendJiraRequest } from "./request"

type JiraCreateMetaField = {
  required?: boolean
  name?: string
  fieldId?: string
  operations?: string[]
  schema?: JiraField["schema"]
}

type JiraCreateMetaResponse = {
  projects?: Array<{
    key?: string
    issuetypes?: Array<{
      id?: string
      name?: string
      fields?: Record<string, JiraCreateMetaField>
    }>
  }>
}

export type JiraCreateFieldInfo = {
  id: string
  name: string
  required: boolean
  operations: string[]
  schema?: JiraField["schema"]
}

export type JiraCreateIssueTypeFields = {
  id?: string
  name: string
  fields: Record<string, JiraCreateFieldInfo>
}

export type JiraCreateFieldMatrix = Record<string, JiraCreateIssueTypeFields>

let createFieldCache = new Map<string, Promise<JiraCreateFieldMatrix>>()

export async function discoverJira(): Promise<JiraMetadata> {
  const [server, user, projects, fields, priorities, configuration] = await Promise.all([
    sendJiraRequest<JiraServerInfo>("/rest/api/2/serverInfo"),
    sendJiraRequest<JiraUser>("/rest/api/2/myself"),
    sendJiraRequest<JiraProject[]>("/rest/api/2/project"),
    sendJiraRequest<JiraField[]>("/rest/api/2/field"),
    sendJiraRequest<JiraPriority[]>("/rest/api/2/priority"),
    sendJiraRequest<{ timeTrackingEnabled?: boolean }>("/rest/api/2/configuration").catch(() => undefined),
  ])
  const epicLink = fields.find((field) => {
    const name = field.name.trim().toLowerCase(); const custom = field.schema?.custom?.toLowerCase() ?? ""
    return name === "epic link" || custom.includes("gh-epic-link")
  })?.id
  const epicName = fields.find((field) => field.name.toLowerCase() === "epic name")?.id
  const storyPointsField = fields.find((field) => ["story points", "story point estimate", "story point"].includes(field.name.trim().toLowerCase()))
  const hasTimeTrackingField = fields.some((field) => {
    const id = field.id.toLowerCase(); const name = field.name.trim().toLowerCase()
    return id === "timetracking" || id === "timeoriginalestimate" || id === "timeestimate" || name === "time tracking" || name === "original estimate" || name === "remaining estimate"
  })
  return {
    connected: true, user, server, projects: projects.sort((a, b) => a.name.localeCompare(b.name)), fields, priorities,
    detectedFieldMap: { epicLink, epicName },
    estimation: { storyPointsFieldId: storyPointsField?.id, storyPointsFieldName: storyPointsField?.name, timeTracking: configuration?.timeTrackingEnabled ?? hasTimeTrackingField },
  }
}

export async function getProject(projectKey: string) {
  return sendJiraRequest<JiraProject>(`/rest/api/2/project/${encodeURIComponent(projectKey)}?expand=issueTypes`)
}

export async function getBoardsForProject(projectKey: string) {
  const page = await sendJiraRequest<JiraPage<JiraBoard>>(`/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(projectKey)}&maxResults=100`)
  return Array.isArray(page?.values) ? page.values : []
}

export async function getSprintsForBoard(boardId: number) {
  const page = await sendJiraRequest<JiraPage<JiraSprint>>(`/rest/agile/1.0/board/${encodeURIComponent(String(boardId))}/sprint?state=active,future&maxResults=100`)
  return Array.isArray(page?.values) ? page.values : []
}

export async function getCreateMeta(projectKey: string) {
  const path = `/rest/api/2/issue/createmeta?projectKeys=${encodeURIComponent(projectKey)}&expand=projects.issuetypes.fields`
  return sendJiraRequest<unknown>(path)
}

function normalizeCreateMeta(raw: unknown, projectKey: string): JiraCreateFieldMatrix {
  const response = raw as JiraCreateMetaResponse
  const project = response?.projects?.find((item) => item.key?.toLowerCase() === projectKey.toLowerCase()) ?? response?.projects?.[0]
  const matrix: JiraCreateFieldMatrix = {}
  for (const issueType of project?.issuetypes ?? []) {
    const name = issueType.name?.trim()
    if (!name) continue
    const fields: Record<string, JiraCreateFieldInfo> = {}
    for (const [key, value] of Object.entries(issueType.fields ?? {})) {
      const id = String(value.fieldId || key).trim()
      if (!id) continue
      fields[id] = {
        id,
        name: String(value.name || id),
        required: Boolean(value.required),
        operations: Array.isArray(value.operations) ? value.operations.filter((item): item is string => typeof item === "string") : [],
        schema: value.schema,
      }
    }
    matrix[name.toLowerCase()] = { id: issueType.id, name, fields }
  }
  return matrix
}

export async function getCreateFieldMatrix(projectKey: string) {
  const cacheKey = projectKey.trim().toLowerCase()
  const cached = createFieldCache.get(cacheKey)
  if (cached) return cached
  const pending = getCreateMeta(projectKey).then((raw) => normalizeCreateMeta(raw, projectKey))
  createFieldCache.set(cacheKey, pending)
  try { return await pending }
  catch (error) { createFieldCache.delete(cacheKey); throw error }
}

export async function getCreateFieldsForIssueType(projectKey: string, issueType: string) {
  const matrix = await getCreateFieldMatrix(projectKey)
  return matrix[issueType.trim().toLowerCase()] ?? null
}

export function clearCreateFieldCache(projectKey?: string) {
  if (projectKey) createFieldCache.delete(projectKey.trim().toLowerCase())
  else createFieldCache = new Map<string, Promise<JiraCreateFieldMatrix>>()
}
