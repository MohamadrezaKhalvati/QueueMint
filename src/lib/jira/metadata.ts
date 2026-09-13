import type { JiraBoard, JiraField, JiraMetadata, JiraPage, JiraPriority, JiraProject, JiraServerInfo, JiraSprint, JiraUser } from "@/types"
import { sendJiraRequest } from "./request"

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
