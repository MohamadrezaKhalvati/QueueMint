import { useState } from "react"
import { AlertTriangle, Columns3, LoaderCircle, Move } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppLocale, JiraBoardColumn, JiraLiveIssue } from "@/types"
import { WorklogIssueMiniCard } from "./WorklogIssueMiniCard"

function issuesForColumn(column: JiraBoardColumn, issues: JiraLiveIssue[]) {
  return issues.filter((issue) => column.statusIds.length ? Boolean(issue.statusId && column.statusIds.includes(issue.statusId)) : issue.status === column.name)
}

function laneTone(name: string) {
  const value = name.toLowerCase()
  if (/done|closed|resolved|complete|release/.test(value)) return "green"
  if (/review|qa|test|verify|approval/.test(value)) return "amber"
  if (/progress|doing|develop|implement|active/.test(value)) return "blue"
  if (/block|hold|reject/.test(value)) return "red"
  return "slate"
}

export function WorklogIssueBoard({ locale, issues, columns, columnsSource, columnsLoading, columnsError, selectedKeys, loggedMinutesByIssue, onToggle, onMoveIssueStatus }: {
  locale: AppLocale
  issues: JiraLiveIssue[]
  columns: JiraBoardColumn[]
  columnsSource: "jira" | "fallback"
  columnsLoading: boolean
  columnsError?: string | null
  selectedKeys: Set<string>
  loggedMinutesByIssue: Record<string, number>
  onToggle: (key: string) => void
  onMoveIssueStatus?: (issueKey: string, target: Pick<JiraBoardColumn, "name" | "statusIds">) => Promise<boolean>
}) {
  const isFa = locale === "fa"
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)
  const [movingKey, setMovingKey] = useState<string | null>(null)
  const matched = new Set(columns.flatMap((column) => issuesForColumn(column, issues).map((issue) => issue.key)))
  const unmatched = issues.filter((issue) => !matched.has(issue.key))
  const lanes = unmatched.length ? [...columns, { id: "other", name: isFa ? "سایر" : "Other", statusIds: [] }] : columns

  function canDrop(column: JiraBoardColumn, issue?: JiraLiveIssue) {
    if (!onMoveIssueStatus || column.id === "other" || !issue) return false
    if (issue.statusId && column.statusIds.includes(issue.statusId)) return false
    return column.statusIds.length > 0 || issue.status?.trim().toLowerCase() !== column.name.trim().toLowerCase()
  }

  async function dropInto(column: JiraBoardColumn) {
    const issue = issues.find((item) => item.key === dragKey)
    if (!issue || !canDrop(column, issue) || !onMoveIssueStatus) return
    setMovingKey(issue.key)
    setOverColumnId(null)
    setDragKey(null)
    try { await onMoveIssueStatus(issue.key, { name: column.name, statusIds: column.statusIds }) }
    finally { setMovingKey(null) }
  }

  if (!issues.length) return <div className="grid min-h-52 place-items-center px-4 text-sm text-muted-foreground">{isFa ? "تسکی با این فیلتر پیدا نشد." : "No issues match these filters."}</div>
  return (
    <div className="qm-worklog-board-wrap">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-[11px] text-muted-foreground">
        <Columns3 className="size-3.5" />
        {columnsLoading ? <><LoaderCircle className="size-3.5 animate-spin" />{isFa ? "خواندن ستون های Jira..." : "Reading Jira board columns..."}</> : <>
          <span>{columnsSource === "jira" ? (isFa ? "ستون ها از تنظیمات همین Jira board" : "Columns from Jira board configuration") : (isFa ? "گروه بندی براساس Status" : "Fallback grouped by Jira status")}</span>
          {columnsError ? <span className="inline-flex min-w-0 items-center gap-1 text-warning" title={columnsError}><AlertTriangle className="size-3 shrink-0" /><span className="truncate">{isFa ? "ستون های Jira خوانده نشد" : "Jira columns unavailable"}</span></span> : null}
          {onMoveIssueStatus ? <span className="hidden items-center gap-1 text-primary/80 xl:inline-flex"><Move className="size-3" />{isFa ? "کارت را بین ستون ها بکش تا Status در Jira آپدیت شود" : "Drag cards between columns to update Jira status"}</span> : null}
          <Badge variant="outline" className="ms-auto bg-background px-1.5 py-0 text-[10px]">{lanes.length} {isFa ? "ستون" : "columns"}</Badge>
        </>}
      </div>
      <div className="qm-worklog-board-scroll qm-worklog-scroll">
        <div className="qm-worklog-board-grid">
          {lanes.map((column) => {
            const laneIssues = column.id === "other" ? unmatched : issuesForColumn(column, issues)
            const tone = laneTone(column.name)
            const draggedIssue = issues.find((item) => item.key === dragKey)
            const droppable = canDrop(column, draggedIssue)
            return <section
              key={column.id}
              className={cn("qm-worklog-lane", overColumnId === column.id && droppable && "is-drop-target")}
              onDragOver={(event) => { if (!droppable) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; if (overColumnId !== column.id) setOverColumnId(column.id) }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOverColumnId((current) => current === column.id ? null : current) }}
              onDrop={(event) => { if (!droppable) return; event.preventDefault(); void dropInto(column) }}
            >
              <div className={cn("qm-worklog-lane-head", `is-${tone}`)}><span className="qm-worklog-lane-dot" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{column.name}</span><span className="rounded-[var(--qm-control-radius)] bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">{laneIssues.length}</span></div>
              <div className="qm-worklog-lane-body">{laneIssues.length ? laneIssues.map((issue) => <div
                key={issue.key}
                draggable={Boolean(onMoveIssueStatus) && movingKey !== issue.key}
                className={cn("qm-worklog-drag-card", dragKey === issue.key && "is-dragging", movingKey === issue.key && "is-moving")}
                onDragStart={(event) => { setDragKey(issue.key); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", issue.key) }}
                onDragEnd={() => { setDragKey(null); setOverColumnId(null) }}
              ><WorklogIssueMiniCard compact locale={locale} issue={issue} selected={selectedKeys.has(issue.key)} loggedMinutes={loggedMinutesByIssue[issue.key] ?? 0} onToggle={() => onToggle(issue.key)} /></div>) : <div className={cn("grid min-h-28 place-items-center rounded-[var(--qm-control-radius)] border border-dashed bg-background/55 px-4 text-center text-[11px] text-muted-foreground", overColumnId === column.id && droppable && "border-primary/45 bg-primary/[0.04] text-primary")}>{overColumnId === column.id && droppable ? (isFa ? "برای انتقال اینجا رها کن" : "Drop to move here") : (isFa ? "تسکی در این ستون نیست" : "No issues in this column")}</div>}</div>
            </section>
          })}
        </div>
      </div>
    </div>
  )
}
