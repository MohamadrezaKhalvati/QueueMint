import { Sparkles } from "lucide-react"
import { useMemo, useState } from "react"

import { SimpleSelect } from "@/components/jira-controls"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { AutomationConditionKind, SavedWorkspaceAction } from "@/lib/storage"
import type { JiraLiveIssue, JiraPriority } from "@/types"
import { conditionNeedsValue, type AutomationCopy } from "./automation-copy"

export function AutomationRuleBuilder({ tx, issues, priorities, savedActions, onCreateRule }: {
  tx: AutomationCopy
  issues: JiraLiveIssue[]
  priorities: JiraPriority[]
  savedActions: SavedWorkspaceAction[]
  onCreateRule: (input: { name: string; condition: { kind: AutomationConditionKind; value?: string }; actionId: string }) => string | null
}) {
  const [name, setName] = useState("")
  const [kind, setKind] = useState<AutomationConditionKind>("unassigned")
  const [value, setValue] = useState("")
  const [actionId, setActionId] = useState("")
  const [error, setError] = useState("")

  const statuses = useMemo(() => Array.from(new Set(issues.map((issue) => issue.status).filter((item): item is string => Boolean(item)))).sort(), [issues])
  const types = useMemo(() => Array.from(new Set(issues.map((issue) => issue.type).filter(Boolean))).sort(), [issues])
  const labels = useMemo(() => Array.from(new Set(issues.flatMap((issue) => issue.labels))).sort(), [issues])
  const conditions = [
    { value: "unassigned", label: tx.conditionUnassigned }, { value: "no-estimate", label: tx.conditionNoEstimate },
    { value: "backlog", label: tx.conditionBacklog }, { value: "priority-is", label: tx.conditionPriority },
    { value: "status-is", label: tx.conditionStatus }, { value: "type-is", label: tx.conditionType },
    { value: "label-has", label: tx.conditionLabel },
  ]
  const valueItems = kind === "priority-is" ? priorities.map((item) => ({ value: item.name, label: item.name }))
    : kind === "status-is" ? statuses.map((item) => ({ value: item, label: item }))
      : kind === "type-is" ? types.map((item) => ({ value: item, label: item }))
        : kind === "label-has" ? labels.map((item) => ({ value: item, label: item })) : []

  function save() {
    setError("")
    if (!name.trim()) return setError(tx.nameRequired)
    if (!actionId) return setError(tx.actionRequired)
    if (conditionNeedsValue(kind) && !value.trim()) return setError(tx.valueRequired)
    const problem = onCreateRule({ name: name.trim(), condition: { kind, value: conditionNeedsValue(kind) ? value.trim() : undefined }, actionId })
    if (problem) return setError(problem)
    setName("")
    setValue("")
  }

  return (
    <section className="rounded-[var(--qm-panel-radius)] border bg-card p-4 sm:p-5">
      <div className="mb-4"><h2 className="text-base font-semibold">{tx.newRule}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{tx.safeNote}</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2"><FieldLabel>{tx.ruleName}</FieldLabel><Input value={name} onChange={(event) => setName(event.target.value)} placeholder={tx.ruleNamePlaceholder} maxLength={80} /></Field>
        <Field><FieldLabel>{tx.condition}</FieldLabel><SimpleSelect value={kind} onValueChange={(next) => { setKind(next as AutomationConditionKind); setValue("") }} items={conditions} /></Field>
        {conditionNeedsValue(kind) ? <Field><FieldLabel>{tx.conditionValue}</FieldLabel><SimpleSelect value={value} onValueChange={setValue} items={valueItems} placeholder={tx.conditionValue} /></Field> : <div className="hidden md:block" />}
        <Field className="md:col-span-2"><FieldLabel>{tx.action}</FieldLabel><SimpleSelect value={actionId} onValueChange={setActionId} items={savedActions.map((action) => ({ value: action.id, label: action.name }))} placeholder={tx.action} /><FieldDescription>{tx.safeNote}</FieldDescription></Field>
        {error ? <div className="md:col-span-2 rounded-[var(--qm-control-radius)] border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</div> : null}
        <div className="md:col-span-2 flex justify-end"><Button onClick={save}><Sparkles className="size-4" />{tx.createRule}</Button></div>
      </div>
    </section>
  )
}
