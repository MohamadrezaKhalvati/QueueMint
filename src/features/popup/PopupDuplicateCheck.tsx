import { LoaderCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { jiraBrowseUrl } from "@/lib/jira"
import type { DuplicateMatch } from "@/lib/intelligence"
import type { AppLocale } from "@/types"

export function PopupDuplicateCheck({ locale, summary, checkedSummary, loading, matches, onCheck }: {
  locale: AppLocale
  summary: string
  checkedSummary: string
  loading: boolean
  matches: DuplicateMatch[]
  onCheck: () => void
}) {
  if (summary.trim().length < 5) return null
  const title = matches.length
    ? (locale === "fa" ? "تسک مشابه پیدا شد" : "Potential duplicates")
    : checkedSummary === summary.trim()
      ? (locale === "fa" ? "مورد مشابه نزدیکی پیدا نشد" : "No close duplicates found")
      : (locale === "fa" ? "بررسی تکراری بودن" : "Duplicate check")
  return (
    <div className={`mt-2 rounded-lg border p-2.5 ${matches.length ? "border-warning/30 bg-warning/5" : "border-dashed bg-muted/10"}`}>
      <div className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium"><Search className="size-3.5 text-muted-foreground" />{title}</span><Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-[10px]" onClick={onCheck} disabled={loading}>{loading ? <LoaderCircle className="size-3 animate-spin" /> : <Search className="size-3" />}{locale === "fa" ? "کل پروژه" : "Project"}</Button></div>
      {matches.length ? <div className="mt-2 grid gap-1.5">{matches.map(({ issue, score }) => <button key={issue.key} type="button" onClick={() => window.open(jiraBrowseUrl(issue.key), "_blank")} className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-start"><span className="shrink-0 font-mono text-[10px] text-muted-foreground">{issue.key}</span><span className="min-w-0 flex-1 truncate text-[11px]">{issue.summary}</span><span className="shrink-0 text-[10px] font-semibold text-warning">{score}%</span></button>)}</div> : null}
    </div>
  )
}
