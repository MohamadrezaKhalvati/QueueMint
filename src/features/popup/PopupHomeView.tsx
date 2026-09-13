import { Camera, ChevronRight, ExternalLink, FilePlus2, LoaderCircle, MonitorUp, Settings2, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { JiraConnectionStatus } from "@/types"
import type { PopupCopy } from "./popup-copy"
import { displayHost, openFullWorkspace } from "./popup-shared"

export function PopupHomeView({ t, status, activeTitle, activeUrl, capturing, onCapture, onCapturePro, onQuickIssue }: {
  t: PopupCopy
  status: JiraConnectionStatus
  activeTitle: string
  activeUrl: string
  capturing: boolean
  onCapture: (mode: "visible" | "full") => void
  onCapturePro: () => void
  onQuickIssue: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="qm-popup-page-card"><div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-primary"><MonitorUp className="size-4" /></div><div className="min-w-0 flex-1"><div className="text-xs font-medium text-muted-foreground">{t.currentPage}</div><div className="truncate text-sm font-semibold">{activeTitle || displayHost(activeUrl) || "Browser tab"}</div><div className="truncate text-[11px] text-muted-foreground">{displayHost(activeUrl)}</div></div></div></div>
      <div className="qm-popup-action-card !block">
        <div className="flex items-center gap-3"><div className="qm-popup-action-icon"><Camera className="size-5" /></div><div className="min-w-0 flex-1 text-start"><div className="font-semibold">{t.capture}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{t.captureHint}</div></div>{capturing ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" /> : null}</div>
        <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" disabled={capturing} onClick={() => onCapture("visible")}><Camera className="size-3.5" />{t.captureVisible}</Button><Button variant="outline" size="sm" disabled={capturing} onClick={() => onCapture("full")}><MonitorUp className="size-3.5" />{t.captureFull}</Button></div>
        <Button variant="secondary" size="sm" className="mt-2 w-full" disabled={capturing} onClick={onCapturePro}><Video className="size-3.5" />{t.capturePro}</Button>
      </div>
      <button type="button" className="qm-popup-action-card" onClick={onQuickIssue}><div className="qm-popup-action-icon"><FilePlus2 className="size-5" /></div><div className="min-w-0 flex-1 text-start"><div className="font-semibold">{t.quickIssue}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{t.quickIssueHint}</div></div><ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" /></button>
      <button type="button" className="qm-popup-action-card" onClick={openFullWorkspace}><div className="qm-popup-action-icon"><Settings2 className="size-5" /></div><div className="min-w-0 flex-1 text-start"><div className="font-semibold">{t.workspace}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{t.workspaceHint}</div></div><ExternalLink className="size-4 text-muted-foreground" /></button>
      {!status.configured ? <div className="rounded-xl border border-warning/25 bg-warning/5 p-3"><div className="text-sm font-semibold">{t.noJira}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{t.noJiraHint}</p><Button variant="outline" size="sm" className="mt-2 w-full" onClick={openFullWorkspace}>{t.openWorkspace}</Button></div> : null}
    </div>
  )
}
