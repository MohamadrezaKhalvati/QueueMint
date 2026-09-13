import { toast } from "sonner"

import type { AppCopy } from "@/features/app-shell/app-copy"
import type { QuickAutomationActionInput } from "@/features/automation/automation-types"
import type { DynamicFieldDraft, Mode } from "@/features/bulk/bulk-utils"
import { matchingIssuesForRule } from "@/lib/intelligence"
import type { AutomationConditionKind, AutomationRule, SavedIssueView, SavedWorkspaceAction } from "@/lib/storage"
import type { AppLocale, BulkPayload, JiraLiveIssue, JiraMetadata } from "@/types"
import type { StateSetter } from "./types"

type WorkspaceAutomationOptions = {
  payload: BulkPayload | undefined
  selectedBoardId: number | null
  metadata: JiraMetadata | null
  locale: AppLocale
  t: AppCopy
  liveSelectedKeys: Set<string>
  liveIssues: JiraLiveIssue[]
  savedActions: SavedWorkspaceAction[]
  liveBulkPriority: string | undefined
  liveBulkAssignee: string | null | undefined
  liveBulkIssueType: string | undefined
  liveBulkEpicLink: string | null | undefined
  liveBulkPlacement: "keep" | "sprint" | "backlog"
  liveBulkSprintId: number | null
  liveBulkOriginalEstimate: string
  liveBulkRemainingEstimate: string
  liveBulkStoryPoints: string
  liveDynamicEdits: Record<string, DynamicFieldDraft>
  setSavedActions: StateSetter<SavedWorkspaceAction[]>
  setSavedViews: StateSetter<SavedIssueView[]>
  setAutomationRules: StateSetter<AutomationRule[]>
  setMode: StateSetter<Mode>
  setActiveAutomationRuleId: StateSetter<string | null>
  setLiveBulkOpen: StateSetter<boolean>
  setLiveSelectedKeys: StateSetter<Set<string>>
  setLiveBulkPriority: StateSetter<string | undefined>
  setLiveBulkAssignee: StateSetter<string | null | undefined>
  setLiveBulkIssueType: StateSetter<string | undefined>
  setLiveBulkEpicLink: StateSetter<string | null | undefined>
  setLiveBulkPlacement: StateSetter<"keep" | "sprint" | "backlog">
  setLiveBulkSprintId: StateSetter<number | null>
  setLiveBulkOriginalEstimate: StateSetter<string>
  setLiveBulkRemainingEstimate: StateSetter<string>
  setLiveBulkStoryPoints: StateSetter<string>
  setLiveDynamicEdits: StateSetter<Record<string, DynamicFieldDraft>>
}

export function useWorkspaceAutomation(options: WorkspaceAutomationOptions) {
  const {
    payload, selectedBoardId, metadata, locale, t, liveSelectedKeys, liveIssues, savedActions,
    liveBulkPriority, liveBulkAssignee, liveBulkIssueType, liveBulkEpicLink, liveBulkPlacement,
    liveBulkSprintId, liveBulkOriginalEstimate, liveBulkRemainingEstimate, liveBulkStoryPoints,
    liveDynamicEdits, setSavedActions, setSavedViews, setAutomationRules, setMode,
    setActiveAutomationRuleId, setLiveBulkOpen, setLiveSelectedKeys, setLiveBulkPriority,
    setLiveBulkAssignee, setLiveBulkIssueType, setLiveBulkEpicLink, setLiveBulkPlacement,
    setLiveBulkSprintId, setLiveBulkOriginalEstimate, setLiveBulkRemainingEstimate,
    setLiveBulkStoryPoints, setLiveDynamicEdits,
  } = options

  function resetLiveBulkDraft() {
    setLiveBulkPriority(undefined)
    setLiveBulkAssignee(undefined)
    setLiveBulkIssueType(undefined)
    setLiveBulkEpicLink(undefined)
    setLiveBulkPlacement("keep")
    setLiveBulkSprintId(null)
    setLiveBulkOriginalEstimate("")
    setLiveBulkRemainingEstimate("")
    setLiveBulkStoryPoints("")
    setLiveDynamicEdits({})
  }

  function saveCurrentLiveBulkAction(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const action: SavedWorkspaceAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed.slice(0, 80), createdAt: new Date().toISOString(), projectKey: payload?.project,
      boardId: selectedBoardId, priority: liveBulkPriority, assignee: liveBulkAssignee,
      issueType: liveBulkIssueType, epicLink: liveBulkEpicLink, placement: liveBulkPlacement,
      sprintId: liveBulkSprintId, originalEstimate: liveBulkOriginalEstimate.trim() || undefined,
      remainingEstimate: liveBulkRemainingEstimate.trim() || undefined,
      storyPoints: liveBulkStoryPoints.trim() || undefined,
      dynamicEdits: Object.keys(liveDynamicEdits).length ? structuredClone(liveDynamicEdits) : undefined,
    }
    setSavedActions((current) => [action, ...current].slice(0, 12))
    toast.success(t.actionSaved, { description: action.name })
  }

  function deleteSavedAction(id: string) {
    setSavedActions((current) => current.filter((action) => action.id !== id))
    setAutomationRules((current) => current.filter((rule) => rule.actionId !== id))
    toast.success(t.actionDeleted)
  }

  function createQuickAutomationAction(input: QuickAutomationActionInput) {
    if (!payload?.project || !selectedBoardId) return locale === "fa" ? "اول یک پروژه و بورد انتخاب کن." : "Choose a project and board first."
    const identity = metadata?.user?.name || metadata?.user?.key
    const base: SavedWorkspaceAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "",
      createdAt: new Date().toISOString(), projectKey: payload.project, boardId: selectedBoardId, placement: "keep",
    }
    if (input.kind === "set-priority") {
      if (!input.priority) return locale === "fa" ? "اولویت را انتخاب کن." : "Choose a priority."
      base.priority = input.priority
      base.name = locale === "fa" ? `اولویت: ${input.priority}` : `Priority: ${input.priority}`
    } else if (input.kind === "assign-to-me") {
      if (!identity) return locale === "fa" ? "کاربر فعلی Jira پیدا نشد." : "Current Jira user was not found."
      base.assignee = identity
      base.name = locale === "fa" ? "اختصاص به من" : "Assign to me"
    } else if (input.kind === "unassign") {
      base.assignee = null
      base.name = locale === "fa" ? "حذف مسئول" : "Clear assignee"
    } else {
      base.placement = "backlog"
      base.name = locale === "fa" ? "انتقال به بک لاگ" : "Move to backlog"
    }
    setSavedActions((current) => [base, ...current].slice(0, 12))
    toast.success(locale === "fa" ? "عملیات ذخیره شد" : "Saved action created", { description: base.name })
    return null
  }

  function openAdvancedAutomationActionBuilder() {
    setMode("manage")
    setActiveAutomationRuleId(null)
    if (liveSelectedKeys.size) {
      setLiveBulkOpen(true)
      return
    }
    toast.info(locale === "fa" ? "برای ساخت عملیات پیشرفته چند تسک را انتخاب کن و Bulk edit را باز کن." : "Select one or more issues, then open Bulk edit to build an advanced saved action.")
  }

  function saveIssueView(view: Omit<SavedIssueView, "id" | "createdAt">) {
    const saved: SavedIssueView = { ...view, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), name: view.name.trim().slice(0, 80) }
    if (!saved.name) return
    setSavedViews((current) => [saved, ...current].slice(0, 24))
    toast.success(locale === "fa" ? "نمای ذخیره شد" : "View saved", { description: saved.name })
  }

  function deleteIssueView(id: string) {
    setSavedViews((current) => current.filter((view) => view.id !== id))
    toast.success(locale === "fa" ? "نمای ذخیره شده حذف شد" : "Saved view deleted")
  }

  function createAutomationRule(input: { name: string; condition: { kind: AutomationConditionKind; value?: string }; actionId: string }) {
    if (!payload?.project || !selectedBoardId) return locale === "fa" ? "اول یک پروژه و بورد انتخاب کن." : "Choose a project and board first."
    if (!savedActions.some((action) => action.id === input.actionId)) return locale === "fa" ? "عملیات ذخیره شده پیدا نشد." : "Saved action was not found."
    const rule: AutomationRule = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: input.name.slice(0, 80),
      createdAt: new Date().toISOString(), projectKey: payload.project, boardId: selectedBoardId,
      enabled: true, condition: input.condition, actionId: input.actionId,
    }
    setAutomationRules((current) => [rule, ...current].slice(0, 40))
    toast.success(locale === "fa" ? "قانون ذخیره شد" : "Automation rule saved", { description: rule.name })
    return null
  }

  function toggleAutomationRule(id: string) {
    setAutomationRules((current) => current.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
  }

  function deleteAutomationRule(id: string) {
    setAutomationRules((current) => current.filter((rule) => rule.id !== id))
    toast.success(locale === "fa" ? "قانون حذف شد" : "Automation rule deleted")
  }

  function applySavedActionToBulkDraft(action: SavedWorkspaceAction) {
    const sameBoard = !action.boardId || action.boardId === selectedBoardId
    setLiveBulkPriority(action.priority)
    setLiveBulkAssignee(action.assignee)
    setLiveBulkIssueType(action.issueType)
    setLiveBulkEpicLink(action.epicLink)
    setLiveBulkPlacement(action.placement === "sprint" && !sameBoard ? "keep" : action.placement)
    setLiveBulkSprintId(action.placement === "sprint" && sameBoard ? action.sprintId ?? null : null)
    setLiveBulkOriginalEstimate(action.originalEstimate ?? "")
    setLiveBulkRemainingEstimate(action.remainingEstimate ?? "")
    setLiveBulkStoryPoints(action.storyPoints ?? "")
    setLiveDynamicEdits(action.dynamicEdits ? structuredClone(action.dynamicEdits) : {})
  }

  function reviewAutomationRule(rule: AutomationRule) {
    const action = savedActions.find((item) => item.id === rule.actionId)
    if (!action) return void toast.error(locale === "fa" ? "عملیات این قانون پیدا نشد" : "This rule's saved action is missing")
    if ((rule.projectKey && rule.projectKey !== payload?.project) || (rule.boardId && rule.boardId !== selectedBoardId)) {
      return void toast.warning(locale === "fa" ? "این قانون برای پروژه یا بورد دیگری ساخته شده است" : "This rule belongs to a different project or board")
    }
    const matches = matchingIssuesForRule(rule, liveIssues)
    const checkedAt = new Date().toISOString()
    setAutomationRules((current) => current.map((item) => item.id === rule.id ? { ...item, lastCheckedAt: checkedAt, lastMatchCount: matches.length } : item))
    if (!matches.length) return void toast.info(locale === "fa" ? "تسک منطبقی پیدا نشد" : "No matching issues")
    setLiveSelectedKeys(new Set(matches.map((issue) => issue.key)))
    applySavedActionToBulkDraft(action)
    setActiveAutomationRuleId(rule.id)
    setMode("manage")
    setLiveBulkOpen(true)
    toast.success(locale === "fa" ? "قانون آماده بررسی است" : "Rule is ready for review", { description: `${matches.length} ${t.issues}` })
  }

  function loadSavedAction(action: SavedWorkspaceAction) {
    setActiveAutomationRuleId(null)
    applySavedActionToBulkDraft(action)
    setMode("manage")
    if (!liveSelectedKeys.size) return void toast.info(t.selectIssuesFirst, { description: action.name })
    setLiveBulkOpen(true)
    toast.success(t.selectedActionReady, { description: action.name })
  }

  return {
    resetLiveBulkDraft, saveCurrentLiveBulkAction, deleteSavedAction, createQuickAutomationAction,
    openAdvancedAutomationActionBuilder, saveIssueView, deleteIssueView, createAutomationRule,
    toggleAutomationRule, deleteAutomationRule, applySavedActionToBulkDraft, reviewAutomationRule, loadSavedAction,
  }
}
