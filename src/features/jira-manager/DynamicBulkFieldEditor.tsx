import { type ChangeEvent } from "react"
import { Check, XCircle } from "lucide-react"
import { SimpleSelect } from "@/components/jira-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { copy } from "@/features/app-shell/app-copy"
import { allowedValuePayload, dynamicFieldInitialValue, jiraValueLabel, type DynamicFieldDraft } from "@/features/bulk/bulk-utils"
import type { JiraEditableField } from "@/types"

export function DynamicBulkFieldEditor({ field, draft, t, onChange, onRemove }: {
  field: JiraEditableField
  draft: DynamicFieldDraft
  t: typeof copy.en | typeof copy.fa
  onChange: (draft: DynamicFieldDraft) => void
  onRemove: () => void
}) {
  const type = field.schema?.type?.toLowerCase() ?? "string"
  const isArray = type === "array"
  const allowed = field.allowedValues
  const availability = t.fieldAvailability.replace("{count}", String(field.availableOn)).replace("{total}", String(field.representativeCount))

  function setMode(mode: "set" | "clear") {
    onChange({ mode, value: mode === "set" ? dynamicFieldInitialValue(field) : null })
  }

  function renderEditor() {
    if (draft.mode === "clear") return <div className="rounded-[var(--qm-control-radius)] border border-dashed bg-background px-3 py-2 text-xs text-muted-foreground">{t.clearValue}</div>

    if (allowed.length && !isArray) {
      const encoded = allowed.findIndex((value) => JSON.stringify(allowedValuePayload(value)) === JSON.stringify(draft.value))
      return <SimpleSelect value={encoded >= 0 ? String(encoded) : ""} onValueChange={(value) => { const raw = allowed[Number(value)]; if (raw !== undefined) onChange({ ...draft, value: allowedValuePayload(raw) }) }} placeholder={t.setValue} items={allowed.map((value, index) => ({ value: String(index), label: jiraValueLabel(value) }))} />
    }

    if (allowed.length && isArray) {
      const selected = Array.isArray(draft.value) ? draft.value : []
      return (
        <div className="max-h-44 overflow-auto rounded-[var(--qm-control-radius)] border bg-background p-2">
          <div className="flex flex-wrap gap-1.5">
            {allowed.map((raw, index) => {
              const payload = allowedValuePayload(raw)
              const token = JSON.stringify(payload)
              const active = selected.some((item) => JSON.stringify(item) === token)
              return <Button key={`${field.id}-${index}`} type="button" size="sm" variant={active ? "secondary" : "outline"} className="h-8" onClick={() => onChange({ ...draft, value: active ? selected.filter((item) => JSON.stringify(item) !== token) : [...selected, payload] })}>{active ? <Check className="size-3.5" /> : null}{jiraValueLabel(raw)}</Button>
            })}
          </div>
        </div>
      )
    }

    if (type === "boolean") {
      return <SimpleSelect value={String(Boolean(draft.value))} onValueChange={(value) => onChange({ ...draft, value: value === "true" })} items={[{ value: "true", label: "True" }, { value: "false", label: "False" }]} />
    }
    if (type === "number") return <Input type="number" value={typeof draft.value === "string" || typeof draft.value === "number" ? draft.value : ""} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...draft, value: event.target.value })} />
    if (type === "date") return <Input type="date" value={typeof draft.value === "string" ? draft.value : ""} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...draft, value: event.target.value })} />
    if (type === "datetime") return <Input type="datetime-local" value={typeof draft.value === "string" ? draft.value : ""} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...draft, value: event.target.value })} />
    if (type === "array") return <Input value={Array.isArray(draft.value) ? draft.value.join(", ") : String(draft.value ?? "")} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...draft, value: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="value1, value2" />
    const multiline = field.name.toLowerCase().includes("environment") || (field.schema?.custom?.toLowerCase() ?? "").includes("textarea")
    if (multiline) return <Textarea value={typeof draft.value === "string" ? draft.value : String(draft.value ?? "")} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange({ ...draft, value: event.target.value })} rows={3} />
    return <Input value={typeof draft.value === "string" || typeof draft.value === "number" ? String(draft.value) : ""} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange({ ...draft, value: event.target.value })} />
  }

  return (
    <div className="rounded-[var(--qm-panel-radius)] border bg-background p-3">
      <div className="mb-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{field.name}</span>{field.required ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{t.fieldRequired}</Badge> : null}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{field.id} · {availability}</div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label={t.removeField}><XCircle className="size-4" /></Button>
      </div>
      <div className="mb-2 inline-flex rounded-[var(--qm-control-radius)] border bg-muted/20 p-1">
        <Button type="button" size="sm" variant={draft.mode === "set" ? "secondary" : "ghost"} onClick={() => setMode("set")}>{t.setValue}</Button>
        <Button type="button" size="sm" variant={draft.mode === "clear" ? "secondary" : "ghost"} disabled={field.required} onClick={() => setMode("clear")}>{t.clearValue}</Button>
      </div>
      {renderEditor()}
    </div>
  )
}
