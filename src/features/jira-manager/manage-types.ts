import type { Dispatch, SetStateAction } from "react"
import { copy } from "@/features/app-shell/app-copy"
import type { SavedIssueView, SavedWorkspaceAction } from "@/lib/storage"
import type { AppLocale, JiraBoard, JiraLiveIssue, JiraMetadata, JiraPriority, JiraProject, JiraSprint, JiraUser } from "@/types"

export type ManageScope = "created" | "board"
export type ManageView = "list" | "board"

export type ManageJiraScreenProps = {
  t: typeof copy.en | typeof copy.fa
  locale: AppLocale
  project: JiraProject | null
  boards: JiraBoard[]
  selectedBoardId: number | null
  boardLoading: boolean
  onBoardChange: (boardId: number) => void
  sprints: JiraSprint[]
  priorities: JiraPriority[]
  users: JiraUser[]
  metadata: JiraMetadata | null
  issues: JiraLiveIssue[]
  selectedKeys: Set<string>
  setSelectedKeys: (next: Set<string>) => void
  lastCreatedKeys: string[]
  scope: ManageScope
  setScope: (scope: ManageScope) => void
  search: string
  setSearch: (value: string) => void
  loading: boolean
  message: string | null
  onRefresh: () => void
  onMove: (keys: string[], sprintId: number | null) => void
  onAssignToMe: () => void
  onBulkEdit: () => void
  savedActions: SavedWorkspaceAction[]
  onUseSavedAction: (action: SavedWorkspaceAction) => void
  onDeleteSavedAction: (id: string) => void
  savedViews: SavedIssueView[]
  onSaveView: (view: Omit<SavedIssueView, "id" | "createdAt">) => void
  onDeleteView: (id: string) => void
  onOpenIssue: (issueKey: string) => void
  historyCount: number
  onHistory: () => void
  onDelete: () => void
}

export type StringSetter = Dispatch<SetStateAction<string>>
