import { useEffect, useState } from "react"
import { Bookmark, Bug, CheckSquare2, CircleDotDashed, Layers3 } from "lucide-react"

import { getJiraAvatarDataUrl } from "@/lib/jira"
import { cn } from "@/lib/utils"

function fallbackIcon(name?: string) {
  const normalized = String(name ?? "").trim().toLowerCase()
  if (normalized.includes("bug") || normalized.includes("defect")) return Bug
  if (normalized.includes("story")) return Bookmark
  if (normalized.includes("epic")) return Layers3
  if (normalized.includes("task") || normalized.includes("todo")) return CheckSquare2
  return CircleDotDashed
}

export function JiraIssueTypeIcon({ name, iconUrl, className }: { name?: string; iconUrl?: string; className?: string }) {
  const [resolved, setResolved] = useState<string | null>(null)
  const Icon = fallbackIcon(name)

  useEffect(() => {
    let active = true
    setResolved(null)
    if (!iconUrl) return () => { active = false }
    void getJiraAvatarDataUrl(iconUrl).then((next) => { if (active) setResolved(next) })
    return () => { active = false }
  }, [iconUrl])

  if (resolved) return <img src={resolved} alt="" className={cn("size-5 shrink-0 object-contain", className)} onError={() => setResolved(null)} />
  return <Icon className={cn("size-4 shrink-0 text-primary", className)} />
}

export function JiraIssueTypeVisual({ name, iconUrl, compact = false }: { name: string; iconUrl?: string; compact?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className={cn("grid shrink-0 place-items-center rounded-[var(--qm-control-radius)] bg-primary/8", compact ? "size-6" : "size-7")}>
        <JiraIssueTypeIcon name={name} iconUrl={iconUrl} className={compact ? "size-3.5" : "size-4"} />
      </span>
      <span className="min-w-0 truncate font-medium">{name}</span>
    </span>
  )
}
