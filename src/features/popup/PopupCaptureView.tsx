import type { RefObject } from "react"
import { Bug, Camera, Image as ImageIcon, ImageOff, LoaderCircle, Maximize2, MonitorUp, RotateCcw } from "lucide-react"

import { CaptureEditor, type CaptureEditorHandle } from "@/components/capture-editor"
import { Button } from "@/components/ui/button"
import { CaptureEvidenceStrip } from "@/features/capture-pro/CaptureEvidenceStrip"
import { CaptureRecorder } from "@/features/capture-pro/CaptureRecorder"
import type { CaptureEvidenceShot } from "@/features/capture-pro/types"
import type { CaptureEditorState } from "@/features/capture/editor-model"
import type { QueueMintPageContext } from "@/lib/capture"
import type { AppLocale, JiraConnectionStatus } from "@/types"
import type { PopupCopy } from "./popup-copy"

export function PopupCaptureView({ t, locale, status, standalone, loadingMetadata, dataUrl, context, editorRef, shots, activeShotId, editorState, capturing, onRetake, onAddCapture, onSelectShot, onRemoveShot, onEditorState, onCopy, onFullscreen, onDownload, onReport, onRecorded }: {
  t: PopupCopy
  locale: AppLocale
  status: JiraConnectionStatus
  standalone: boolean
  loadingMetadata: boolean
  dataUrl: string | null
  context: QueueMintPageContext | null
  editorRef: RefObject<CaptureEditorHandle | null>
  shots: CaptureEvidenceShot[]
  activeShotId: string | null
  editorState: CaptureEditorState | null
  capturing: boolean
  onRetake: () => void
  onAddCapture: (mode: "visible" | "full") => void
  onSelectShot: (id: string) => void
  onRemoveShot: (id: string) => void
  onEditorState: (state: CaptureEditorState) => void
  onCopy: () => void
  onFullscreen: () => void
  onDownload: () => void
  onReport: () => void
  onRecorded: (file: File) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div><div className="text-base font-semibold">{t.capture}</div><div className="mt-0.5 max-w-[360px] truncate text-xs text-muted-foreground">{context?.title}</div></div>
        <div className="flex gap-1">
          {!standalone ? <Button variant="outline" size="icon-sm" disabled={capturing || !dataUrl} onClick={onRetake} title={t.captureAgain}><RotateCcw className="size-4" /></Button> : null}
          {!standalone ? <Button variant="outline" size="icon-sm" onClick={onFullscreen} title={t.fullScreenEditor}><Maximize2 className="size-4" /></Button> : null}
          <Button variant="outline" size="icon-sm" disabled={!dataUrl} onClick={onDownload} title={t.savePng}><ImageIcon className="size-4" /></Button>
        </div>
      </div>
      <CaptureEvidenceStrip evidenceLabel={t.evidence} shots={shots} activeId={activeShotId} capturing={capturing} addVisibleLabel={t.captureVisible} addFullLabel={t.captureFull} copyLabel={t.screenshotCopied} removeLabel={t.removeEvidence} onSelect={onSelectShot} onRemove={onRemoveShot} onAdd={onAddCapture} onCopy={onCopy} />
      {dataUrl ? (
        <CaptureEditor ref={editorRef} imageUrl={dataUrl} locale={locale} stateKey={activeShotId ?? undefined} initialState={editorState} onStateChange={onEditorState} />
      ) : (
        <div className="grid min-h-64 place-items-center rounded-[var(--qm-panel-radius)] border border-dashed bg-muted/10 px-6 py-10 text-center">
          <div className="max-w-sm">
            <span className="mx-auto grid size-12 place-items-center rounded-[var(--qm-panel-radius)] bg-muted text-muted-foreground"><ImageOff className="size-5" /></span>
            <div className="mt-3 text-sm font-semibold">{t.emptyEvidence}</div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">{t.emptyEvidenceHint}</div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" disabled={capturing} onClick={() => onAddCapture("visible")}><Camera className="size-4" />{t.captureVisible}</Button>
              <Button type="button" variant="outline" size="sm" disabled={capturing} onClick={() => onAddCapture("full")}><MonitorUp className="size-4" />{t.captureFull}</Button>
            </div>
          </div>
        </div>
      )}
      <CaptureRecorder standalone={standalone} labels={{ record: t.recordScreen, stop: t.stopRecording, microphone: t.microphone, noMicrophone: t.noMicrophone, fullscreenHint: t.recordFullscreenHint, ready: t.recordingReady }} onRecorded={onRecorded} onOpenFullscreen={onFullscreen} />
      <div className="grid grid-cols-[1fr_auto] gap-2"><Button onClick={onReport} disabled={!dataUrl || !status.configured || loadingMetadata}>{loadingMetadata ? <LoaderCircle className="size-4 animate-spin" /> : <Bug className="size-4" />}{t.reportBug}</Button><Button variant="outline" disabled={!dataUrl} onClick={onDownload}>{t.savePng}</Button></div>
      {!status.configured ? <div className="text-xs text-warning">{t.noJiraHint}</div> : null}
    </div>
  )
}
