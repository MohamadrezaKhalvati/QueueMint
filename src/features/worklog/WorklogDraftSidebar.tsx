import { useMemo, useState } from "react"
import { BrainCircuit, Check, Clock3, Equal, Gauge, LoaderCircle, MessageSquareText, Plus, Save, Send, SlidersHorizontal, Target, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue, WorklogDraftEntry } from "@/types"
import { WorklogDateToolbar } from "./WorklogDateToolbar"
import { WorklogDurationInput } from "./WorklogDurationInput"
import { formatWorklogMinutes, worklogEstimateMinutes, type WorklogDistributionStrategy } from "./worklog-utils"

export function WorklogDraftSidebar({ locale, date, strategy, selectedIssues, draft, draftMinutes, remainingMinutes, targetMinutes, targetText, selectionText, loading, applying, note, onDateChange, onStrategyChange, onSelectionText, onTargetText, onSaveTarget, onNote, onManual, onBuild, onAi, onUpdate, onRemove, onDeselect, onFocusIssues, onApply }: {
  locale: AppLocale
  date: Date
  strategy: WorklogDistributionStrategy
  selectedIssues: JiraLiveIssue[]
  draft: WorklogDraftEntry[]
  draftMinutes: number
  remainingMinutes: number
  targetMinutes: number
  targetText: string
  selectionText: string
  loading: boolean
  applying: boolean
  note: string
  onDateChange: (value: Date) => void
  onStrategyChange: (value: WorklogDistributionStrategy) => void
  onSelectionText: (value: string) => void
  onTargetText: (value: string) => void
  onSaveTarget: () => void
  onNote: (value: string) => void
  onManual: () => void
  onBuild: (strategy: Exclude<WorklogDistributionStrategy, "manual">) => void
  onAi: () => void
  onUpdate: (issueKey: string, patch: Partial<Pick<WorklogDraftEntry, "minutes" | "comment">>) => void
  onRemove: (issueKey: string) => void
  onDeselect: (issueKey: string) => void
  onFocusIssues: () => void
  onApply: (defaultComment: string) => void
}) {
  const isFa = locale === "fa"
  const [settingsOpen, setSettingsOpen] = useState(false)
  const draftByKey = useMemo(() => new Map(draft.map((entry) => [entry.issueKey, entry])), [draft])
  const ready = draft.some((entry) => entry.minutes > 0) && draftMinutes > 0
  const estimateTotal = useMemo(() => selectedIssues.reduce((sum, issue) => sum + worklogEstimateMinutes(issue), 0), [selectedIssues])
  const dateText = new Intl.DateTimeFormat(isFa ? "fa-IR-u-ca-gregory" : "en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(date)
  const methods = [
    { id: "manual" as const, icon: SlidersHorizontal, title: isFa ? "دستی" : "Manual", hint: isFa ? "زمان هر تسک رو خودت وارد کن" : "Set time for each issue" },
    { id: "equal" as const, icon: Equal, title: isFa ? "تقسیم مساوی" : "Auto-distribute", hint: isFa ? "زمان کل رو مساوی تقسیم کن" : "Split the target evenly" },
    { id: "estimate" as const, icon: Gauge, title: isFa ? "وزن بر اساس Estimate" : "Estimate weighted", hint: isFa ? "زمان انتخابی را با وزن Estimate تقسیم کن" : "Split the selected target using estimates as weights" },
    { id: "estimate-only" as const, icon: Clock3, title: isFa ? "فقط Estimate" : "Estimate only", hint: isFa ? `همان زمان باقی مانده Jira را ثبت کن · ${formatWorklogMinutes(estimateTotal)}` : `Use Jira remaining estimates only · ${formatWorklogMinutes(estimateTotal)}` },
  ]

  function chooseMethod(next: WorklogDistributionStrategy) {
    onStrategyChange(next)
    if (next === "manual") onManual()
    else onBuild(next)
  }

  return (
    <aside className="qm-worklog-draft-sidebar">
      <div className="qm-worklog-draft-head">
        <div><div className="text-base font-semibold">{isFa ? "پیش نویس Worklog" : "Worklog draft"}</div><div className="mt-0.5 text-xs text-muted-foreground">{selectedIssues.length} {isFa ? "تسک" : "issues"} · <strong className="text-foreground">{formatWorklogMinutes(draftMinutes)}</strong></div></div>
        <span className={cn("qm-worklog-status-badge inline-flex items-center gap-1 border px-2 py-1 text-[11px] font-semibold", ready ? "border-success/25 bg-success/10 text-success" : "border-border bg-muted/30 text-muted-foreground")}><Check className="size-3" />{ready ? (isFa ? "آماده ثبت" : "Ready to submit") : (isFa ? "در حال آماده سازی" : "Preparing")}</span>
      </div>

      <div className="qm-worklog-draft-date">
        <span className="text-[11px] font-semibold text-muted-foreground">{isFa ? "تاریخ ثبت" : "Log date"}</span>
        <WorklogDateToolbar locale={locale} value={date} onChange={onDateChange} loading={loading} />
      </div>

      <div className="qm-worklog-draft-scroll qm-worklog-scroll">
        <div className="qm-worklog-draft-list">
          {!selectedIssues.length ? <button type="button" onClick={onFocusIssues} className="qm-worklog-empty-picker grid min-h-36 w-full place-items-center border border-dashed bg-muted/10 px-5 text-center text-sm text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.025]"><span><Plus className="mx-auto mb-2 size-5 text-primary" />{isFa ? "از بورد یا جدول چند تسک انتخاب کن" : "Choose issues from the board or table"}</span></button> : selectedIssues.map((issue) => {
            const entry = draftByKey.get(issue.key)
            return <div key={issue.key} className="qm-worklog-draft-row">
              <button type="button" className="grid size-5 shrink-0 place-items-center rounded-[var(--qm-control-radius)] border border-primary bg-primary text-primary-foreground" aria-label={isFa ? `حذف ${issue.key} از انتخاب` : `Deselect ${issue.key}`} onClick={() => onDeselect(issue.key)}><Check className="size-3.5" /></button>
              <div className="min-w-0 flex-1"><button type="button" onClick={onFocusIssues} className="font-mono text-[11px] font-medium text-primary hover:underline">{issue.key}</button><div className="mt-0.5 line-clamp-2 text-xs font-medium leading-4">{issue.summary}</div></div>
              <WorklogDurationInput minutes={entry?.minutes ?? 0} onChange={(minutes) => entry ? onUpdate(issue.key, { minutes }) : undefined} disabled={!entry} ariaLabel={isFa ? `زمان ${issue.key}` : `Time for ${issue.key}`} />
              <Button variant="ghost" size="icon-sm" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => { onRemove(issue.key); onDeselect(issue.key) }} aria-label={isFa ? "حذف" : "Remove"}><X className="size-3.5" /></Button>
            </div>
          })}
        </div>

        <Button variant="outline" size="sm" className="mx-4 my-3 w-[calc(100%-2rem)] border-primary/25 text-primary" onClick={onFocusIssues}><Plus className="size-3.5" />{isFa ? "افزودن تسک" : "Add another issue"}</Button>

        <div className="border-t px-4 py-4">
          <div className="flex items-end justify-between gap-3"><div><div className="text-xs text-muted-foreground">{isFa ? "زمان کل Draft" : "Total time"}</div><div className="mt-0.5 text-xl font-semibold tabular-nums">{formatWorklogMinutes(draftMinutes)}</div></div><label className="grid gap-1 text-[11px] font-medium text-muted-foreground"><span>{strategy === "estimate-only" ? (isFa ? "جمع Estimate" : "Estimate total") : (isFa ? "زمان برای تقسیم" : "Time to distribute")}</span><Input value={strategy === "estimate-only" ? formatWorklogMinutes(estimateTotal) : selectionText} onChange={(event) => onSelectionText(event.target.value)} disabled={strategy === "estimate-only"} className="h-9 w-28 bg-background text-center text-xs font-medium" placeholder="7h 30m" /></label></div>
          <div className="mt-4 text-xs font-semibold">{isFa ? "روش تقسیم" : "Distribution method"}</div>
          <div className="mt-2 grid gap-2">
            {methods.map(({ id, icon: Icon, title, hint }) => <button key={id} type="button" aria-pressed={strategy === id} onClick={() => chooseMethod(id)} className={cn("qm-worklog-method flex min-h-12 items-center gap-3 border px-3 py-2 text-start outline-none transition hover:border-primary/30 hover:bg-primary/[0.02] focus-visible:ring-[3px] focus-visible:ring-ring/20", strategy === id && "border-primary/35 bg-primary/[0.055]")}><span className={cn("qm-worklog-method-check grid size-5 shrink-0 place-items-center border", strategy === id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/35 text-transparent")}><Check className="size-3" /></span><Icon className={cn("size-4 shrink-0", strategy === id ? "text-primary" : "text-muted-foreground")} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{title}</span><span className="block text-[11px] text-muted-foreground">{hint}</span></span></button>)}
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onAi} disabled={!selectedIssues.length || loading}>{loading ? <LoaderCircle className="size-3.5 animate-spin" /> : <BrainCircuit className="size-3.5" />}{isFa ? "پیشنهاد AI" : "AI suggestion"}</Button>
        </div>

        <div className="border-t px-4 py-4">
          <label className="grid gap-1.5 text-xs font-medium"><span className="inline-flex items-center gap-1.5"><MessageSquareText className="size-3.5 text-muted-foreground" />{isFa ? "توضیح پیش فرض Worklog (اختیاری)" : "Default worklog description (optional)"}</span><Textarea value={note} onChange={(event) => onNote(event.target.value)} rows={3} maxLength={500} placeholder={isFa ? "مثلا: پیاده سازی و بررسی این تسک ها" : "For example: implementation and validation work"} /><span className="flex items-center justify-between gap-3 text-[10px] font-normal text-muted-foreground"><span>{isFa ? "اگر خالی باشد، QueueMint برای هر تسک از کلید و عنوان آن توضیح می سازد." : "If left blank, QueueMint uses each issue key and summary as the worklog description."}</span><span className="shrink-0">{note.length}/500</span></span></label>
        </div>

        <div className="border-t bg-muted/[0.08] px-4 py-3">
          <button type="button" className="flex w-full items-center gap-2 text-start" onClick={() => setSettingsOpen((value) => !value)}><Target className="size-3.5 text-primary" /><span className="flex-1 text-xs font-semibold">{isFa ? "هدف روزانه" : "Daily target"}</span><span className="text-xs font-medium tabular-nums text-muted-foreground">{formatWorklogMinutes(targetMinutes)}</span></button>
          {settingsOpen ? <div className="mt-3 flex items-center gap-2"><Input value={targetText} onChange={(event) => onTargetText(event.target.value)} className="h-9 flex-1" placeholder="7h 30m" /><Button variant="outline" size="sm" onClick={onSaveTarget}><Save className="size-3.5" />{isFa ? "ذخیره" : "Save"}</Button></div> : null}
        </div>
      </div>

      <div className="qm-worklog-draft-submit">
        <Button size="lg" className="w-full" onClick={() => onApply(note)} disabled={!ready || applying}>{applying ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{isFa ? `ثبت Worklog (${formatWorklogMinutes(draftMinutes)})` : `Submit worklog (${formatWorklogMinutes(draftMinutes)})`}</Button>
        <div className="mt-2 text-center text-[10px] text-muted-foreground">{isFa ? `زمان برای ${dateText} در Jira ثبت میشه.` : `Time will be logged to Jira for ${dateText}.`}</div>
      </div>
    </aside>
  )
}
