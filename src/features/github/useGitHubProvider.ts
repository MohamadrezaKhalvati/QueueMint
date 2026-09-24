import { useEffect, useMemo, useState } from "react"

import { githubProvider, githubProviderRuntime } from "@/lib/github-provider/client"
import { loadGitHubContext, saveGitHubContext } from "@/lib/github-provider/storage"
import type { GitHubConnection, GitHubIssueSummary, GitHubProviderError, GitHubRepository } from "@/types"

export function useGitHubProvider() {
  const [connection, setConnection] = useState<GitHubConnection | null>(null)
  const [repositories, setRepositories] = useState<GitHubRepository[]>([])
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<number | null>(null)
  const [issues, setIssues] = useState<GitHubIssueSummary[]>([])
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssueSummary | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [reviewing, setReviewing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unknownWriteOutcome, setUnknownWriteOutcome] = useState(false)

  const selectedRepository = useMemo(
    () => repositories.find((item) => item.id === selectedRepositoryId) ?? null,
    [repositories, selectedRepositoryId],
  )

  useEffect(() => {
    void loadGitHubContext().then((context) => {
      if (context.selectedRepositoryId) setSelectedRepositoryId(context.selectedRepositoryId)
      if (context.draft) { setTitle(context.draft.title); setBody(context.draft.body) }
    })
    void refreshConnection(false)
  }, [])

  useEffect(() => {
    void saveGitHubContext({
      selectedRepositoryId: selectedRepositoryId ?? undefined,
      draft: title.trim() || body.trim() ? { title, body } : undefined,
    })
  }, [selectedRepositoryId, title, body])

  useEffect(() => {
    if (connection?.connected) void refreshRepositories()
    else { setRepositories([]); setIssues([]); setSelectedIssue(null) }
  }, [connection?.connected])

  useEffect(() => {
    if (selectedRepositoryId && connection?.connected) void refreshIssues(selectedRepositoryId)
    else { setIssues([]); setSelectedIssue(null) }
  }, [selectedRepositoryId, connection?.connected])

  async function run<T>(action: () => Promise<T>) {
    setLoading(true); setError(null)
    try { return await action() }
    catch (caught) { setError(caught instanceof Error ? caught.message : "GitHub request failed."); return undefined }
    finally { setLoading(false) }
  }

  async function refreshConnection(showError = true) {
    try {
      const next = await githubProvider.connection()
      setConnection(next)
      return next
    } catch (caught) {
      setConnection({ connected: false, mode: githubProviderRuntime.mode })
      if (showError) setError(caught instanceof Error ? caught.message : "Could not read GitHub connection.")
      return undefined
    }
  }

  async function connect() {
    const next = await run(() => githubProvider.connect())
    if (next) setConnection(next)
  }

  async function disconnect() {
    const ok = await run(async () => { await githubProvider.disconnect(); return true })
    if (ok) setConnection({ connected: false, mode: githubProviderRuntime.mode })
  }

  async function refreshRepositories() {
    const page = await run(() => githubProvider.repositories())
    if (!page) return
    setRepositories(page.data)
    setSelectedRepositoryId((current) => {
      if (current && page.data.some((item) => item.id === current)) return current
      return page.data[0]?.id ?? null
    })
  }

  async function refreshIssues(repositoryId = selectedRepositoryId) {
    if (!repositoryId) return
    const page = await run(() => githubProvider.issues(repositoryId))
    if (page) setIssues(page.data)
  }

  function beginReview() {
    setError(null); setUnknownWriteOutcome(false)
    if (!selectedRepository?.capabilities.createIssues) { setError("Issue creation is unavailable for this repository."); return }
    if (!title.trim()) { setError("Issue title is required."); return }
    setReviewing(true)
  }

  async function createIssue() {
    if (!selectedRepositoryId || !title.trim()) return
    setCreating(true); setError(null); setUnknownWriteOutcome(false)
    try {
      const result = await githubProvider.createIssue(selectedRepositoryId, {
        title: title.trim(),
        body: body.trim(),
        clientRequestId: crypto.randomUUID(),
      })
      setTitle(""); setBody(""); setReviewing(false); setSelectedIssue(result.issue)
      await refreshIssues(selectedRepositoryId)
    } catch (caught) {
      const providerError = caught as Partial<GitHubProviderError>
      if (providerError.code === "WRITE_OUTCOME_UNKNOWN") setUnknownWriteOutcome(true)
      setError(caught instanceof Error ? caught.message : "Could not create GitHub issue.")
    } finally { setCreating(false) }
  }

  return {
    runtime: githubProviderRuntime, connection, repositories, selectedRepositoryId, setSelectedRepositoryId, selectedRepository,
    issues, selectedIssue, setSelectedIssue, title, setTitle, body, setBody, reviewing, setReviewing, loading, creating, error,
    unknownWriteOutcome, connect, disconnect, refreshConnection, refreshRepositories, refreshIssues, beginReview, createIssue,
  }
}
