import { History } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ActivityEntry } from "@/lib/storage"
import type { AppLocale } from "@/types"
import { formatAutomationDate, type AutomationCopy } from "./automation-copy"

export function AutomationActivity({ tx, locale, activity, onClear }: { tx: AutomationCopy; locale: AppLocale; activity: ActivityEntry[]; onClear: () => void }) {
  return (
    <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-muted/55 text-muted-foreground"><History className="size-4" /></span><h2 className="text-base font-semibold">{tx.activity}</h2></div>{activity.length ? <Button variant="ghost" size="sm" onClick={onClear}>{tx.clearActivity}</Button> : null}</div>
      {!activity.length ? <div className="grid min-h-44 place-items-center rounded-xl border border-dashed bg-muted/10 px-5 text-center text-sm text-muted-foreground">{tx.noActivity}</div> : (
        <div className="space-y-3">{activity.slice(0, 24).map((entry) => (
          <div key={entry.id} className="relative ps-6"><span className={`absolute start-0 top-1.5 size-2.5 rounded-full ${entry.outcome === "success" ? "bg-emerald-500" : entry.outcome === "warning" ? "bg-amber-500" : "bg-destructive"}`} /><div className="text-sm font-medium">{entry.title}</div>{entry.detail ? <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{entry.detail}</div> : null}<div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground"><span>{formatAutomationDate(entry.createdAt, locale)}</span>{entry.issueKeys.length ? <span>· {entry.issueKeys.length} {tx.issues}</span> : null}</div></div>
        ))}</div>
      )}
    </section>
  )
}
