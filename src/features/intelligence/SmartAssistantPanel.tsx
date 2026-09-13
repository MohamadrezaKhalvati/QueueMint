import { AlertTriangle, BrainCircuit, ExternalLink, LoaderCircle, RefreshCcw, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SmartAssistantDataOptions, SmartAssistantSuggestion } from "@/lib/smart-assistant"
import type { AppLocale } from "@/types"

const DATA_KEYS: Array<keyof SmartAssistantDataOptions> = ["currentDraft", "pageContext", "screenshot", "diagnostics", "jiraMetadata", "duplicateCandidates"]

function labels(locale: AppLocale) {
  return locale === "fa" ? {
    title: "دستیار هوشمند", hint: "قبل از ارسال، دقیقاً انتخاب کن چه اطلاعاتی از مرورگر خارج شود.", local: "فقط محلی",
    configure: "برای پیشنهادهای هوشمند، OpenAI را در Settings تنظیم کن. پیشنهادهای محلی QueueMint همچنان داخل مرورگر می‌مانند.", generate: "ساخت پیشنهاد",
    generating: "در حال بررسی", apply: "اعمال پیشنهاد", refresh: "بازخوانی تنظیمات", sent: "داده‌های ارسالی", preview: "پیشنهاد آماده",
    currentDraft: "متن فعلی فرم", pageContext: "آدرس و اطلاعات صفحه", screenshot: "تصویر فعال", diagnostics: "خطاها و Diagnostics",
    jiraMetadata: "فیلدها و گزینه‌های Jira", duplicateCandidates: "عنوان تسک‌های اخیر برای تشخیص تکراری", duplicates: "مشابه‌های معنایی",
    steps: "مراحل", expected: "انتظار", actual: "فعلی", open: "باز کردن",
  } : {
    title: "Smart Assistant", hint: "Choose exactly what may leave the browser before generating a suggestion.", local: "Local only",
    configure: "Configure OpenAI in Settings for AI suggestions. Existing QueueMint suggestions remain local to the browser.", generate: "Generate suggestion",
    generating: "Analyzing", apply: "Apply suggestion", refresh: "Reload settings", sent: "Data sent", preview: "Suggestion ready",
    currentDraft: "Current form text", pageContext: "Page URL and context", screenshot: "Active screenshot", diagnostics: "Errors and diagnostics",
    jiraMetadata: "Jira fields and available values", duplicateCandidates: "Recent issue titles for semantic duplicates", duplicates: "Semantic duplicates",
    steps: "Steps", expected: "Expected", actual: "Actual", open: "Open",
  }
}

export function SmartAssistantPanel({ locale, configured, model, options, available, suggestion, loading, error, onOption, onGenerate, onApply, onRefresh, onOpenIssue }: {
  locale: AppLocale
  configured: boolean
  model?: string
  options: SmartAssistantDataOptions
  available: Record<keyof SmartAssistantDataOptions, boolean>
  suggestion: SmartAssistantSuggestion | null
  loading: boolean
  error: string | null
  onOption: (key: keyof SmartAssistantDataOptions, value: boolean) => void
  onGenerate: () => void
  onApply: (suggestion: SmartAssistantSuggestion) => void
  onRefresh: () => void
  onOpenIssue?: (key: string) => void
}) {
  const tx = labels(locale)
  return (
    <section className="rounded-xl border bg-card p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="flex items-center gap-2 text-sm font-semibold"><BrainCircuit className="size-4 text-primary" />{tx.title}</div><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{tx.hint}</p></div>
        <Badge variant="outline" className="shrink-0 text-[10px]">{configured ? model || "OpenAI" : tx.local}</Badge>
      </div>

      {!configured ? (
        <div className="mt-3 rounded-lg border border-dashed bg-muted/10 p-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2"><Sparkles className="mt-0.5 size-3.5 shrink-0" /><span>{tx.configure}</span></div>
          <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-[11px]" onClick={onRefresh}><RefreshCcw className="size-3" />{tx.refresh}</Button>
        </div>
      ) : (
        <>
          <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{tx.sent}</div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {DATA_KEYS.map((key) => (
              <label key={key} className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[11px] ${available[key] ? "cursor-pointer bg-background" : "cursor-not-allowed opacity-45"}`}>
                <input type="checkbox" className="mt-0.5 size-3.5 accent-current" checked={available[key] && options[key]} disabled={!available[key] || loading} onChange={(event) => onOption(key, event.target.checked)} />
                <span className="leading-4">{tx[key]}</span>
              </label>
            ))}
          </div>
          <Button type="button" size="sm" className="mt-3 w-full" disabled={loading} onClick={onGenerate}>{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}{loading ? tx.generating : tx.generate}</Button>
        </>
      )}

      {error ? <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-2.5 text-[11px] text-destructive"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /><span>{error}</span></div> : null}

      {suggestion ? <SuggestionPreview locale={locale} suggestion={suggestion} labels={tx} onApply={onApply} onOpenIssue={onOpenIssue} /> : null}
    </section>
  )
}

function SuggestionPreview({ locale, suggestion, labels: tx, onApply, onOpenIssue }: { locale: AppLocale; suggestion: SmartAssistantSuggestion; labels: ReturnType<typeof labels>; onApply: (value: SmartAssistantSuggestion) => void; onOpenIssue?: (key: string) => void }) {
  const chips = [suggestion.issueType, suggestion.priority, suggestion.component, suggestion.epic, suggestion.assignee, ...suggestion.labels].filter(Boolean) as string[]
  return (
    <div className="mt-3 rounded-lg border bg-muted/10 p-3">
      <div className="text-[11px] font-semibold">{tx.preview}</div>
      {suggestion.summary ? <div className="mt-1 text-sm font-medium leading-5">{suggestion.summary}</div> : null}
      {chips.length ? <div className="mt-2 flex flex-wrap gap-1">{chips.slice(0, 8).map((chip, index) => <Badge key={`${chip}-${index}`} variant="secondary" className="text-[10px]">{chip}</Badge>)}</div> : null}
      <div className="mt-2 grid gap-1 text-[10px] text-muted-foreground sm:grid-cols-3"><span>{tx.steps}: {suggestion.stepsToReproduce.length}</span><span>{tx.expected}: {suggestion.expectedResult ? "✓" : "-"}</span><span>{tx.actual}: {suggestion.actualResult ? "✓" : "-"}</span></div>
      {suggestion.duplicates.length ? <div className="mt-3"><div className="text-[10px] font-semibold text-muted-foreground">{tx.duplicates}</div><div className="mt-1.5 grid gap-1">{suggestion.duplicates.slice(0, 4).map((item) => <button key={item.key} type="button" className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-start text-[10px]" onClick={() => onOpenIssue?.(item.key)} disabled={!onOpenIssue}><span className="font-mono">{item.key}</span><span className="min-w-0 flex-1 truncate" title={item.reason}>{item.reason}</span><span className="font-semibold text-warning">{Math.round(item.score)}%</span>{onOpenIssue ? <ExternalLink className="size-3" /> : null}</button>)}</div></div> : null}
      <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => onApply(suggestion)}><Sparkles className="size-3.5" />{tx.apply}</Button>
      <span className="sr-only">{locale}</span>
    </div>
  )
}
