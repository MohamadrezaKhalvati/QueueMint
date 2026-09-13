export type QuickAutomationActionKind = "set-priority" | "assign-to-me" | "unassign" | "move-backlog"

export type QuickAutomationActionInput = {
  kind: QuickAutomationActionKind
  priority?: string
}
