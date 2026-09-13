import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/capture-select"
import type { SmartCaptureSuggestion, SmartTemplateId } from "@/lib/smart-capture"
import type { PopupCopy } from "./popup-copy"

export function PopupSmartDraftCard({ t, template, categoryLabel, suggestion, onTemplate, onApply }: {
  t: PopupCopy
  template: SmartTemplateId
  categoryLabel: string
  suggestion: SmartCaptureSuggestion
  onTemplate: (value: SmartTemplateId) => void
  onApply: () => void
}) {
  return (
    <div className="qm-smart-card">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" />{t.smartDraft}</div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{t.smartDraftHint}</p></div><span className="shrink-0 rounded-full border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">{categoryLabel}</span></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><Select value={template} onValueChange={(value: string) => onTemplate(value as SmartTemplateId)}><SelectTrigger><SelectValue placeholder={t.smartTemplate} /></SelectTrigger><SelectContent><SelectItem value="auto">{t.templateAuto}</SelectItem><SelectItem value="frontend">{t.templateFrontend}</SelectItem><SelectItem value="regression">{t.templateRegression}</SelectItem><SelectItem value="backend">{t.templateBackend}</SelectItem><SelectItem value="performance">{t.templatePerformance}</SelectItem></SelectContent></Select><Button type="button" variant="outline" onClick={onApply}><Sparkles className="size-4" />{t.applySuggestions}</Button></div>
      <div className="mt-3 flex flex-wrap gap-1.5">{suggestion.priority ? <span className="qm-smart-chip">{suggestion.priority}</span> : null}{suggestion.component ? <span className="qm-smart-chip">{suggestion.component}</span> : null}{suggestion.labels.slice(0, 4).map((label) => <span key={label} className="qm-smart-chip">#{label}</span>)}</div>
    </div>
  )
}
