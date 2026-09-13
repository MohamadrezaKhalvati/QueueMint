import type { CaptureEditorState } from "@/features/capture/editor-model"
import type { QueueMintPageContext } from "@/lib/capture"

export interface CaptureEvidenceShot {
  id: string
  dataUrl: string
  context: QueueMintPageContext
  createdAt: string
  kind: "visible" | "full"
  editorState?: CaptureEditorState
}

export interface CaptureDiagnosticError {
  kind: "runtime" | "resource" | "promise"
  message: string
  source?: string
  line?: number
  column?: number
  capturedAt: string
}

export interface CaptureNetworkEntry {
  name: string
  initiatorType: string
  durationMs: number
  transferSize?: number
  responseStatus?: number
}

export interface CaptureNavigationInfo {
  type?: string
  domContentLoadedMs?: number
  loadMs?: number
  transferSize?: number
}

export interface QueueMintPageDiagnostics {
  collectedAt: string
  collectorStartedAt?: string
  errors: CaptureDiagnosticError[]
  network: CaptureNetworkEntry[]
  navigation?: CaptureNavigationInfo
}
