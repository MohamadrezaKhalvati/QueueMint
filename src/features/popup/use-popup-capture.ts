import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import type { CaptureEditorHandle } from "@/components/capture-editor"
import { collectPageDiagnostics, installPageDiagnostics } from "@/features/capture-pro/diagnostics"
import type { CaptureEvidenceShot, QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import type { CaptureEditorState } from "@/features/capture/editor-model"
import { captureFullPage, captureVisiblePage, getActiveBrowserTab, screenshotFilename, type QueueMintPageContext } from "@/lib/capture"
import {
  deleteCaptureDraft, loadActiveCaptureDraft, loadCaptureDraft, saveCaptureDraft, updateCaptureDraft,
  type QueueMintCaptureDraft, type QueueMintCaptureIssueDraft, type QueueMintCaptureSource,
} from "@/lib/capture-draft"
import type { PopupCopy } from "./popup-copy"
import { saveDataUrl } from "./popup-shared"

function shotFrom(dataUrl: string, context: QueueMintPageContext, kind: "visible" | "full"): CaptureEvidenceShot {
  return { id: crypto.randomUUID(), dataUrl, context, createdAt: new Date().toISOString(), kind }
}

function sourceFromContext(context: QueueMintPageContext): QueueMintCaptureSource {
  return { tabId: context.tabId, url: context.url, title: context.title }
}

function capturableUrl(value?: string) { return /^(https?:|file:)/i.test(value ?? "") }

export function usePopupCapture({ captureDraftId, t, onCaptureReady }: { captureDraftId: string | null; t: PopupCopy; onCaptureReady: () => void }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionView, setSessionView] = useState<"capture" | "issue">("capture")
  const [restoredIssueDraft, setRestoredIssueDraft] = useState<QueueMintCaptureIssueDraft | null>(null)
  const [editorTabId, setEditorTabId] = useState<number | null>(null)
  const [source, setSource] = useState<QueueMintCaptureSource | null>(null)
  const [activeTitle, setActiveTitle] = useState("")
  const [activeUrl, setActiveUrl] = useState("")
  const [captureDataUrl, setCaptureDataUrl] = useState<string | null>(null)
  const [finalScreenshot, setFinalScreenshot] = useState<string | null>(null)
  const [captureContext, setCaptureContext] = useState<QueueMintPageContext | null>(null)
  const [shots, setShots] = useState<CaptureEvidenceShot[]>([])
  const [activeShotId, setActiveShotId] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<QueueMintPageDiagnostics | null>(null)
  const [capturing, setCapturing] = useState(false)
  const editorRef = useRef<CaptureEditorHandle | null>(null)

  useEffect(() => { void initialize() }, [captureDraftId])

  async function initialize() {
    try {
      const draft = captureDraftId ? await loadCaptureDraft(captureDraftId) : await loadActiveCaptureDraft()
      if (draft && (draft.shots.length || draft.source || draft.issueDraft)) {
        restoreDraft(draft)
        if (captureDraftId) await registerEditorTab(draft.id)
        else toast.success(t.captureRestored)
        const diagnosticsTabId = draft.source?.tabId ?? draft.context?.tabId
        if (diagnosticsTabId) await installPageDiagnostics(diagnosticsTabId)
        onCaptureReady()
        return
      }
    } catch (error) { toast.error(error instanceof Error ? error.message : t.captureFailed) }
    const tab = await getActiveBrowserTab()
    setActiveTitle(tab?.title ?? ""); setActiveUrl(tab?.url ?? "")
    if (tab?.id) await installPageDiagnostics(tab.id)
    if (tab?.id && tab.url && /^https?:\/\//i.test(tab.url)) {
      try { await chrome.runtime.sendMessage({ type: "QUEUEMINT_SET_ACTIVE_CANDIDATE", candidate: { tabId: tab.id, url: tab.url, title: tab.title ?? "" } }) } catch { /* Jira connection remains usable */ }
    }
  }

  function restoreDraft(draft: QueueMintCaptureDraft) {
    const activeId = draft.shots.some((shot) => shot.id === draft.activeShotId) ? draft.activeShotId : draft.shots[0]?.id ?? null
    const active = draft.shots.find((shot) => shot.id === activeId) ?? draft.shots[0] ?? null
    setSessionId(draft.id); setSessionView(draft.view); setRestoredIssueDraft(draft.issueDraft); setEditorTabId(draft.editorTabId); setSource(draft.source)
    setShots(draft.shots); setActiveShotId(active?.id ?? null); setCaptureDataUrl(active?.dataUrl ?? null); setCaptureContext(active?.context ?? draft.context)
    setFinalScreenshot(draft.finalScreenshot); setDiagnostics(draft.diagnostics)
    setActiveTitle(active?.context.title ?? draft.source?.title ?? ""); setActiveUrl(active?.context.url ?? draft.source?.url ?? "")
  }

  async function registerEditorTab(id: string) {
    const tab = await getActiveBrowserTab()
    if (!tab?.id) return
    setEditorTabId(tab.id)
    await updateCaptureDraft(id, { editorTabId: tab.id })
  }

  function sourceTabId() { return source?.tabId ?? shots[0]?.context.tabId ?? captureContext?.tabId ?? null }

  async function resolveCaptureTabId() {
    if (!sessionId) return null
    const linkedId = sourceTabId()
    if (linkedId) {
      try {
        const linked = await chrome.tabs.get(linkedId)
        if (linked.id && capturableUrl(linked.url)) return linked.id
      } catch { /* stale tab id is reconnected below */ }
    }
    const active = await getActiveBrowserTab()
    if (!active?.id || !capturableUrl(active.url)) throw new Error(t.reconnectSource)
    const nextSource = { tabId: active.id, url: active.url ?? "", title: active.title ?? "" }
    setSource(nextSource)
    await updateCaptureDraft(sessionId, { source: nextSource })
    return active.id
  }

  function commitActiveEdit(current = shots) {
    if (!activeShotId) return current
    const edited = editorRef.current?.exportPng()
    if (!edited) return current
    return current.map((shot) => shot.id === activeShotId ? { ...shot, dataUrl: edited, editorState: undefined } : shot)
  }

  async function persistShots(nextShots: CaptureEvidenceShot[], nextActiveId = activeShotId) {
    if (!sessionId) return
    const active = nextShots.find((shot) => shot.id === nextActiveId) ?? nextShots[0] ?? null
    await updateCaptureDraft(sessionId, { shots: nextShots, activeShotId: active?.id ?? null, dataUrl: active?.dataUrl ?? "", context: active?.context ?? captureContext })
  }

  function updateEditorState(state: CaptureEditorState) {
    if (!activeShotId) return
    setShots((current) => {
      const next = current.map((shot) => shot.id === activeShotId ? { ...shot, editorState: state } : shot)
      void persistShots(next, activeShotId)
      return next
    })
  }

  async function captureEvidence(mode: "visible" | "full", replaceActive = false) {
    const committed = commitActiveEdit()
    setShots(committed); setCapturing(true)
    try {
      const tabId = await resolveCaptureTabId()
      const result = mode === "full" ? await captureFullPage(tabId) : await captureVisiblePage(tabId)
      const captured = shotFrom(result.dataUrl, result.context, mode)
      const existing = replaceActive && activeShotId ? committed.find((shot) => shot.id === activeShotId) : null
      const shot = existing ? { ...captured, id: existing.id } : captured
      const next = existing ? committed.map((item) => item.id === existing.id ? shot : item) : [...committed, shot]
      const nextSource = sourceFromContext(result.context)
      setSource(nextSource); setShots(next); setActiveShotId(shot.id); setCaptureDataUrl(shot.dataUrl); setCaptureContext(shot.context); setFinalScreenshot(null)
      setActiveTitle(shot.context.title); setActiveUrl(shot.context.url)
      if (sessionId) await updateCaptureDraft(sessionId, { shots: next, activeShotId: shot.id, dataUrl: shot.dataUrl, context: shot.context, source: nextSource, view: "capture", finalScreenshot: null })
      else { const id = await saveCaptureDraft(shot.dataUrl, shot.context, next, shot.id); setSessionId(id) }
      setSessionView("capture"); await installPageDiagnostics(result.context.tabId); onCaptureReady(); toast.success(t.screenshotReady)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.captureFailed
      toast.error(/activeTab|permission|cannot access|not allowed/i.test(message) ? t.reconnectSource : message)
    } finally { setCapturing(false) }
  }

  async function takeCapture(mode: "visible" | "full" = "visible") { await captureEvidence(mode) }
  async function retakeCapture(mode: "visible" | "full" = "visible") { await captureEvidence(mode, true) }

  function selectShot(id: string) {
    const committed = commitActiveEdit()
    const shot = committed.find((item) => item.id === id)
    if (!shot) return
    setShots(committed); setActiveShotId(id); setCaptureDataUrl(shot.dataUrl); setCaptureContext(shot.context); setFinalScreenshot(null)
    void persistShots(committed, id)
  }

  function removeShot(id: string) {
    const committed = commitActiveEdit()
    const next = committed.filter((shot) => shot.id !== id)
    const fallback = id === activeShotId ? next[0] ?? null : next.find((shot) => shot.id === activeShotId) ?? next[0] ?? null
    setShots(next); setActiveShotId(fallback?.id ?? null); setCaptureDataUrl(fallback?.dataUrl ?? null); setCaptureContext(fallback?.context ?? captureContext); setFinalScreenshot(null)
    if (sessionId) void updateCaptureDraft(sessionId, { shots: next, activeShotId: fallback?.id ?? null, dataUrl: fallback?.dataUrl ?? "", context: fallback?.context ?? captureContext, finalScreenshot: null })
  }

  async function refreshDiagnostics() {
    const tabId = sourceTabId()
    if (!tabId) return null
    const value = await collectPageDiagnostics(tabId)
    setDiagnostics(value)
    if (sessionId) await updateCaptureDraft(sessionId, { diagnostics: value })
    return value
  }

  async function ensureSession() {
    const committed = commitActiveEdit()
    setShots(committed)
    if (sessionId) { await persistShots(committed); return sessionId }
    if (!committed.length || !captureContext) return null
    const id = await saveCaptureDraft(committed[0].dataUrl, committed[0].context, committed, activeShotId)
    setSessionId(id); setSource(sourceFromContext(committed[0].context)); return id
  }

  async function openFullscreen() {
    if (!chrome.runtime?.getURL || !chrome.tabs?.create) return
    try {
      const id = await ensureSession()
      if (!id) return
      if (editorTabId && await focusExistingEditor(editorTabId)) return
      const tab = await chrome.tabs.create({ url: chrome.runtime.getURL(`popup.html?captureDraft=${encodeURIComponent(id)}`) })
      if (tab.id) { setEditorTabId(tab.id); await updateCaptureDraft(id, { editorTabId: tab.id }) }
    } catch (error) { toast.error(error instanceof Error ? error.message : t.captureFailed) }
  }

  async function focusExistingEditor(tabId: number) {
    try {
      const tab = await chrome.tabs.get(tabId)
      await chrome.tabs.update(tabId, { active: true })
      if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true })
      return true
    } catch { setEditorTabId(null); return false }
  }

  async function openCapturePro() {
    if (!chrome.runtime?.getURL || !chrome.tabs?.create) return
    setCapturing(true)
    try {
      const result = await captureVisiblePage()
      const shot = shotFrom(result.dataUrl, result.context, "visible")
      const id = await saveCaptureDraft(result.dataUrl, result.context, [shot], shot.id)
      setSessionId(id); setSource(sourceFromContext(result.context)); setShots([shot]); setActiveShotId(shot.id); setCaptureDataUrl(shot.dataUrl); setCaptureContext(shot.context)
      await installPageDiagnostics(result.context.tabId)
      const tab = await chrome.tabs.create({ url: chrome.runtime.getURL(`popup.html?captureDraft=${encodeURIComponent(id)}`) })
      if (tab.id) { setEditorTabId(tab.id); await updateCaptureDraft(id, { editorTabId: tab.id }) }
    } catch (error) { toast.error(error instanceof Error ? error.message : t.captureFailed) } finally { setCapturing(false) }
  }

  async function prepareReport() {
    const screenshot = editorRef.current?.exportPng() ?? captureDataUrl
    if (!screenshot) return null
    const committed = commitActiveEdit()
    setShots(committed); setCaptureDataUrl(screenshot); setFinalScreenshot(screenshot)
    if (sessionId) await updateCaptureDraft(sessionId, { shots: committed, finalScreenshot: screenshot, view: "issue" })
    setSessionView("issue")
    return screenshot
  }

  async function persistIssueDraft(view: "capture" | "issue", issueDraft: QueueMintCaptureIssueDraft) {
    if (!sessionId) return
    setSessionView(view); setRestoredIssueDraft(issueDraft)
    await updateCaptureDraft(sessionId, { view, issueDraft, finalScreenshot })
  }

  async function resetSession() {
    if (sessionId) await deleteCaptureDraft(sessionId)
    clear(); setSessionId(null); setSessionView("capture"); setRestoredIssueDraft(null); setEditorTabId(null)
  }

  async function copyScreenshot() {
    const screenshot = currentScreenshot()
    if (!screenshot || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") return toast.error("Clipboard image copy is not available.")
    try { const blob = await (await fetch(screenshot)).blob(); await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]); toast.success(t.screenshotCopied) }
    catch (error) { toast.error(error instanceof Error ? error.message : t.captureFailed) }
  }

  function download() { const screenshot = currentScreenshot(); if (screenshot) saveDataUrl(screenshot, screenshotFilename(captureContext ?? undefined)) }
  function currentScreenshot() { return editorRef.current?.exportPng() ?? captureDataUrl }
  function allScreenshots() { const edited = currentScreenshot(); return shots.map((shot) => shot.id === activeShotId && edited ? { ...shot, dataUrl: edited, editorState: undefined } : shot) }
  function activeEditorState() { return shots.find((shot) => shot.id === activeShotId)?.editorState ?? null }
  function clear() { setSource(null); setCaptureDataUrl(null); setFinalScreenshot(null); setCaptureContext(null); setShots([]); setActiveShotId(null); setDiagnostics(null) }

  return { sessionId, sessionView, restoredIssueDraft, activeTitle, activeUrl, captureDataUrl, setCaptureDataUrl, finalScreenshot, setFinalScreenshot, captureContext, setCaptureContext, capturing, editorRef, shots, activeShotId, diagnostics, takeCapture, retakeCapture, selectShot, removeShot, updateEditorState, activeEditorState, refreshDiagnostics, openFullscreen, openCapturePro, prepareReport, persistIssueDraft, resetSession, copyScreenshot, download, currentScreenshot, allScreenshots, clear }
}
