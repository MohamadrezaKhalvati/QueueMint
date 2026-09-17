import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { applyWorklogDraft, getCurrentUserDayWorklogs, getDayWorklogs, jiraErrorMessage } from "@/lib/jira"
import type { ActivityEntry } from "@/lib/storage"
import { resolveWorklogComment } from "@/lib/worklog-comment"
import type { AppLocale, JiraLiveIssue, JiraUser, WorklogDaySummary, WorklogDraftEntry } from "@/types"
import { generateAiWorklogDraft } from "./worklog-ai"
import { buildDailyCandidateIssues } from "./worklog-issues"
import { DEFAULT_WORKLOG_SETTINGS, loadWorklogSettings, saveWorklogSettings } from "./worklog-storage"
import { buildEstimateOnlyWorklogDraft, buildManualWorklogDraft, buildWorklogDraft, formatWorklogMinutes, parseWorklogDuration, worklogStartedAtForDate, type WorklogDistributionStrategy } from "./worklog-utils"

type Options = {
  locale: AppLocale
  issues: JiraLiveIssue[]
  selectedKeys: Set<string>
  currentUser?: JiraUser
  projectKey?: string
  boardId?: number | null
  date: Date
  strategy: WorklogDistributionStrategy
  recordActivity?: (input: Omit<ActivityEntry, "id" | "createdAt" | "projectKey" | "boardId">) => void
}

const EMPTY_SUMMARY: WorklogDaySummary = { totalMinutes: 0, worklogs: [] }
const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

export function useWorklogAssistant(options: Options) {
  const [targetMinutes, setTargetMinutes] = useState(DEFAULT_WORKLOG_SETTINGS.dailyTargetMinutes)
  const [targetText, setTargetText] = useState("7h 30m")
  const [daySummary, setDaySummary] = useState<WorklogDaySummary>(EMPTY_SUMMARY)
  const [scopeSummary, setScopeSummary] = useState<WorklogDaySummary>(EMPTY_SUMMARY)
  const [selectionText, setSelectionText] = useState("1h")
  const [draft, setDraft] = useState<WorklogDraftEntry[]>([])
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const selectedKeySignature = Array.from(options.selectedKeys).sort().join("|")
  const selectedIssues = useMemo(
    () => options.issues.filter((issue) => options.selectedKeys.has(issue.key)),
    [options.issues, selectedKeySignature],
  )
  const selectedEstimateSignature = useMemo(
    () => selectedIssues
      .map((issue) => `${issue.key}:${issue.remainingEstimateSeconds ?? "x"}:${issue.originalEstimateSeconds ?? "x"}`)
      .sort()
      .join("|"),
    [selectedIssues],
  )
  const loggedMinutesByIssue = useMemo(() => {
    const result: Record<string, number> = {}
    for (const item of daySummary.worklogs) {
      if (!/^[A-Z][A-Z0-9_]*-\d+$/i.test(item.issueKey)) continue
      result[item.issueKey] = (result[item.issueKey] ?? 0) + Math.round(item.timeSpentSeconds / 60)
    }
    return result
  }, [daySummary.worklogs])
  const dailyCandidates = useMemo(
    () => buildDailyCandidateIssues(options.issues, options.currentUser, loggedMinutesByIssue, options.date),
    [options.issues, options.currentUser, loggedMinutesByIssue, dateKey(options.date)],
  )
  const dayMinutes = daySummary.totalMinutes
  const scopeMinutes = scopeSummary.totalMinutes
  const remainingMinutes = Math.max(0, targetMinutes - dayMinutes)
  const selectedTargetMinutes = parseWorklogDuration(selectionText) ?? 0
  const draftMinutes = draft.reduce((sum, entry) => sum + Math.max(0, entry.minutes), 0)

  useEffect(() => {
    let cancelled = false
    void loadWorklogSettings().then((settings) => {
      if (!cancelled) { setTargetMinutes(settings.dailyTargetMinutes); setTargetText(formatWorklogMinutes(settings.dailyTargetMinutes)) }
    })
    return () => { cancelled = true }
  }, [])

  async function refreshDay() {
    setLoading(true)
    try {
      const [globalResult, scopeResult] = await Promise.allSettled([
        getCurrentUserDayWorklogs(options.currentUser, options.date),
        options.issues.length ? getDayWorklogs(options.issues.map((issue) => issue.key), options.currentUser, options.date) : Promise.resolve(EMPTY_SUMMARY),
      ])
      const global = globalResult.status === "fulfilled" ? globalResult.value : null
      const scope = scopeResult.status === "fulfilled" ? scopeResult.value : EMPTY_SUMMARY
      setScopeSummary(scope)
      const merged = new Map<string, WorklogDaySummary["worklogs"][number]>()
      for (const item of [...(global?.worklogs ?? []), ...scope.worklogs]) merged.set(`${item.issueKey}:${item.id}`, item)
      const worklogs = Array.from(merged.values()).sort((a, b) => a.started.localeCompare(b.started))
      const warnings = Array.from(new Set([...(global?.warnings ?? []), ...(scope.warnings ?? [])]))
      if (worklogs.length || global) {
        const totalMinutes = Math.round(worklogs.reduce((sum, item) => sum + Math.max(0, item.timeSpentSeconds), 0) / 60)
        const scopeAddedRows = scope.worklogs.some((item) => !(global?.worklogs ?? []).some((candidate) => candidate.id === item.id && candidate.issueKey === item.issueKey))
        const source = !global?.worklogs.length && scope.worklogs.length ? "scope" : scopeAddedRows ? "mixed" : global?.source
        setDaySummary({ totalMinutes, worklogs, source, warnings: warnings.length ? warnings : undefined })
      } else if (scope.worklogs.length) setDaySummary({ ...scope, source: "scope" })
      else throw globalResult.status === "rejected" ? globalResult.reason : new Error("Could not read worklogs for this date.")
      if (warnings.length) toast.warning(options.locale === "fa" ? "بعضی Worklogها خوانده نشدند" : "Some worklogs could not be read", { description: warnings[0] })
    } catch (error) {
      toast.error(options.locale === "fa" ? "خواندن Worklogهای این روز ناموفق بود" : "Could not read worklogs for this date", { description: jiraErrorMessage(error, "Could not read worklogs for this date.") })
    } finally { setLoading(false) }
  }

  useEffect(() => { void refreshDay() }, [options.boardId, options.projectKey, options.issues.length, options.currentUser?.accountId, options.currentUser?.name, options.currentUser?.key, dateKey(options.date)])

  useEffect(() => {
    if (draft.length && draft.some((entry) => !options.selectedKeys.has(entry.issueKey))) setDraft((current) => current.filter((entry) => options.selectedKeys.has(entry.issueKey)))
  }, [selectedKeySignature, draft])

  useEffect(() => {
    if (options.strategy !== "estimate-only") return
    setDraft(buildEstimateOnlyWorklogDraft(selectedIssues))
  }, [options.strategy, selectedKeySignature, selectedEstimateSignature])

  async function saveTarget() {
    const parsed = parseWorklogDuration(targetText)
    if (!parsed || parsed < 30 || parsed > 1440) { toast.error(options.locale === "fa" ? "هدف روزانه معتبر نیست" : "Invalid daily target"); return }
    setTargetMinutes(parsed); setTargetText(formatWorklogMinutes(parsed)); await saveWorklogSettings({ dailyTargetMinutes: parsed })
    toast.success(options.locale === "fa" ? "هدف روزانه ذخیره شد" : "Daily target saved")
  }

  function prepare(strategy: Exclude<WorklogDistributionStrategy, "manual">, minutesOverride?: number) {
    if (!selectedIssues.length) { toast.info(options.locale === "fa" ? "اول چند تسک انتخاب کن" : "Choose issues first"); return }
    if (strategy === "estimate-only") {
      const next = buildEstimateOnlyWorklogDraft(selectedIssues)
      if (!next.length) {
        toast.info(options.locale === "fa" ? "تسک های انتخاب شده Estimate باقی مانده ندارند" : "Selected issues have no remaining estimates")
        return
      }
      setDraft(next)
      return
    }
    const minutes = minutesOverride ?? selectedTargetMinutes
    if (minutes <= 0) { toast.info(options.locale === "fa" ? "زمان تقسیم را مشخص کن" : "Choose a duration first"); return }
    setDraft(buildWorklogDraft(selectedIssues, minutes, strategy))
  }

  function prepareManual() { setDraft(buildManualWorklogDraft(selectedIssues, draft)) }

  async function prepareAi() {
    if (!selectedIssues.length || selectedTargetMinutes <= 0) return
    setLoading(true)
    try { setDraft(await generateAiWorklogDraft(options.locale, selectedIssues, selectedTargetMinutes, note, loggedMinutesByIssue, options.date)) }
    catch (error) { toast.error(options.locale === "fa" ? "پیشنهاد AI ساخته نشد" : "AI worklog suggestion failed", { description: error instanceof Error ? error.message : undefined }) }
    finally { setLoading(false) }
  }

  async function applyDraft(defaultComment = "") {
    const entries = draft.filter((entry) => entry.minutes > 0).map((entry) => ({ ...entry, comment: resolveWorklogComment(entry, defaultComment) }))
    if (!entries.length || !draftMinutes) return
    setApplying(true)
    try {
      const results = await applyWorklogDraft(entries, worklogStartedAtForDate(options.date))
      const ok = results.filter((item) => item.ok)
      const failed = results.filter((item) => !item.ok)
      const okKeys = new Set(ok.map((item) => item.issueKey))
      const okMinutes = entries.filter((entry) => okKeys.has(entry.issueKey)).reduce((sum, entry) => sum + entry.minutes, 0)
      if (ok.length) options.recordActivity?.({ kind: "worklog", outcome: failed.length ? "warning" : "success", title: "Worklog added", detail: `${formatWorklogMinutes(okMinutes)} across ${ok.length} issues`, issueKeys: ok.map((item) => item.issueKey) })
      if (failed.length) {
        const first = failed[0]
        const detail = `${failed.length}/${entries.length} failed.${first ? ` ${first.issueKey}: ${first.error ?? "Worklog failed."}` : ""}`
        toast.warning(options.locale === "fa" ? "بعضی Worklogها ثبت نشدند" : "Some worklogs failed", { description: detail })
      } else {
        toast.success(options.locale === "fa" ? "Worklogها ثبت شدند" : "Worklogs added")
        setNote("")
      }
      setDraft(failed.length ? draft.filter((entry) => failed.some((item) => item.issueKey === entry.issueKey)) : [])
      await refreshDay()
    } finally { setApplying(false) }
  }

  function updateDraft(issueKey: string, patch: Partial<Pick<WorklogDraftEntry, "minutes" | "comment">>) {
    setDraft((current) => current.map((entry) => entry.issueKey === issueKey ? { ...entry, ...patch } : entry))
  }

  return {
    targetMinutes, targetText, setTargetText, saveTarget, dayMinutes, scopeMinutes, daySummary, loggedMinutesByIssue, remainingMinutes,
    selectionText, setSelectionText, selectedTargetMinutes, draft, setDraft, draftMinutes, note, setNote, loading, applying,
    selectedIssues, dailyCandidates, refreshDay, prepare, prepareManual, prepareAi, applyDraft, updateDraft,
    useRemaining: () => setSelectionText(formatWorklogMinutes(remainingMinutes || targetMinutes)),
    removeDraft: (issueKey: string) => setDraft((current) => current.filter((entry) => entry.issueKey !== issueKey)),
  }
}
