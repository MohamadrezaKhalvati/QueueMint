import { toast } from "sonner"

import type { AppCopy } from "@/features/app-shell/app-copy"
import {
  getAssignableUsers, getBoardsForProject, getEpicsForBoard, getProject, getProjectEpics,
  getProjectLabels, getSprintsForBoard,
} from "@/lib/jira"
import type { BulkPayload, JiraBoard, JiraEpic, JiraProject, JiraSprint, JiraUser } from "@/types"
import type { StateSetter } from "./types"

type ProjectContextOptions = {
  payload: BulkPayload | undefined
  parsedPayload: BulkPayload | undefined
  selectedBoardId: number | null
  quickSprintId: number | null | undefined
  t: AppCopy
  writePayload: (payload: BulkPayload) => void
  updateDefaults: (patch: Partial<NonNullable<BulkPayload["defaults"]>>) => void
  setLoadingProject: StateSetter<boolean>
  setRemoteNote: StateSetter<string | null>
  setAutoSprintNote: StateSetter<boolean>
  setProject: StateSetter<JiraProject | null>
  setBoards: StateSetter<JiraBoard[]>
  setProjectLabels: StateSetter<string[]>
  setAssignableUsers: StateSetter<JiraUser[]>
  setSelectedBoardId: StateSetter<number | null>
  setSprints: StateSetter<JiraSprint[]>
  setJiraEpics: StateSetter<JiraEpic[]>
  setJsonText: StateSetter<string>
  setQuickSprintId: StateSetter<number | null | undefined>
  setLiveIssues: StateSetter<import("@/types").JiraLiveIssue[]>
  setLiveSelectedKeys: StateSetter<Set<string>>
}

export function useProjectContext(options: ProjectContextOptions) {
  const {
    payload, parsedPayload, selectedBoardId, quickSprintId, t, writePayload, updateDefaults,
    setLoadingProject, setRemoteNote, setAutoSprintNote, setProject, setBoards, setProjectLabels,
    setAssignableUsers, setSelectedBoardId, setSprints, setJiraEpics, setJsonText, setQuickSprintId,
    setLiveIssues, setLiveSelectedKeys,
  } = options

  async function loadProjectContext(projectKey: string) {
    setLoadingProject(true)
    setRemoteNote(null)
    setAutoSprintNote(false)
    try {
      const [projectInfo, projectBoards, labels, users] = await Promise.all([
        getProject(projectKey), getBoardsForProject(projectKey), getProjectLabels(projectKey).catch(() => []),
        getAssignableUsers(projectKey, "", 200).catch(() => []),
      ])
      setProject(projectInfo); setBoards(projectBoards); setProjectLabels(labels); setAssignableUsers(users)
      let preferred = projectBoards.find((board) => board.id === selectedBoardId)
      const sprintCache = new Map<number, JiraSprint[]>()
      if (!preferred && projectBoards.length > 1) {
        const scrumBoards = projectBoards.filter((board) => board.type?.toLowerCase() === "scrum").slice(0, 12)
        const probed = await Promise.all(scrumBoards.map(async (board) => {
          const boardSprints = await getSprintsForBoard(board.id).catch(() => [])
          sprintCache.set(board.id, boardSprints)
          return { board, hasActiveSprint: boardSprints.some((sprint) => sprint.state === "active") }
        }))
        const activeBoards = probed.filter((entry) => entry.hasActiveSprint)
        if (activeBoards.length === 1) preferred = activeBoards[0].board
      }
      preferred = preferred ?? projectBoards.find((board) => board.type?.toLowerCase() === "scrum") ?? projectBoards[0]
      if (!preferred) {
        setSelectedBoardId(null); setSprints([]); setJiraEpics([])
        return
      }
      setSelectedBoardId(preferred.id)
      const [nextSprints, nextEpics] = await Promise.all([
        sprintCache.has(preferred.id) ? Promise.resolve(sprintCache.get(preferred.id) ?? []) : getSprintsForBoard(preferred.id),
        getEpicsForBoard(preferred.id).catch(() => getProjectEpics(projectKey).catch(() => [])),
      ])
      setSprints(nextSprints); setJiraEpics(nextEpics)
      const currentDefaultSprint = parsedPayload?.project === projectKey ? parsedPayload.defaults?.sprint : undefined
      const activeSprints = nextSprints.filter((sprint) => sprint.state === "active")
      if (currentDefaultSprint === undefined && activeSprints.length === 1 && parsedPayload?.project === projectKey) {
        setJsonText(JSON.stringify({ ...parsedPayload, defaults: { ...(parsedPayload.defaults ?? {}), sprint: activeSprints[0].id } }, null, 2))
        setAutoSprintNote(true)
        if (quickSprintId === undefined) setQuickSprintId(activeSprints[0].id)
        toast.success(t.activeSprintDetected, { description: activeSprints[0].name })
      }
    } catch (error) {
      setProject(null); setBoards([]); setSprints([]); setJiraEpics([]); setProjectLabels([]); setAssignableUsers([])
      setRemoteNote(error instanceof Error ? error.message : "Unable to load project metadata.")
    } finally { setLoadingProject(false) }
  }

  async function chooseProject(key: string) {
    if (!payload || !key) return
    setSelectedBoardId(null); setSprints([]); setJiraEpics([]); setProjectLabels([]); setAssignableUsers([])
    writePayload({ ...payload, project: key, defaults: { ...(payload.defaults ?? {}), sprint: undefined } })
  }

  async function chooseBoard(boardId: number) {
    setSelectedBoardId(boardId); setLiveIssues([]); setLiveSelectedKeys(new Set()); setAutoSprintNote(false); setLoadingProject(true)
    try {
      const projectKey = payload?.project
      const [nextSprints, nextEpics] = await Promise.all([
        getSprintsForBoard(boardId), getEpicsForBoard(boardId).catch(() => projectKey ? getProjectEpics(projectKey).catch(() => []) : []),
      ])
      setSprints(nextSprints); setJiraEpics(nextEpics)
      const activeSprints = nextSprints.filter((sprint) => sprint.state === "active")
      if (activeSprints.length === 1) { updateDefaults({ sprint: activeSprints[0].id }); setAutoSprintNote(true) }
      else updateDefaults({ sprint: undefined })
    } catch (error) {
      setSprints([]); setJiraEpics([])
      setRemoteNote(error instanceof Error ? error.message : "Unable to load board metadata.")
    } finally { setLoadingProject(false) }
  }

  return { loadProjectContext, chooseProject, chooseBoard }
}
