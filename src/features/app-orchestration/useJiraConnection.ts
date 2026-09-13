import { toast } from "sonner"

import type { AppCopy } from "@/features/app-shell/app-copy"
import { looksLikeJiraCandidate, safeOrigin } from "@/features/connection/jira-candidate"
import { parseBulkJson } from "@/lib/validation"
import {
  configureJiraConnection, discoverJira, getJiraConnectionStatus, selectJiraTab,
} from "@/lib/jira"
import type {
  BulkPayload, JiraBoard, JiraConnectionStatus, JiraEpic, JiraLiveIssue, JiraMetadata,
  JiraProject, JiraSprint, JiraTabContext, JiraUser,
} from "@/types"
import type { StateSetter } from "./types"

type JiraConnectionOptions = {
  jsonText: string
  metadata: JiraMetadata | null
  connectionStatus: JiraConnectionStatus | null
  contextMismatch: JiraTabContext | null
  onboardingComplete: boolean
  ignoredContextKey: string | null
  selectedBoardId: number | null
  boards: JiraBoard[]
  t: AppCopy
  chooseBoard: (boardId: number) => Promise<void>
  setLoadingConnection: StateSetter<boolean>
  setConnectionError: StateSetter<string | null>
  setConnectionStatus: StateSetter<JiraConnectionStatus | null>
  setOnboardingUrl: StateSetter<string>
  setOnboardingOpen: StateSetter<boolean>
  setMetadata: StateSetter<JiraMetadata | null>
  setProject: StateSetter<JiraProject | null>
  setBoards: StateSetter<JiraBoard[]>
  setSprints: StateSetter<JiraSprint[]>
  setJiraEpics: StateSetter<JiraEpic[]>
  setProjectLabels: StateSetter<string[]>
  setAssignableUsers: StateSetter<JiraUser[]>
  setContextMismatch: StateSetter<JiraTabContext | null>
  setIgnoredContextKey: StateSetter<string | null>
  setJsonText: StateSetter<string>
  setSelectedBoardId: StateSetter<number | null>
  setLastCreatedKeys: StateSetter<string[]>
  setLiveSelectedKeys: StateSetter<Set<string>>
  setOnboardingComplete: StateSetter<boolean>
}

export function useJiraConnection(options: JiraConnectionOptions) {
  const {
    jsonText, metadata, connectionStatus, contextMismatch, onboardingComplete, ignoredContextKey, selectedBoardId, boards,
    t, chooseBoard, setLoadingConnection, setConnectionError, setConnectionStatus, setOnboardingUrl,
    setOnboardingOpen, setMetadata, setProject, setBoards, setSprints, setJiraEpics, setProjectLabels,
    setAssignableUsers, setContextMismatch, setIgnoredContextKey, setJsonText, setSelectedBoardId,
    setLastCreatedKeys, setLiveSelectedKeys, setOnboardingComplete,
  } = options

  function contextKey(context: JiraTabContext | null | undefined, tabId?: number | null) {
    if (!context?.projectKey) return null
    return `${context.projectKey}:${context.boardId ?? ""}:${tabId ?? ""}`
  }

  function applyDetectedContext(status: JiraConnectionStatus, discovered: JiraMetadata) {
    const context = status.context
    if (!context?.projectKey) { setContextMismatch(null); return }
    if (!discovered.projects.some((candidate) => candidate.key === context.projectKey)) return
    const current = parseBulkJson(jsonText).payload
    const hasRealDraft = Boolean(current?.project && current.issues?.length)
    if (!hasRealDraft || !current?.project) {
      const nextPayload: BulkPayload = { project: context.projectKey, defaults: current?.defaults ?? {}, fieldMap: current?.fieldMap, issues: current?.issues ?? [] }
      setJsonText(JSON.stringify(nextPayload, null, 2))
      if (typeof context.boardId === "number") setSelectedBoardId(context.boardId)
      setContextMismatch(null); setIgnoredContextKey(null)
      toast.info(t.contextDetected, { description: `${context.projectKey}${context.boardId ? ` · Board ${context.boardId}` : ""}` })
      return
    }
    if (current.project !== context.projectKey) {
      const key = contextKey(context, status.selectedTabId)
      if (key !== ignoredContextKey) {
        setContextMismatch(context)
        toast.warning(t.contextDetected, { description: `Jira tab: ${context.projectKey} · Current batch: ${current.project}` })
      }
    } else {
      setContextMismatch(null); setIgnoredContextKey(null)
      if (typeof context.boardId === "number" && context.boardId !== selectedBoardId) {
        if (boards.some((board) => board.id === context.boardId)) void chooseBoard(context.boardId)
        else setSelectedBoardId(context.boardId)
      }
    }
  }

  function useCurrentJiraContext() {
    const context = connectionStatus?.context ?? contextMismatch
    if (!context?.projectKey) return
    const current = parseBulkJson(jsonText).payload
    const nextPayload: BulkPayload = { project: context.projectKey, defaults: current?.defaults ?? {}, fieldMap: current?.fieldMap, issues: current?.issues ?? [] }
    setJsonText(JSON.stringify(nextPayload, null, 2))
    if (typeof context.boardId === "number") setSelectedBoardId(context.boardId)
    setLastCreatedKeys([]); setLiveSelectedKeys(new Set()); setContextMismatch(null); setIgnoredContextKey(null)
    toast.success(t.contextDetected, { description: `${context.projectKey}${context.boardId ? ` · Board ${context.boardId}` : ""}` })
  }

  function keepCurrentWorkspace() {
    setIgnoredContextKey(contextKey(contextMismatch, connectionStatus?.selectedTabId))
    setContextMismatch(null)
  }

  async function connect(showFeedback = false) {
    setLoadingConnection(true); setConnectionError(null)
    try {
      if (typeof chrome === "undefined" || !chrome.runtime?.id) throw new Error("Extension APIs are unavailable. Load the built dist folder as an unpacked extension.")
      const status = await getJiraConnectionStatus()
      setConnectionStatus(status)
      const candidateOrigin = safeOrigin(status.candidate?.url)
      if (status.configured && looksLikeJiraCandidate(status.candidate) && candidateOrigin && status.origin && candidateOrigin !== status.origin) {
        setOnboardingUrl(candidateOrigin); setOnboardingOpen(true)
        toast.info(t.differentJiraSite, { description: t.differentJiraSiteDescription })
      }
      if (!status.configured) {
        const candidateUrl = status.candidate?.url
        if (candidateUrl) { try { setOnboardingUrl(new URL(candidateUrl).origin) } catch { /* ignore malformed candidate */ } }
        if (!onboardingComplete) setOnboardingOpen(true)
        setMetadata(null)
        return false
      }
      const discovered = await discoverJira()
      setMetadata(discovered); applyDetectedContext(status, discovered)
      if (status.tabs.length > 1) toast.info(t.multipleTabsToast, { description: t.multipleTabsDescription })
      else if (showFeedback) toast.success(t.connectionReady, { description: status.origin })
      return true
    } catch (error) {
      setMetadata(null); setProject(null); setBoards([]); setSprints([]); setJiraEpics([]); setProjectLabels([]); setAssignableUsers([])
      const message = error instanceof Error ? error.message : "Could not connect to Jira."
      setConnectionError(message)
      if (showFeedback) toast.error(t.connectionFailed, { description: message })
      return false
    } finally { setLoadingConnection(false) }
  }

  async function connectFromOnboarding(value: string, tabId?: number) {
    setLoadingConnection(true)
    try {
      const status = await configureJiraConnection(value, tabId)
      setConnectionStatus(status)
      if (await connect(true)) { setOnboardingComplete(true); setOnboardingOpen(false) }
    } catch (error) {
      const message = error instanceof Error ? error.message : t.connectionFailed
      setConnectionError(message); toast.error(t.connectionFailed, { description: message })
    } finally { setLoadingConnection(false) }
  }

  async function switchJiraTab(tabId: number) {
    try {
      const status = await selectJiraTab(tabId)
      setConnectionStatus(status)
      if (metadata) applyDetectedContext(status, metadata)
      toast.success(t.connectionReady, { description: status.selectedTab?.title ?? status.origin })
    } catch (error) {
      toast.error(t.connectionFailed, { description: error instanceof Error ? error.message : t.connectionFailed })
    }
  }

  return { applyDetectedContext, useCurrentJiraContext, keepCurrentWorkspace, connect, connectFromOnboarding, switchJiraTab }
}
