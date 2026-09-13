import { LoaderCircle, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { DuplicateMatch } from "@/lib/intelligence"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/types"

export function PotentialDuplicatesPanel({ locale, matches, loading, projectChecked, onCheck, onOpen }: {
  locale: AppLocale
  matches: DuplicateMatch[]
  loading: boolean
  projectChecked: boolean
  onCheck: () => void
  onOpen: (issueKey: string) => void
}) {
  return (
    <div className={cn("mt-2 rounded-lg border p-2.5", matches.length ? "border-amber-300/60 bg-amber-50/50 dark:border-amber-800/70 dark:bg-amber-950/15" : "border-dashed bg-muted/10")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium"><Search className={cn("size-3.5", matches.length ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground")} />{matches.length ? (locale === "fa" ? "تسک های مشابه پیدا شد" : "Potential duplicates") : (projectChecked ? (locale === "fa" ? "مورد مشابه نزدیکی پیدا نشد" : "No close duplicates found") : (locale === "fa" ? "بررسی تکراری بودن" : "Duplicate check"))}</div>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={onCheck} disabled={loading}>{loading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}{locale === "fa" ? "جستجو در پروژه" : "Search project"}</Button>
      </div>
      {matches.length ? <div className="mt-2 space-y-1.5">{matches.map(({ issue, score }) => <button key={issue.key} type="button" onClick={() => onOpen(issue.key)} className="flex w-full min-w-0 items-center gap-2 rounded-md border bg-background/80 px-2.5 py-2 text-start transition-colors hover:border-primary/25"><Badge variant="outline" className="shrink-0 font-mono text-[10px]">{issue.key}</Badge><span className="min-w-0 flex-1 truncate text-xs">{issue.summary}</span><span className="shrink-0 text-[10px] font-semibold text-amber-700 dark:text-amber-300">{score}%</span></button>)}</div> : null}
    </div>
  )
}
