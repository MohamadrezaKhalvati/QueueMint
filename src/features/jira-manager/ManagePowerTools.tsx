import { Calculator, CircleUserRound, Tags, WandSparkles, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue } from "@/types"
import { powerToolCandidates, type JiraPowerToolKind, type JiraPowerToolPreparation } from "./power-tools"

export function ManagePowerTools({ locale, issues, selectedKeys, currentUserIdentity, onPrepare }: {
  locale: AppLocale
  issues: JiraLiveIssue[]
  selectedKeys: Set<string>
  currentUserIdentity?: string
  onPrepare: (input: JiraPowerToolPreparation) => void
}) {
  const baseIssues = selectedKeys.size ? issues.filter((issue) => selectedKeys.has(issue.key)) : issues
  const isFa = locale === "fa"
  const cards: Array<{ kind: JiraPowerToolKind; title: string; hint: string; icon: LucideIcon; needsUser?: boolean }> = [
    { kind: "assign-unassigned", title: isFa ? "مسئول برای بدون‌مسئول‌ها" : "Own unassigned", hint: isFa ? "فقط موارد بدون مسئول را انتخاب می‌کند و مسئول را روی خودت می‌گذارد." : "Select only unassigned issues and stage assignment to you.", icon: CircleUserRound, needsUser: true },
    { kind: "missing-estimate", title: isFa ? "تکمیل تخمین‌های خالی" : "Fill estimate gaps", hint: isFa ? "موارد بدون تخمین را برای ویرایش گروهی آماده می‌کند." : "Collect issues with no time or story-point estimate for bulk edit.", icon: Calculator },
    { kind: "missing-labels", title: isFa ? "تکمیل برچسب‌های خالی" : "Fill label gaps", hint: isFa ? "موارد بدون برچسب را جدا می‌کند تا برچسب مشترک اضافه کنی." : "Collect unlabeled issues so you can add shared labels safely.", icon: Tags },
    { kind: "backlog-to-sprint", title: isFa ? "آماده‌سازی برای اسپرینت" : "Prepare for sprint", hint: isFa ? "موارد بک‌لاگ را انتخاب می‌کند و انتقال به اسپرینت را برای بازبینی آماده می‌کند." : "Collect backlog issues and stage sprint placement for review.", icon: WandSparkles },
  ]

  return (
    <section className="mb-4 rounded-xl border bg-card p-3 shadow-none">
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><WandSparkles className="size-4 text-primary" /><span className="text-sm font-semibold">{isFa ? "Jira Power Tools" : "Jira Power Tools"}</span></div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedKeys.size ? (isFa ? "ابزارها فقط روی انتخاب فعلی کار می‌کنند. هیچ تغییری قبل از Preview اعمال نمی‌شود." : "Tools target the current selection. Nothing changes before Preview.") : (isFa ? "ابزارها روی محدوده و فیلتر فعلی کار می‌کنند. هیچ تغییری قبل از Preview اعمال نمی‌شود." : "Tools target the current filtered scope. Nothing changes before Preview.")}</p>
        </div>
        <Badge variant="secondary">{baseIssues.length} {isFa ? "مورد" : "issues"}</Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ kind, title, hint, icon: Icon, needsUser }) => {
          const matches = powerToolCandidates(kind, baseIssues)
          const disabled = !matches.length || Boolean(needsUser && !currentUserIdentity)
          return (
            <div key={kind} className={cn("rounded-xl border bg-background p-3", disabled && "opacity-65")}> 
              <div className="flex items-start gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div className="text-sm font-medium">{title}</div><Badge variant="secondary">{matches.length}</Badge></div><div className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</div></div></div>
              <Button variant="outline" size="sm" className="mt-3 w-full" disabled={disabled} onClick={() => onPrepare({ kind, keys: matches.map((issue) => issue.key) })}>{isFa ? "آماده برای بررسی" : "Prepare review"}</Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
