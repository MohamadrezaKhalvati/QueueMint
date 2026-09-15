import type { LucideIcon } from "lucide-react"
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Equal, Flag } from "lucide-react"

import { cn } from "@/lib/utils"

interface PriorityTone {
  icon: LucideIcon
  className: string
  dotClassName: string
}

const tones: Record<string, PriorityTone> = {
  highest: { icon: ChevronsUp, className: "text-red-600 dark:text-red-400", dotClassName: "bg-red-500" },
  high: { icon: ChevronUp, className: "text-orange-600 dark:text-orange-400", dotClassName: "bg-orange-500" },
  medium: { icon: Equal, className: "text-amber-600 dark:text-amber-400", dotClassName: "bg-amber-500" },
  low: { icon: ChevronDown, className: "text-blue-600 dark:text-blue-400", dotClassName: "bg-blue-500" },
  lowest: { icon: ChevronsDown, className: "text-slate-500 dark:text-slate-400", dotClassName: "bg-slate-400" },
}

export function priorityTone(name?: string): PriorityTone {
  return tones[String(name ?? "").trim().toLowerCase()] ?? {
    icon: Flag,
    className: "text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  }
}

export function PriorityVisual({ name, compact = false, inherited = false, inheritedLabel = "default", className }: { name?: string; compact?: boolean; inherited?: boolean; inheritedLabel?: string; className?: string }) {
  const tone = priorityTone(name)
  const Icon = tone.icon

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className={cn("grid shrink-0 place-items-center rounded-[var(--qm-control-radius)] bg-current/10", compact ? "size-6" : "size-7", tone.className)}>
        <Icon className={compact ? "size-3.5" : "size-4"} />
      </span>
      <span className="min-w-0 truncate">
        <span className="font-medium">{name || "—"}</span>
        {inherited ? <span className="ms-1 text-[11px] font-normal text-muted-foreground">{inheritedLabel}</span> : null}
      </span>
    </span>
  )
}
