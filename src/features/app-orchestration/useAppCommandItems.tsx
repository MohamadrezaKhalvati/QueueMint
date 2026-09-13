import { Bookmark, Bolt, Eye, FileJson, History, LayoutDashboard, ListChecks, RefreshCcw, Settings2, SlidersHorizontal, Sparkles, SquareKanban, UsersRound } from "lucide-react"

import type { CommandPaletteItem } from "@/components/command-palette"
import type { AppCopy } from "@/features/app-shell/app-copy"
import type { Mode } from "@/features/bulk/bulk-utils"
import type { SavedWorkspaceAction } from "@/lib/storage"
import type { AppLocale } from "@/types"

type CommandItemOptions = {
  t: AppCopy
  locale: AppLocale
  issueCount: number
  liveSelectedKeys: Set<string>
  selectedBoardId: number | null
  savedActions: SavedWorkspaceAction[]
  setMode: (mode: Mode) => void
  onBulkEdit: () => void
  onInspect: (key: string) => void
  onHistory: () => void
  onSettings: () => void
  onBatchSettings: () => void
  onRefresh: () => void
  onSavedAction: (action: SavedWorkspaceAction) => void
}

export function useAppCommandItems(options: CommandItemOptions): CommandPaletteItem[] {
  const o = options
  return [
    { id: "workspace", label: o.t.workspaceTitle, description: o.t.workspaceHint, keywords: "home dashboard workspace", icon: <LayoutDashboard className="size-4" />, onSelect: () => o.setMode("dashboard") },
    { id: "quick", label: o.t.openQuickIssue, description: o.t.quickHint, keywords: "new create issue bug task", icon: <Bolt className="size-4" />, onSelect: () => o.setMode("quick") },
    { id: "bulk", label: o.t.openImport, description: o.t.bulkHint, keywords: "json import batch", icon: <FileJson className="size-4" />, onSelect: () => o.setMode("bulk") },
    { id: "review", label: o.t.openReview, description: o.t.reviewHint, keywords: "review draft", icon: <ListChecks className="size-4" />, disabled: !o.issueCount, onSelect: () => o.setMode("review") },
    { id: "manage", label: o.t.openManager, description: o.t.manageHint, keywords: "jira board manage issues", icon: <SquareKanban className="size-4" />, onSelect: () => o.setMode("manage") },
    { id: "automation", label: o.locale === "fa" ? "اتوماسیون" : "Automations", description: o.locale === "fa" ? "قوانین امن، پیشنهاد مسئول و تاریخچه فعالیت" : "Safe rules, smart assignment, and activity history", keywords: "automation rules activity duplicate smart", icon: <Sparkles className="size-4" />, onSelect: () => o.setMode("automation") },
    { id: "bulk-edit", label: o.t.bulkEdit, description: `${o.liveSelectedKeys.size} ${o.t.selectedIssues}`, keywords: "edit selected jira", icon: <UsersRound className="size-4" />, disabled: !o.liveSelectedKeys.size, onSelect: o.onBulkEdit },
    { id: "inspect-selected", label: o.locale === "fa" ? "نمایش جزئیات تسک انتخابی" : "Inspect selected issue", description: o.liveSelectedKeys.size === 1 ? Array.from(o.liveSelectedKeys)[0] : (o.locale === "fa" ? "یک تسک را انتخاب کن" : "Select exactly one issue"), keywords: "issue detail inspector comments attachments", icon: <Eye className="size-4" />, disabled: o.liveSelectedKeys.size !== 1, onSelect: () => { const key = Array.from(o.liveSelectedKeys)[0]; if (key) o.onInspect(key) } },
    { id: "history", label: o.t.changeHistory, description: o.t.historyHint, keywords: "undo history", icon: <History className="size-4" />, onSelect: o.onHistory },
    { id: "settings", label: o.t.sidebarSettings, description: o.t.settings, keywords: "theme language appearance", icon: <Settings2 className="size-4" />, onSelect: o.onSettings },
    { id: "batch-settings", label: o.t.batchSettings, description: o.t.context, keywords: "project board sprint defaults", icon: <SlidersHorizontal className="size-4" />, onSelect: o.onBatchSettings },
    { id: "refresh", label: o.t.refreshWorkspace, description: o.t.refreshBoard, keywords: "reload jira board", icon: <RefreshCcw className="size-4" />, disabled: !o.selectedBoardId, onSelect: o.onRefresh },
    ...o.savedActions.map((action) => ({ id: `saved:${action.id}`, label: action.name, description: o.t.savedActions, keywords: "saved action preset automation", icon: <Bookmark className="size-4" />, onSelect: () => o.onSavedAction(action) })),
  ]
}
