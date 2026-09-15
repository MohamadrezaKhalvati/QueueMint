import { Activity, Camera, FileStack, Image, MonitorUp } from "lucide-react"

import { AttachmentPicker, type LocalAttachment } from "@/components/attachment-picker"
import { Button } from "@/components/ui/button"
import { diagnosticsSummary } from "@/features/capture-pro/diagnostics"
import type { QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import type { QueueMintPageContext } from "@/lib/capture"
import type { PopupCopy } from "./popup-copy"

export function PopupEvidenceSection({ t, context, screenshotCount, attachments, diagnostics, includeContext, includeScreenshot, includeDiagnostics, capturing, onAttachments, onIncludeContext, onIncludeScreenshot, onIncludeDiagnostics, onAddCapture }: {
  t: PopupCopy
  context: QueueMintPageContext | null
  screenshotCount: number
  attachments: LocalAttachment[]
  diagnostics: QueueMintPageDiagnostics | null
  includeContext: boolean
  includeScreenshot: boolean
  includeDiagnostics: boolean
  capturing: boolean
  onAttachments: (files: LocalAttachment[]) => void
  onIncludeContext: (value: boolean) => void
  onIncludeScreenshot: (value: boolean) => void
  onIncludeDiagnostics: (value: boolean) => void
  onAddCapture: (mode: "visible" | "full") => void
}) {
  const stats = diagnosticsSummary(diagnostics)
  return (
    <div className="qm-field-span-2 rounded-[var(--qm-panel-radius)] border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><FileStack className="size-4 text-primary" /><div className="text-sm font-semibold">{t.evidence}</div></div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={capturing} onClick={() => onAddCapture("visible")} title={t.addEvidence}><Camera className="size-3.5" />{t.addEvidence}</Button>
          <Button type="button" variant="ghost" size="icon-sm" disabled={capturing} onClick={() => onAddCapture("full")} title={t.captureFull}><MonitorUp className="size-3.5" /></Button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {context ? <label className="flex items-center gap-2 rounded-[var(--qm-control-radius)] border bg-background/45 px-3 py-2 text-xs font-medium"><MonitorUp className="size-3.5 text-primary" /><input type="checkbox" checked={includeContext} onChange={(event) => onIncludeContext(event.target.checked)} className="accent-[var(--primary)]" />{t.includeContext}</label> : null}
        {screenshotCount ? <label className="flex items-center gap-2 rounded-[var(--qm-control-radius)] border bg-background/45 px-3 py-2 text-xs font-medium"><Image className="size-3.5 text-primary" /><input type="checkbox" checked={includeScreenshot} onChange={(event) => onIncludeScreenshot(event.target.checked)} className="accent-[var(--primary)]" />{t.includeScreenshot} · {screenshotCount}</label> : null}
        {diagnostics ? <label className="flex items-center gap-2 rounded-[var(--qm-control-radius)] border bg-background/45 px-3 py-2 text-xs font-medium"><Activity className="size-3.5 text-primary" /><input type="checkbox" checked={includeDiagnostics} onChange={(event) => onIncludeDiagnostics(event.target.checked)} className="accent-[var(--primary)]" />{t.includeDiagnostics}</label> : null}
      </div>
      {context && includeContext ? <div className="mt-2 truncate text-[11px] text-muted-foreground">{context.hostname} · {context.viewportWidth}x{context.viewportHeight}</div> : null}
      {diagnostics ? <div className="mt-2 rounded-[var(--qm-control-radius)] bg-muted/35 px-3 py-2 text-[11px] text-muted-foreground"><div className="font-medium text-foreground">{t.diagnostics}</div><div className="mt-0.5">{stats.errors} errors · {stats.failedRequests} failed requests · {stats.requests} recent network entries</div><div className="mt-1 leading-4">{t.diagnosticsHint}</div></div> : null}
      <AttachmentPicker files={attachments} onChange={onAttachments} label={t.attachments} helper={t.attachmentsHint} addLabel={t.addAttachment} className="mt-3" />
    </div>
  )
}
