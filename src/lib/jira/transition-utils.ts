export type JiraTransition = {
  id?: string
  name?: string
  to?: { id?: string; name?: string }
}

export function pickJiraTransitionForBoardColumn(transitions: JiraTransition[], statusIds: string[], columnName: string) {
  const allowed = new Set(statusIds.filter(Boolean))
  const byStatus = transitions.find((item) => item.id && item.to?.id && allowed.has(item.to.id))
  if (byStatus) return byStatus
  const targetName = columnName.trim().toLowerCase()
  if (!targetName) return undefined
  return transitions.find((item) => item.id && item.to?.name?.trim().toLowerCase() === targetName)
}
