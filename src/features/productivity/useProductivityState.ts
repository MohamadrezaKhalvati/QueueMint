import { useEffect, useMemo, useState } from "react"

import { loadProductivityState, saveProductivityState, type ProductivityState } from "./productivity-storage"

export function useProductivityState(projectKey?: string, projectName?: string, boardId?: number | null, boardName?: string) {
  const [state, setState] = useState<ProductivityState>({ favoriteCommandIds: [], recentProjects: [], recentBoards: [] })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadProductivityState().then((stored) => { if (!cancelled) { setState(stored); setHydrated(true) } })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const timer = window.setTimeout(() => void saveProductivityState(state), 180)
    return () => window.clearTimeout(timer)
  }, [hydrated, state])

  useEffect(() => {
    if (!hydrated || !projectKey) return
    const now = new Date().toISOString()
    setState((current) => {
      const previous = current.recentProjects.find((item) => item.key === projectKey)
      const nextName = projectName || previous?.name || projectKey
      if (previous && current.recentProjects[0]?.key === projectKey && previous.name === nextName) return current
      const recentProjects = [{ key: projectKey, name: nextName, visitedAt: now }, ...current.recentProjects.filter((item) => item.key !== projectKey)].slice(0, 6)
      return { ...current, recentProjects }
    })
  }, [hydrated, projectKey, projectName])


  useEffect(() => {
    if (!hydrated || !projectKey || !boardId) return
    const now = new Date().toISOString()
    setState((current) => {
      const previous = current.recentBoards.find((item) => item.id === boardId && item.projectKey === projectKey)
      const nextName = boardName || previous?.name || `Board ${boardId}`
      if (previous && current.recentBoards[0]?.id === boardId && current.recentBoards[0]?.projectKey === projectKey && previous.name === nextName) return current
      const recentBoards = [{ id: boardId, name: nextName, projectKey, visitedAt: now }, ...current.recentBoards.filter((item) => item.id !== boardId || item.projectKey !== projectKey)].slice(0, 8)
      return { ...current, recentBoards }
    })
  }, [hydrated, projectKey, boardId, boardName])

  const favoriteCommandIds = useMemo(() => new Set(state.favoriteCommandIds), [state.favoriteCommandIds])
  function toggleFavoriteCommand(id: string) {
    setState((current) => ({
      ...current,
      favoriteCommandIds: current.favoriteCommandIds.includes(id)
        ? current.favoriteCommandIds.filter((item) => item !== id)
        : [...current.favoriteCommandIds, id].slice(-80),
    }))
  }

  return { favoriteCommandIds, recentProjects: state.recentProjects, recentBoards: state.recentBoards, toggleFavoriteCommand }
}
