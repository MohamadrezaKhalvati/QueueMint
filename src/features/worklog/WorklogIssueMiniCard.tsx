import { JiraUserAvatar } from "@/components/jira-user-avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraLiveIssue } from "@/types"
import { formatWorklogMinutes } from "./worklog-utils"
import { issueTypeIcon, statusTone } from "./worklog-view-utils"
import { WorklogEstimateStatus } from "./WorklogEstimateStatus"
import { WorklogSelectionCheckbox } from "./WorklogSelectionCheckbox"

export function WorklogIssueMiniCard({ locale, issue, selected, loggedMinutes, onToggle, compact = false }: {
  locale: AppLocale
  issue: JiraLiveIssue
  selected: boolean
  loggedMinutes: number
  onToggle: () => void
  compact?: boolean
}) {
  const isFa = locale === "fa"
  const TypeIcon = issueTypeIcon(issue.type)
  return (
    <article className={cn("qm-worklog-issue-card", selected && "is-selected")}>
      <div className="flex items-start gap-2">
        <WorklogSelectionCheckbox checked={selected} onChange={onToggle} label={`${selected ? "Deselect" : "Select"} ${issue.key}`} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5 text-[10px]">
            <span className="inline-flex shrink-0 items-center gap-1 font-mono font-medium text-primary"><TypeIcon className="size-3" />{issue.key}</span>
            {!compact && issue.status ? <Badge variant="outline" className={cn("max-w-24 truncate px-1.5 py-0 text-[9px] font-normal", statusTone(issue))}>{issue.status}</Badge> : null}
          </div>
          <div className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-foreground">{issue.summary}</div>
          {issue.labels.length ? <div className="mt-2 flex flex-wrap gap-1">{issue.labels.slice(0, 2).map((label) => <span key={label} className="rounded-[var(--qm-control-radius)] bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{label}</span>)}</div> : null}
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="inline-flex min-w-0 flex-1 items-center gap-1.5">{issue.assignee ? <JiraUserAvatar name={issue.assignee} avatarUrl={issue.avatarUrl} className="size-4" /> : <span className="size-4 rounded-full bg-muted" />}<span className="truncate">{issue.assignee ?? (isFa ? "بدون مسئول" : "Unassigned")}</span></span>
        <WorklogEstimateStatus issue={issue} locale={locale} compact />
        {loggedMinutes > 0 ? <span className="shrink-0 rounded-[var(--qm-control-radius)] bg-success/10 px-1.5 py-0.5 font-medium text-success">{formatWorklogMinutes(loggedMinutes)}</span> : null}
      </div>
    </article>
  )
}
