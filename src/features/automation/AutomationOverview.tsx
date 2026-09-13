import { Activity, CheckCircle2, CircleDot, WandSparkles } from "lucide-react"
import type { AutomationCopy } from "./automation-copy"

export function AutomationOverview({ tx, enabledRules, matchingNow, savedActions, activity }: {
  tx: AutomationCopy
  enabledRules: number
  matchingNow: number
  savedActions: number
  activity: number
}) {
  const cards = [
    { label: tx.enabledRules, value: enabledRules, icon: CheckCircle2 },
    { label: tx.matchingNow, value: matchingNow, icon: CircleDot },
    { label: tx.savedActions, value: savedActions, icon: WandSparkles },
    { label: tx.activity, value: activity, icon: Activity },
  ]

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-2xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-muted/55 text-muted-foreground"><Icon className="size-4" /></span>
            <span><span className="block text-xs text-muted-foreground">{label}</span><span className="mt-1 block text-2xl font-semibold tabular-nums">{value}</span></span>
          </div>
        </div>
      ))}
    </div>
  )
}
