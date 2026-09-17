import { sendJiraRequest } from "./request"
import { pickJiraTransitionForBoardColumn, type JiraTransition } from "./transition-utils"

type JiraTransitionsResponse = { transitions?: JiraTransition[] }

function safeIssueKey(value: string) {
  if (!/^[A-Z][A-Z0-9_]*-\d+$/i.test(value)) throw new Error("Invalid Jira issue key.")
  return value
}

export async function transitionIssueToBoardColumn(issueKey: string, statusIds: string[], columnName: string) {
  const key = safeIssueKey(issueKey)
  const path = `/rest/api/2/issue/${encodeURIComponent(key)}/transitions`
  const response = await sendJiraRequest<JiraTransitionsResponse>(path)
  const transitions = Array.isArray(response?.transitions) ? response.transitions : []
  const transition = pickJiraTransitionForBoardColumn(transitions, statusIds, columnName)
  if (!transition?.id) throw new Error(`No available Jira transition from ${key} to ${columnName}.`)
  await sendJiraRequest<unknown>(path, "POST", { transition: { id: transition.id } })
  return { id: transition.id, name: transition.name, to: transition.to }
}
