import { useEffect, useState } from "react"

import { getJiraAvatarDataUrl } from "@/lib/jira"
import type { JiraUser } from "@/types"

export function PopupLogo() {
  return <img src="/brand/queuemint-mark.png" alt="QueueMint" className="size-8 rounded-lg" />
}

export function openFullWorkspace() {
  if (typeof chrome !== "undefined" && chrome.tabs?.create && chrome.runtime?.getURL) {
    void chrome.tabs.create({ url: chrome.runtime.getURL("index.html") })
  }
}

export function saveDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a")
  anchor.href = dataUrl
  anchor.download = filename
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export function displayHost(url?: string) {
  if (!url) return ""
  try { return new URL(url).hostname } catch { return url }
}

export function PopupJiraAvatar({ user, className = "size-7" }: { user: JiraUser; className?: string }) {
  const avatarUrl = user.avatarUrls?.["48x48"] ?? user.avatarUrls?.["32x32"] ?? user.avatarUrls?.["24x24"]
  const [resolved, setResolved] = useState<string | null>(null)
  const label = user.displayName || user.name || user.key || "User"
  const initials = label.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U"

  useEffect(() => {
    let active = true
    setResolved(null)
    if (!avatarUrl) return () => { active = false }
    void getJiraAvatarDataUrl(avatarUrl).then((dataUrl) => { if (active) setResolved(dataUrl) })
    return () => { active = false }
  }, [avatarUrl])

  if (resolved) return <img src={resolved} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  return <span className={`grid ${className} shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary`}>{initials}</span>
}
