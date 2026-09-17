import { toast } from "sonner"

import type { AppCopy } from "@/features/app-shell/app-copy"
import {
  getAssignableUsers, getBoardsForProject, getEpicsForBoard, getProject, getProjectEpics,
  getProjectLabels, getSprintsForBoard, jiraErrorMessage,
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

  async function loadEpics(boardId: number, projectKey: string) {
    try { return { epics: await getEpicsForBoard(boardId), warning: "" } }
    catch (boardError) {
      try { return { epics: await getProjectEpics(projectKey), warning: jiraErrorMessage(boardError, "Board Epic metadata was unavailable; using project Epics instead.") } }
      catch (projectError) { return { epics: [] as JiraEpic[], warning: jiraErrorMessage(projectError, "Jira Epic metadata could not be loaded.") } }
    }
  }

  async function loadProjectContext(projectKey: string) {
    setLoadingProject(true)
    setRemoteNote(null)
    setAutoSprintNote(false)
    try {
      const [projectInfo, projectBoards, labelsResult, usersResult] = await Promise.all([
        getProject(projectKey), getBoardsForProject(projectKey),
        getProjectLabels(projectKey).then((value) => ({ value, error: "" })).catch((error) => ({ value: [] as string[], error: jiraErrorMessage(error, "Jira labels could not be loaded.") })),
        getAssignableUsers(projectKey, "", 200).then((value) => ({ value, error: "" })).catch((error) => ({ value: [] as JiraUser[], error: jiraErrorMessage(error, "Jira assignees could not be loaded.") })),
      ])
      setProject(projectInfo); setBoards(projectBoards); setProjectLabels(labelsResult.value); setAssignableUsers(usersResult.value)
      const optionWarnings = [labelsResult.error, usersResult.error].filter(Boolean)
      if (optionWarnings.length) setRemoteNote(`Some Jira options could not be loaded. ${optionWarnings[0]}`)
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
      const [nextSprints, epicResult] = await Promise.all([
        sprintCache.has(preferred.id) ? Promise.resolve(sprintCache.get(preferred.id) ?? []) : getSprintsForBoard(preferred.id),
        loadEpics(preferred.id, projectKey),
      ])
      setSprints(nextSprints); setJiraEpics(epicResult.epics)
      if (epicResult.warning) setRemoteNote(`Some Jira options could not be loaded. ${epicResult.warning}`)
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
      setRemoteNote(jiraErrorMessage(error, "Unable to load project metadata."))
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
      const [nextSprints, epicResult] = await Promise.all([
        getSprintsForBoard(boardId), projectKey ? loadEpics(boardId, projectKey) : Promise.resolve({ epics: [] as JiraEpic[], warning: "" }),
      ])
      setSprints(nextSprints); setJiraEpics(epicResult.epics)
      if (epicResult.warning) setRemoteNote(`Some Jira options could not be loaded. ${epicResult.warning}`)
      const activeSprints = nextSprints.filter((sprint) => sprint.state === "active")
      if (activeSprints.length === 1) { updateDefaults({ sprint: activeSprints[0].id }); setAutoSprintNote(true) }
      else updateDefaults({ sprint: undefined })
    } catch (error) {
      setSprints([]); setJiraEpics([])
      setRemoteNote(jiraErrorMessage(error, "Unable to load board metadata."))
    } finally { setLoadingProject(false) }
  }

  return { loadProjectContext, chooseProject, chooseBoard }
}
