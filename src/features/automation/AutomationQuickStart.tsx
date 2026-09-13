import { ArrowRight, ListChecks, Plus, SlidersHorizontal, Sparkles } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { SimpleSelect } from "@/components/jira-controls"
import type { JiraPriority } from "@/types"
import type { AutomationCopy } from "./automation-copy"
import type { QuickAutomationActionInput, QuickAutomationActionKind } from "./automation-types"

export function AutomationQuickStart({ tx, priorities, canAssignToMe, onCreateQuickAction, onOpenAdvanced }: {
  tx: AutomationCopy
  priorities: JiraPriority[]
  canAssignToMe: boolean
  onCreateQuickAction: (input: QuickAutomationActionInput) => string | null
  onOpenAdvanced: () => void
}) {
  const [kind, setKind] = useState<QuickAutomationActionKind>("set-priority")
  const [priority, setPriority] = useState("")
  const [error, setError] = useState("")

  const actions = [
    { value: "set-priority", label: tx.quickPriority },
    ...(canAssignToMe ? [{ value: "assign-to-me", label: tx.quickAssignMe }] : []),
    { value: "unassign", label: tx.quickUnassign },
    { value: "move-backlog", label: tx.quickBacklog },
  ]

  function create() {
    setError("")
    if (kind === "set-priority" && !priority) return setError(tx.choosePriority)
    const problem = onCreateQuickAction({ kind, priority: kind === "set-priority" ? priority : undefined })
    if (problem) setError(problem)
  }

  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-4" /></div>
        <div><h2 className="text-base font-semibold">{tx.quickStartTitle}</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{tx.quickStartHint}</p></div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {[{ text: tx.flowAction, icon: Plus }, { text: tx.flowRule, icon: SlidersHorizontal }, { text: tx.flowReview, icon: ListChecks }].map(({ text, icon: Icon }) => (
          <div key={text} className="flex items-center gap-2 rounded-xl border bg-muted/10 px-3 py-2.5 text-xs font-medium"><Icon className="size-3.5 text-primary" />{text}</div>
        ))}
      </div>

      <div className="rounded-xl border bg-background p-3.5">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <SimpleSelect value={kind} onValueChange={(value) => setKind(value as QuickAutomationActionKind)} items={actions} />
          {kind === "set-priority" ? (
            <SimpleSelect value={priority} onValueChange={setPriority} items={priorities.map((item) => ({ value: item.name, label: item.name }))} placeholder={tx.choosePriority} />
          ) : <div className="hidden sm:block" />}
          <Button onClick={create}><Plus className="size-4" />{tx.quickAdd}</Button>
        </div>
        {error ? <div className="mt-2 text-xs text-destructive">{error}</div> : null}
      </div>

      <Button variant="ghost" size="sm" className="mt-3" onClick={onOpenAdvanced}>{tx.advancedAction}<ArrowRight className="size-3.5 rtl:rotate-180" /></Button>
    </section>
  )
}
