import { toast } from "sonner"

import type { AppCopy } from "@/features/app-shell/app-copy"
import {
  dynamicFieldPayload, dynamicValueLabel, isDynamicDraftReady, jiraValueLabel,
  summarizeSnapshotField, type BulkHistoryEntry, type BulkPreviewRow, type DynamicFieldDraft,
  type PendingBulkPreview,
} from "@/features/bulk/bulk-utils"
import {
  assignIssueKeysToSprint, bulkEditIssues, deleteJiraIssues, getIssueFieldSnapshots,
  getProjectPermissions, moveIssueKeysToBacklog, restoreIssueFieldSnapshots,
} from "@/lib/jira"
import type { ActivityEntry, AutomationRule } from "@/lib/storage"
import type { BulkPayload, JiraEditableField, JiraLiveIssue, JiraMetadata, JiraSprint, JiraUser } from "@/types"
import type { StateSetter } from "./types"

type BulkEditFlowOptions = {
  payload: BulkPayload | undefined; selectedBoardId: number | null; metadata: JiraMetadata | null; t: AppCopy
  liveSelectedKeys: Set<string>; liveIssues: JiraLiveIssue[]; assignableUsers: JiraUser[]; liveEpicOptions: Array<{ value: string; label: string }>; sprints: JiraSprint[]
  liveBulkPriority: string | undefined; liveBulkAssignee: string | null | undefined; liveBulkIssueType: string | undefined; liveBulkEpicLink: string | null | undefined
  liveBulkPlacement: "keep" | "sprint" | "backlog"; liveBulkSprintId: number | null; liveBulkOriginalEstimate: string; liveBulkRemainingEstimate: string; liveBulkStoryPoints: string
  liveDynamicFields: JiraEditableField[]; liveDynamicEdits: Record<string, DynamicFieldDraft>; bulkPreview: PendingBulkPreview | null; activeAutomationRuleId: string | null
  automationRules: AutomationRule[]; deleteConfirmText: string; loadLiveBoard: () => Promise<void>; resetLiveBulkDraft: () => void
  recordActivity: (input: Omit<ActivityEntry, "id" | "createdAt" | "projectKey" | "boardId">) => void
  setBulkPreviewLoading: StateSetter<boolean>; setLiveActionMessage: StateSetter<string | null>; setBulkPreview: StateSetter<PendingBulkPreview | null>; setLiveBulkOpen: StateSetter<boolean>
  setBulkPreviewOpen: StateSetter<boolean>; setBulkApplying: StateSetter<boolean>; setBulkHistory: StateSetter<BulkHistoryEntry[]>; setActiveAutomationRuleId: StateSetter<string | null>
  setUndoingHistoryId: StateSetter<string | null>; setLastCreatedKeys: StateSetter<string[]>; setLiveSelectedKeys: StateSetter<Set<string>>; setDeleteDialogOpen: StateSetter<boolean>; setDeleteConfirmText: StateSetter<string>
}

export function useBulkEditFlow(options: BulkEditFlowOptions) {
  const {
    payload, selectedBoardId, metadata, t, liveSelectedKeys, liveIssues, assignableUsers, liveEpicOptions, sprints,
    liveBulkPriority, liveBulkAssignee, liveBulkIssueType, liveBulkEpicLink, liveBulkPlacement, liveBulkSprintId,
    liveBulkOriginalEstimate, liveBulkRemainingEstimate, liveBulkStoryPoints, liveDynamicFields, liveDynamicEdits,
    bulkPreview, activeAutomationRuleId, automationRules, deleteConfirmText, loadLiveBoard, resetLiveBulkDraft,
    recordActivity, setBulkPreviewLoading, setLiveActionMessage, setBulkPreview, setLiveBulkOpen, setBulkPreviewOpen,
    setBulkApplying, setBulkHistory, setActiveAutomationRuleId, setUndoingHistoryId, setLastCreatedKeys,
    setLiveSelectedKeys, setDeleteDialogOpen, setDeleteConfirmText,
  } = options

  function buildLiveBulkPatch() {
    const patch: import("@/types").JiraBulkEditPatch = {}
    if (liveBulkPriority !== undefined) patch.priority = liveBulkPriority
    if (liveBulkAssignee !== undefined) patch.assignee = liveBulkAssignee
    if (liveBulkIssueType !== undefined) patch.issueType = liveBulkIssueType
    if (liveBulkEpicLink !== undefined && metadata?.detectedFieldMap.epicLink) patch.epicLink = { fieldId: metadata.detectedFieldMap.epicLink, value: liveBulkEpicLink }
    if (liveBulkOriginalEstimate.trim()) patch.originalEstimate = liveBulkOriginalEstimate.trim()
    if (liveBulkRemainingEstimate.trim()) patch.remainingEstimate = liveBulkRemainingEstimate.trim()
    if (liveBulkStoryPoints.trim() && metadata?.estimation.storyPointsFieldId) {
      const value = Number(liveBulkStoryPoints)
      if (!Number.isFinite(value) || value < 0) throw new Error(`${t.storyPoints}: ${liveBulkStoryPoints}`)
      patch.storyPoints = { fieldId: metadata.estimation.storyPointsFieldId, value }
    }
    const dynamicFields: Record<string, unknown> = {}
    for (const [fieldId, draft] of Object.entries(liveDynamicEdits)) {
      const field = liveDynamicFields.find((item) => item.id === fieldId)
      if (!field) continue
      if (!isDynamicDraftReady(field, draft)) throw new Error(`${field.name}: ${field.required ? t.fieldRequired : t.setValue}`)
      dynamicFields[fieldId] = dynamicFieldPayload(field, draft)
    }
    if (Object.keys(dynamicFields).length) patch.dynamicFields = dynamicFields
    return patch
  }

  async function prepareLiveBulkEdit() {
    const keys = Array.from(liveSelectedKeys)
    if (!keys.length || !payload?.project) return
    let patch: import("@/types").JiraBulkEditPatch
    try { patch = buildLiveBulkPatch() }
    catch (error) { toast.error(t.updatePartial, { description: error instanceof Error ? error.message : t.updatePartial }); return }
    if (!Object.keys(patch).length && liveBulkPlacement === "keep") return
    if (liveBulkPlacement === "sprint" && !liveBulkSprintId) return

    setBulkPreviewLoading(true)
    setLiveActionMessage(null)
    try {
      const permissions = await getProjectPermissions(payload.project)
      const editsFields = patch.priority !== undefined || patch.issueType !== undefined || patch.epicLink !== undefined || patch.originalEstimate !== undefined || patch.remainingEstimate !== undefined || patch.storyPoints !== undefined || Boolean(Object.keys(patch.dynamicFields ?? {}).length)
      if ((editsFields && !permissions.edit) || (patch.assignee !== undefined && !permissions.assign)) throw new Error(t.permissionsDenied)
      const fieldIds = Array.from(new Set([
        ...(patch.priority !== undefined ? ["priority"] : []), ...(patch.assignee !== undefined ? ["assignee"] : []),
        ...(patch.issueType !== undefined ? ["issuetype"] : []), ...(patch.epicLink?.fieldId ? [patch.epicLink.fieldId] : []),
        ...(patch.originalEstimate !== undefined ? ["timeoriginalestimate"] : []), ...(patch.remainingEstimate !== undefined ? ["timeestimate"] : []),
        ...(patch.storyPoints?.fieldId ? [patch.storyPoints.fieldId] : []), ...Object.keys(patch.dynamicFields ?? {}),
      ]))
      const snapshots = fieldIds.length ? await getIssueFieldSnapshots(keys, fieldIds) : []
      if (fieldIds.length && snapshots.length !== keys.length) throw new Error(`QueueMint could only snapshot ${snapshots.length}/${keys.length} selected Jira issues. No changes were applied.`)
      const placements = liveIssues.filter((issue) => liveSelectedKeys.has(issue.key)).map((issue) => ({ key: issue.key, placement: issue.placement, sprintId: issue.sprintId }))
      const rows: BulkPreviewRow[] = []
      const addFieldRow = (id: string, label: string, after: unknown) => rows.push({ id, label, before: summarizeSnapshotField(snapshots, id, t.mixedValues), after: jiraValueLabel(after) })
      if (patch.issueType !== undefined) addFieldRow("issuetype", t.editIssueType, patch.issueType)
      if (patch.priority !== undefined) addFieldRow("priority", t.editPriority, patch.priority)
      if (patch.assignee !== undefined) addFieldRow("assignee", t.editAssignee, patch.assignee === null ? t.unassign : assignableUsers.find((user) => (user.name || user.key) === patch.assignee)?.displayName ?? patch.assignee)
      if (patch.epicLink?.fieldId) addFieldRow(patch.epicLink.fieldId, t.editEpicLink, patch.epicLink.value === null ? t.removeEpicLink : liveEpicOptions.find((option) => option.value === patch.epicLink?.value)?.label ?? patch.epicLink.value)
      if (patch.originalEstimate !== undefined) addFieldRow("timeoriginalestimate", t.originalEstimate, patch.originalEstimate)
      if (patch.remainingEstimate !== undefined) addFieldRow("timeestimate", t.remainingEstimate, patch.remainingEstimate)
      if (patch.storyPoints?.fieldId) addFieldRow(patch.storyPoints.fieldId, metadata?.estimation.storyPointsFieldName ?? t.storyPoints, patch.storyPoints.value)
      for (const [fieldId, value] of Object.entries(patch.dynamicFields ?? {})) {
        const field = liveDynamicFields.find((item) => item.id === fieldId)
        rows.push({ id: fieldId, label: field?.name ?? fieldId, before: summarizeSnapshotField(snapshots, fieldId, t.mixedValues), after: field ? dynamicValueLabel(field, value) : jiraValueLabel(value) })
      }
      if (liveBulkPlacement !== "keep") {
        const before = Array.from(new Set(placements.map((item) => item.placement === "backlog" ? t.backlog : sprints.find((sprint) => sprint.id === item.sprintId)?.name ?? t.sprint)))
        const after = liveBulkPlacement === "backlog" ? t.backlog : sprints.find((sprint) => sprint.id === liveBulkSprintId)?.name ?? t.sprint
        rows.push({ id: "__placement__", label: t.editPlacement, before: before.length === 1 ? before[0] : t.mixedValues, after })
      }
      setBulkPreview({ keys, patch, fieldIds, snapshots, placements, targetPlacement: liveBulkPlacement, targetSprintId: liveBulkSprintId, boardId: selectedBoardId, rows })
      setLiveBulkOpen(false); setBulkPreviewOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.updatePartial
      setLiveActionMessage(message); toast.error(t.updatePartial, { description: message })
    } finally { setBulkPreviewLoading(false) }
  }

  async function executeLiveBulkEdit() {
    const preview = bulkPreview
    if (!preview || !payload?.project) return
    setBulkApplying(true); setLiveActionMessage(null)
    try {
      const permissions = await getProjectPermissions(payload.project)
      const editsFields = preview.fieldIds.some((fieldId) => fieldId !== "assignee")
      if ((editsFields && !permissions.edit) || (preview.patch.assignee !== undefined && !permissions.assign)) throw new Error(t.permissionsDenied)
      let fieldResults: Array<{ key: string; ok: boolean; error?: string }> = []
      if (Object.keys(preview.patch).length) fieldResults = await bulkEditIssues(preview.keys, preview.patch, preview.boardId)
      if (preview.targetPlacement === "sprint" && typeof preview.targetSprintId === "number") await assignIssueKeysToSprint(preview.targetSprintId, preview.keys)
      if (preview.targetPlacement === "backlog" && preview.boardId) await moveIssueKeysToBacklog(preview.boardId, preview.keys)
      const allFieldsOk = fieldResults.length === 0 || fieldResults.every((item) => item.ok)
      setBulkHistory((current) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), keys: preview.keys, fieldIds: preview.fieldIds, snapshots: preview.snapshots, placements: preview.placements, boardId: preview.boardId, changes: preview.rows.map((row) => row.label) }, ...current].slice(0, 8))
      await loadLiveBoard()
      setLiveActionMessage(allFieldsOk ? t.updateComplete : t.updatePartial)
      const automationRule = activeAutomationRuleId ? automationRules.find((rule) => rule.id === activeAutomationRuleId) : undefined
      recordActivity({ kind: automationRule ? "automation" : "bulk-edit", outcome: allFieldsOk ? "success" : "warning", title: automationRule ? `Automation: ${automationRule.name}` : "Bulk edit applied", detail: preview.rows.map((row) => row.label).join(", "), issueKeys: preview.keys, automationRuleId: automationRule?.id })
      setActiveAutomationRuleId(null); resetLiveBulkDraft(); setBulkPreviewOpen(false); setBulkPreview(null)
      if (allFieldsOk) toast.success(t.updateSucceeded, { description: `${preview.keys.length} ${t.issues}` }); else toast.warning(t.updatePartial)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.updatePartial
      setLiveActionMessage(message); toast.error(t.updatePartial, { description: message })
    } finally { setBulkApplying(false) }
  }

  async function undoBulkHistory(entry: BulkHistoryEntry) {
    setUndoingHistoryId(entry.id); setLiveActionMessage(null)
    try {
      const fieldResults = entry.fieldIds.length ? await restoreIssueFieldSnapshots(entry.snapshots, entry.fieldIds, entry.boardId) : []
      let placementOk = true
      try {
        const backlogKeys = entry.placements.filter((item) => item.placement === "backlog").map((item) => item.key)
        if (backlogKeys.length && entry.boardId) await moveIssueKeysToBacklog(entry.boardId, backlogKeys)
        const sprintGroups = new Map<number, string[]>()
        for (const placement of entry.placements) {
          if (placement.placement !== "sprint" || typeof placement.sprintId !== "number") continue
          sprintGroups.set(placement.sprintId, [...(sprintGroups.get(placement.sprintId) ?? []), placement.key])
        }
        for (const [sprintId, keys] of sprintGroups) await assignIssueKeysToSprint(sprintId, keys)
      } catch { placementOk = false }
      const complete = (fieldResults.length === 0 || fieldResults.every((item) => item.ok)) && placementOk
      if (entry.boardId === selectedBoardId) await loadLiveBoard()
      setLiveActionMessage(complete ? t.undoComplete : t.undoPartial)
      recordActivity({ kind: "undo", outcome: complete ? "success" : "warning", title: "Bulk edit undone", detail: entry.changes.join(", "), issueKeys: entry.keys })
      if (complete) { setBulkHistory((current) => current.filter((item) => item.id !== entry.id)); toast.success(t.undoComplete) } else toast.warning(t.undoPartial)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.undoPartial
      setLiveActionMessage(message); toast.error(t.undoPartial, { description: message })
    } finally { setUndoingHistoryId(null) }
  }

  async function deleteLiveSelection() {
    const keys = Array.from(liveSelectedKeys)
    if (!keys.length || !payload?.project || deleteConfirmText !== "DELETE") return
    setLiveActionMessage(null)
    try {
      const permissions = await getProjectPermissions(payload.project)
      if (!permissions.delete) throw new Error(t.permissionsDenied)
      const results = await deleteJiraIssues(keys)
      const deleted = new Set(results.filter((item) => item.ok).map((item) => item.key))
      setLastCreatedKeys((current) => current.filter((key) => !deleted.has(key))); setLiveSelectedKeys(new Set())
      setDeleteDialogOpen(false); setDeleteConfirmText(""); await loadLiveBoard()
      const complete = results.every((item) => item.ok)
      setLiveActionMessage(complete ? t.deleteComplete : t.updatePartial)
      recordActivity({ kind: "delete", outcome: complete ? "success" : "warning", title: "Deleted Jira issues", detail: `${deleted.size}/${keys.length} ${t.issues}`, issueKeys: keys })
      if (complete) toast.success(t.deleteSucceeded, { description: `${deleted.size} ${t.issues}` }); else toast.warning(t.updatePartial)
    } catch (error) { setLiveActionMessage(error instanceof Error ? error.message : t.updatePartial) }
  }

  return { buildLiveBulkPatch, prepareLiveBulkEdit, executeLiveBulkEdit, undoBulkHistory, deleteLiveSelection }
}
