import { BookOpen, Bug, CheckSquare2, CircleDot, Shapes } from "lucide-react"

import { cn } from "@/lib/utils"
import type { JiraLiveIssue } from "@/types"
import { worklogStatusCategory } from "./worklog-issues"

export function issueTypeIcon(type?: string) {
  const value = String(type ?? "").toLowerCase()
  if (value.includes("bug")) return Bug
  if (value.includes("story")) return BookOpen
  if (value.includes("task")) return CheckSquare2
  return Shapes
}

export function statusTone(issue: JiraLiveIssue) {
  const category = worklogStatusCategory(issue)
  if (category === "done") return "border-success/25 bg-success/10 text-success"
  if (category === "indeterminate") return "border-primary/25 bg-primary/8 text-primary"
  if (category === "new") return "border-border bg-muted text-muted-foreground"
  return "border-primary/25 bg-primary/8 text-primary"
}

export function StatusDot({ issue, className }: { issue: JiraLiveIssue; className?: string }) {
  const category = worklogStatusCategory(issue)
  return <CircleDot className={cn("size-3.5", category === "done" ? "text-success" : category === "new" ? "text-muted-foreground" : "text-primary", className)} />
}

export function formatWorklogUpdated(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const now = new Date()
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  return sameDay ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : date.toLocaleDateString([], { month: "short", day: "numeric" })
}
