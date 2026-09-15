import { Play, Trash2, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { matchingIssuesForRule } from "@/lib/intelligence"
import type { AutomationRule, SavedWorkspaceAction } from "@/lib/storage"
import type { AppLocale, JiraLiveIssue } from "@/types"
import { conditionText, formatAutomationDate, type AutomationCopy } from "./automation-copy"

export function AutomationRuleList({ tx, locale, projectKey, boardId, issues, savedActions, rules, onToggle, onDelete, onReview }: {
  tx: AutomationCopy
  locale: AppLocale
  projectKey?: string
  boardId: number | null
  issues: JiraLiveIssue[]
  savedActions: SavedWorkspaceAction[]
  rules: AutomationRule[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onReview: (rule: AutomationRule) => void
}) {
  const contextRules = rules.filter((rule) => (!rule.projectKey || rule.projectKey === projectKey) && (!rule.boardId || rule.boardId === boardId))
  return (
    <section className="rounded-[var(--qm-panel-radius)] border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-[var(--qm-control-radius)] bg-muted/55 text-muted-foreground"><Zap className="size-4" /></span><h2 className="text-base font-semibold">{tx.enabledRules}</h2></div><Badge variant="outline">{contextRules.length}</Badge></div>
      {!contextRules.length ? <div className="grid min-h-36 place-items-center rounded-[var(--qm-panel-radius)] border border-dashed bg-muted/10 px-5 text-center text-sm text-muted-foreground">{tx.noRules}</div> : (
        <div className="space-y-2">{contextRules.map((rule) => {
          const matches = matchingIssuesForRule(rule, issues)
          const action = savedActions.find((item) => item.id === rule.actionId)
          return <div key={rule.id} className="rounded-[var(--qm-panel-radius)] border bg-background p-3.5">
            <div className="flex flex-wrap items-start gap-3">
              <button type="button" onClick={() => onToggle(rule.id)} className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--qm-control-radius)] border transition-colors ${rule.enabled ? "border-primary/20 bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"}`} title={rule.enabled ? tx.disable : tx.enable}><Zap className="size-4" /></button>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{rule.name}</span><Badge variant={rule.enabled ? "secondary" : "outline"}>{rule.enabled ? tx.enable : tx.disable}</Badge></div><div className="mt-1 text-xs text-muted-foreground">{conditionText(rule.condition.kind, rule.condition.value, tx)} · {action?.name ?? tx.actionRequired}</div>{rule.lastCheckedAt ? <div className="mt-1 text-[11px] text-muted-foreground">{tx.lastChecked}: {formatAutomationDate(rule.lastCheckedAt, locale)} · {rule.lastMatchCount ?? 0} {tx.issues}</div> : null}</div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="min-w-16 justify-center">{matches.length} {tx.issues}</Badge><Button variant="outline" size="sm" onClick={() => onReview(rule)} disabled={!matches.length || !action}><Play className="size-3.5" />{tx.review}</Button><Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete(rule.id)} aria-label={tx.delete}><Trash2 className="size-4" /></Button></div>
            </div>
          </div>
        })}</div>
      )}
    </section>
  )
}
