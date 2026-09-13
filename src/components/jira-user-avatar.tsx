import { useEffect, useState } from "react"

import { getJiraAvatarDataUrl } from "@/lib/jira"
import { cn } from "@/lib/utils"

export function JiraUserAvatar({ name, avatarUrl, className }: { name?: string; avatarUrl?: string; className?: string }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setResolvedUrl(null)
    if (!avatarUrl) return () => { active = false }
    void getJiraAvatarDataUrl(avatarUrl).then((next) => { if (active) setResolvedUrl(next) })
    return () => { active = false }
  }, [avatarUrl])

  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?"

  if (resolvedUrl) {
    return <img src={resolvedUrl} alt="" title={name} className={cn("shrink-0 rounded-full object-cover ring-1 ring-border", className)} onError={() => setResolvedUrl(null)} />
  }

  return <span title={name} className={cn("grid shrink-0 place-items-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-1 ring-border", className)}>{initials}</span>
}
