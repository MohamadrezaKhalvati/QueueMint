import { Sparkles } from "lucide-react"

import { JiraUserAvatar } from "@/components/jira-user-avatar"
import type { AssigneeSuggestion } from "@/lib/intelligence"
import type { AppLocale } from "@/types"

export function SmartAssigneeSuggestions({ locale, suggestions, onSelect }: { locale: AppLocale; suggestions: AssigneeSuggestion[]; onSelect: (identity: string) => void }) {
  if (!suggestions.length) return null
  return (
    <div className="mt-2 rounded-lg border border-dashed bg-muted/10 p-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><Sparkles className="size-3.5 text-primary" />{locale === "fa" ? "پیشنهاد هوشمند مسئول" : "Smart assignee suggestions"}</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button key={item.identity} type="button" onClick={() => onSelect(item.identity)} className="inline-flex min-w-0 items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-start text-xs transition-colors hover:border-primary/30 hover:bg-primary/[0.03]">
            <JiraUserAvatar name={item.displayName} avatarUrl={item.avatarUrl} className="size-5" />
            <span className="min-w-0"><span className="block max-w-32 truncate font-medium">{item.displayName}</span><span className="block text-[10px] text-muted-foreground">{item.workload} {locale === "fa" ? "تسک باز" : "open"}{item.related ? ` · ${item.related} ${locale === "fa" ? "مرتبط" : "related"}` : ""}</span></span>
          </button>
        ))}
      </div>
    </div>
  )
}
