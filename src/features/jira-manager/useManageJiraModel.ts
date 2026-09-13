import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type { SavedIssueView } from "@/lib/storage"
import { filterManageIssues, groupLiveIssues, type ManageIssueFilterState } from "./manage-utils"
import type { ManageJiraScreenProps, ManageView } from "./manage-types"

export function useManageJiraModel(props: ManageJiraScreenProps) {
  const { t, locale, project, selectedBoardId, sprints, metadata, issues, selectedKeys, setSelectedKeys, lastCreatedKeys, scope, setScope, search, onMove, savedViews, onSaveView } = props
  const [draggedKey, setDraggedKey] = useState<string | null>(null)
  const [overLane, setOverLane] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState("")
  const [view, setView] = useState<ManageView>("board")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [saveViewOpen, setSaveViewOpen] = useState(false)
  const [saveViewName, setSaveViewName] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [sprintFilter, setSprintFilter] = useState("all")
  const [labelFilter, setLabelFilter] = useState("all")
  const [estimateFilter, setEstimateFilter] = useState("all")
  const [myIssuesOnly, setMyIssuesOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const createdSet = useMemo(() => new Set(lastCreatedKeys), [lastCreatedKeys])
  const currentUser = metadata?.user?.displayName || metadata?.user?.name || metadata?.user?.key
  const matchingSavedViews = useMemo(
    () => savedViews.filter((saved) => (!saved.projectKey || saved.projectKey === project?.key) && (!saved.boardId || saved.boardId === selectedBoardId)),
    [savedViews, project?.key, selectedBoardId],
  )
  const createdIssues = useMemo(() => issues.filter((issue) => createdSet.has(issue.key)), [issues, createdSet])
  const typeOptions = useMemo(() => Array.from(new Set(issues.map((issue) => issue.type).filter(Boolean))).sort(), [issues])
  const priorityOptions = useMemo(() => Array.from(new Set(issues.map((issue) => issue.priority).filter((value): value is string => Boolean(value)))).sort(), [issues])
  const statusOptions = useMemo(() => Array.from(new Set(issues.map((issue) => issue.status).filter((value): value is string => Boolean(value)))).sort(), [issues])
  const assigneeOptions = useMemo(() => Array.from(new Set(issues.map((issue) => issue.assignee).filter((value): value is string => Boolean(value)))).sort(), [issues])
  const labelOptions = useMemo(() => Array.from(new Set(issues.flatMap((issue) => issue.labels))).sort(), [issues])
  const activeFilterCount = [typeFilter, priorityFilter, statusFilter, assigneeFilter, sprintFilter, labelFilter, estimateFilter].filter((value) => value !== "all").length + (myIssuesOnly ? 1 : 0)
  const filterState = useMemo<ManageIssueFilterState>(() => ({
    search, type: typeFilter, priority: priorityFilter, status: statusFilter, assignee: assigneeFilter, sprint: sprintFilter, label: labelFilter, estimate: estimateFilter, myIssuesOnly, currentUser,
  }), [search, typeFilter, priorityFilter, statusFilter, assigneeFilter, sprintFilter, labelFilter, estimateFilter, myIssuesOnly, currentUser])
  const createdFilteredIssues = useMemo(() => filterManageIssues(createdIssues, filterState), [createdIssues, filterState])
  const boardFilteredIssues = useMemo(() => filterManageIssues(issues, filterState), [issues, filterState])
  const visibleIssues = scope === "created" ? createdFilteredIssues : boardFilteredIssues
  const hasActiveFiltering = Boolean(search.trim() || activeFilterCount)
  const createdScopeCount = hasActiveFiltering ? createdFilteredIssues.length : createdIssues.length
  const boardScopeCount = hasActiveFiltering ? boardFilteredIssues.length : issues.length

  useEffect(() => { setPage(1) }, [search, typeFilter, priorityFilter, statusFilter, assigneeFilter, sprintFilter, labelFilter, estimateFilter, myIssuesOnly, scope])
  useEffect(() => { if (scope === "created" && !createdIssues.length) setScope("board") }, [scope, createdIssues.length, setScope])
  useEffect(() => {
    if (!selectedKeys.size) return
    const visibleKeys = new Set(visibleIssues.map((issue) => issue.key))
    const next = new Set(Array.from(selectedKeys).filter((key) => visibleKeys.has(key)))
    if (next.size !== selectedKeys.size) setSelectedKeys(next)
  }, [visibleIssues, selectedKeys, setSelectedKeys])
  useEffect(() => { if (issues.length > 100) setView("list") }, [issues.length])

  useEffect(() => {
    const preset = props.commandPreset
    if (!preset) return
    setScope(preset.scope ?? "board")
    props.setSearch(preset.search ?? "")
    setView(preset.view ?? "list")
    setTypeFilter(preset.filters?.type ?? "all")
    setPriorityFilter(preset.filters?.priority ?? "all")
    setStatusFilter(preset.filters?.status ?? "all")
    setAssigneeFilter(preset.filters?.assignee ?? "all")
    setSprintFilter(preset.filters?.sprint ?? "all")
    setLabelFilter(preset.filters?.label ?? "all")
    setEstimateFilter(preset.filters?.estimate ?? "all")
    setMyIssuesOnly(preset.filters?.myIssuesOnly ?? false)
    setFiltersOpen(true)
    props.onCommandPresetApplied?.()
  }, [props.commandPreset?.id])

  const pageCount = Math.max(1, Math.ceil(visibleIssues.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageIssues = view === "list" ? visibleIssues.slice((safePage - 1) * pageSize, safePage * pageSize) : visibleIssues
  const groups = useMemo(() => groupLiveIssues(visibleIssues, sprints), [visibleIssues, sprints])
  const allPageSelected = pageIssues.length > 0 && pageIssues.every((issue) => selectedKeys.has(issue.key))
  const allMatchingSelected = visibleIssues.length > 0 && visibleIssues.every((issue) => selectedKeys.has(issue.key))
  const moveItems = useMemo(() => [
    { value: "backlog", label: t.backlog },
    ...sprints.map((sprint) => ({ value: `sprint:${sprint.id}`, label: `${sprint.state === "active" ? "●" : "○"} ${sprint.name}` })),
  ], [sprints, t.backlog])

  function toggle(key: string) {
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelectedKeys(next)
  }

  function moveSelection(value: string) {
    if (!value || !selectedKeys.size) return
    if (value === "backlog") onMove(Array.from(selectedKeys), null)
    else if (value.startsWith("sprint:")) {
      const id = Number(value.slice("sprint:".length))
      if (Number.isInteger(id) && id > 0) onMove(Array.from(selectedKeys), id)
    }
    setMoveTarget("")
  }

  function clearFilters() {
    setTypeFilter("all"); setPriorityFilter("all"); setStatusFilter("all"); setAssigneeFilter("all"); setSprintFilter("all"); setLabelFilter("all"); setEstimateFilter("all"); setMyIssuesOnly(false)
  }

  function applySavedView(saved: SavedIssueView) {
    setScope(saved.scope); props.setSearch(saved.search); setView(saved.view); setTypeFilter(saved.filters.type); setPriorityFilter(saved.filters.priority); setStatusFilter(saved.filters.status); setAssigneeFilter(saved.filters.assignee); setSprintFilter(saved.filters.sprint); setLabelFilter(saved.filters.label); setEstimateFilter(saved.filters.estimate); setMyIssuesOnly(saved.filters.myIssuesOnly); setFiltersOpen(true)
    toast.success(locale === "fa" ? "نمای ذخیره شده اعمال شد" : "Saved view applied", { description: saved.name })
  }

  function saveCurrentView() {
    const trimmed = saveViewName.trim()
    if (!trimmed) return
    onSaveView({ name: trimmed, projectKey: project?.key, boardId: selectedBoardId, scope, search, view, filters: { type: typeFilter, priority: priorityFilter, status: statusFilter, assignee: assigneeFilter, sprint: sprintFilter, label: labelFilter, estimate: estimateFilter, myIssuesOnly } })
    setSaveViewName(""); setSaveViewOpen(false)
  }

  function selectPage() {
    const next = new Set(selectedKeys)
    if (allPageSelected) pageIssues.forEach((issue) => next.delete(issue.key)); else pageIssues.forEach((issue) => next.add(issue.key))
    setSelectedKeys(next)
  }
  function selectMatching() {
    const next = new Set(selectedKeys)
    if (allMatchingSelected) visibleIssues.forEach((issue) => next.delete(issue.key)); else visibleIssues.forEach((issue) => next.add(issue.key))
    setSelectedKeys(next)
  }

  const filterItems = {
    type: [{ value: "all", label: t.allTypes }, ...typeOptions.map((value) => ({ value, label: value }))],
    priority: [{ value: "all", label: t.allPriorities }, ...priorityOptions.map((value) => ({ value, label: value }))],
    status: [{ value: "all", label: t.allStatuses }, ...statusOptions.map((value) => ({ value, label: value }))],
    assignee: [{ value: "all", label: t.allAssignees }, { value: "__unassigned__", label: t.unassigned }, ...assigneeOptions.map((value) => ({ value, label: value }))],
    sprint: [{ value: "all", label: t.allSprints }, { value: "backlog", label: t.backlog }, ...sprints.map((sprint) => ({ value: String(sprint.id), label: sprint.name }))],
    label: [{ value: "all", label: t.allLabels }, ...labelOptions.map((value) => ({ value, label: value }))],
    estimate: [{ value: "all", label: t.allEstimates }, { value: "estimated", label: t.estimated }, { value: "unestimated", label: t.unestimated }],
  }

  return { draggedKey, setDraggedKey, overLane, setOverLane, moveTarget, view, setView, filtersOpen, setFiltersOpen, saveViewOpen, setSaveViewOpen, saveViewName, setSaveViewName, typeFilter, setTypeFilter, priorityFilter, setPriorityFilter, statusFilter, setStatusFilter, assigneeFilter, setAssigneeFilter, sprintFilter, setSprintFilter, labelFilter, setLabelFilter, estimateFilter, setEstimateFilter, myIssuesOnly, setMyIssuesOnly, page, setPage, pageSize, setPageSize, currentUser, matchingSavedViews, createdIssues, activeFilterCount, visibleIssues, hasActiveFiltering, createdScopeCount, boardScopeCount, pageCount, safePage, pageIssues, groups, allPageSelected, allMatchingSelected, moveItems, toggle, moveSelection, clearFilters, applySavedView, saveCurrentView, selectPage, selectMatching, filterItems }
}
