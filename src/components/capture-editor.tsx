import * as React from "react"

import { CaptureEditorToolbar } from "@/features/capture/CaptureEditorToolbar"
import {
  clampRect,
  drawAnnotation,
  normalizeRect,
  TOOL_LABELS,
  type Annotation,
  type CaptureEditorState,
  type CaptureTool,
  type Point,
  type Rect,
} from "@/features/capture/editor-model"
import { cn } from "@/lib/utils"

export interface CaptureEditorHandle {
  exportPng: () => string | null
  reset: () => void
}

interface CaptureEditorProps {
  imageUrl: string
  locale?: "en" | "fa"
  className?: string
  stateKey?: string
  initialState?: CaptureEditorState | null
  onStateChange?: (state: CaptureEditorState) => void
}

export const CaptureEditor = React.forwardRef<CaptureEditorHandle, CaptureEditorProps>(function CaptureEditor(
  { imageUrl, locale = "en", className, stateKey, initialState, onStateChange },
  ref,
) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const imageRef = React.useRef<HTMLImageElement | null>(null)
  const dragStartRef = React.useRef<Point | null>(null)
  const draftRef = React.useRef<Annotation | null>(null)
  const [tool, setTool] = React.useState<CaptureTool>("rect")
  const [annotations, setAnnotations] = React.useState<Annotation[]>([])
  const [redoStack, setRedoStack] = React.useState<Annotation[]>([])
  const [cropRect, setCropRect] = React.useState<Rect | null>(null)
  const [loaded, setLoaded] = React.useState(false)
  const [, forceRender] = React.useReducer((value: number) => value + 1, 0)
  const t = TOOL_LABELS[locale]

  const renderCanvas = React.useCallback((includeCropOverlay = true) => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !image.naturalWidth || !image.naturalHeight) return
    if (canvas.width !== image.naturalWidth || canvas.height !== image.naturalHeight) {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
    }
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)
    const scale = Math.max(1, canvas.width / 1280)
    for (const annotation of annotations) drawAnnotation(ctx, annotation, image, scale)
    if (draftRef.current) drawAnnotation(ctx, draftRef.current, image, scale)
    if (includeCropOverlay && cropRect) drawCropOverlay(ctx, clampRect(cropRect, canvas.width, canvas.height), canvas, scale)
  }, [annotations, cropRect])

  React.useEffect(() => {
    setLoaded(false)
    setAnnotations(initialState?.annotations ?? [])
    setRedoStack([])
    setCropRect(initialState?.cropRect ?? null)
    draftRef.current = null
    const image = new Image()
    image.onload = () => { imageRef.current = image; setLoaded(true) }
    image.src = imageUrl
    return () => { image.onload = null; if (imageRef.current === image) imageRef.current = null }
  // stateKey intentionally controls rehydration. State updates for the same shot must not reset the editor.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, stateKey])

  React.useEffect(() => { if (loaded) renderCanvas() }, [loaded, renderCanvas])

  function emitState(nextAnnotations: Annotation[], nextCrop: Rect | null) {
    onStateChange?.({ annotations: nextAnnotations, cropRect: nextCrop })
  }

  React.useImperativeHandle(ref, () => ({
    exportPng() {
      const image = imageRef.current
      if (!image || !loaded) return null
      const exportCanvas = document.createElement("canvas")
      exportCanvas.width = image.naturalWidth; exportCanvas.height = image.naturalHeight
      const exportCtx = exportCanvas.getContext("2d")
      if (!exportCtx) return null
      exportCtx.drawImage(image, 0, 0)
      const scale = Math.max(1, exportCanvas.width / 1280)
      for (const annotation of annotations) drawAnnotation(exportCtx, annotation, image, scale)
      if (!cropRect) return exportCanvas.toDataURL("image/png")
      return cropCanvas(exportCanvas, clampRect(cropRect, exportCanvas.width, exportCanvas.height))
    },
    reset() {
      setAnnotations([]); setRedoStack([]); setCropRect(null); draftRef.current = null
      emitState([], null)
    },
  }), [annotations, cropRect, loaded, onStateChange])

  function eventPoint(event: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height }
  }

  function begin(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!loaded || tool === "pointer") return
    const point = eventPoint(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = point
    if (tool === "text") {
      const text = window.prompt(t.textPrompt)?.trim()
      if (text) {
        const next = [...annotations, { id: crypto.randomUUID(), kind: "text", point, text } as Annotation]
        setAnnotations(next); setRedoStack([]); emitState(next, cropRect)
      }
      dragStartRef.current = null
      return
    }
    if (tool === "pen") draftRef.current = { id: crypto.randomUUID(), kind: "pen", points: [point] }
    else if (tool === "arrow") draftRef.current = { id: crypto.randomUUID(), kind: "arrow", start: point, end: point }
    else if (tool === "crop") { draftRef.current = null; setCropRect({ x: point.x, y: point.y, width: 1, height: 1 }) }
    else draftRef.current = { id: crypto.randomUUID(), kind: tool, rect: { x: point.x, y: point.y, width: 1, height: 1 } }
    forceRender()
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = dragStartRef.current
    if (!start || tool === "pointer" || tool === "text") return
    const point = eventPoint(event)
    if (tool === "crop") { setCropRect(normalizeRect(start, point)); return }
    const draft = draftRef.current
    if (!draft) return
    if (draft.kind === "pen") draft.points = [...draft.points, point]
    else if (draft.kind === "arrow") draft.end = point
    else if (draft.kind === "rect" || draft.kind === "highlight" || draft.kind === "blur") draft.rect = normalizeRect(start, point)
    forceRender(); renderCanvas()
  }

  function finish(event: React.PointerEvent<HTMLCanvasElement>) {
    const start = dragStartRef.current
    if (!start) return
    dragStartRef.current = null
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* no-op */ }
    if (tool === "crop") {
      const nextCrop = normalizeRect(start, eventPoint(event))
      setCropRect(nextCrop); emitState(annotations, nextCrop)
      return
    }
    const draft = draftRef.current
    draftRef.current = null
    if (!draft || !isMeaningfulAnnotation(draft)) return renderCanvas()
    const next = [...annotations, draft]
    setAnnotations(next); setRedoStack([]); emitState(next, cropRect)
  }

  function undo() {
    if (!annotations.length) {
      if (cropRect) { setCropRect(null); emitState(annotations, null) }
      return
    }
    const last = annotations[annotations.length - 1]
    const next = annotations.slice(0, -1)
    setAnnotations(next); setRedoStack((stack) => [...stack, last]); emitState(next, cropRect)
  }

  function redo() {
    if (!redoStack.length) return
    const last = redoStack[redoStack.length - 1]
    const next = [...annotations, last]
    setAnnotations(next); setRedoStack(redoStack.slice(0, -1)); emitState(next, cropRect)
  }

  function clear() { setAnnotations([]); setRedoStack([]); setCropRect(null); emitState([], null) }

  return (
    <div className={cn("space-y-2", className)}>
      <CaptureEditorToolbar tool={tool} labels={t} canUndo={Boolean(annotations.length || cropRect)} canRedo={Boolean(redoStack.length)} onTool={setTool} onUndo={undo} onRedo={redo} onClear={clear} />
      <div className="capture-canvas-shell">
        {!loaded ? <div className="grid h-56 place-items-center text-sm text-muted-foreground">Loading capture...</div> : null}
        <canvas
          ref={canvasRef}
          className={cn("capture-canvas", !loaded && "hidden", tool === "pointer" ? "cursor-default" : tool === "text" ? "cursor-text" : "cursor-crosshair")}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
        />
      </div>
    </div>
  )
})

function isMeaningfulAnnotation(annotation: Annotation) {
  if (annotation.kind === "pen") return annotation.points.length > 2
  if (annotation.kind === "arrow") return Math.hypot(annotation.end.x - annotation.start.x, annotation.end.y - annotation.start.y) > 6
  if (annotation.kind === "text") return Boolean(annotation.text)
  return annotation.rect.width > 5 && annotation.rect.height > 5
}

function drawCropOverlay(ctx: CanvasRenderingContext2D, rect: Rect, canvas: HTMLCanvasElement, scale: number) {
  ctx.save(); ctx.fillStyle = "rgba(15, 23, 42, 0.45)"
  ctx.fillRect(0, 0, canvas.width, rect.y); ctx.fillRect(0, rect.y, rect.x, rect.height)
  ctx.fillRect(rect.x + rect.width, rect.y, canvas.width - rect.x - rect.width, rect.height)
  ctx.fillRect(0, rect.y + rect.height, canvas.width, canvas.height - rect.y - rect.height)
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = Math.max(2, scale * 2)
  ctx.setLineDash([Math.max(7, scale * 6), Math.max(5, scale * 4)])
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height); ctx.restore()
}

function cropCanvas(source: HTMLCanvasElement, rect: Rect) {
  const cropped = document.createElement("canvas")
  cropped.width = Math.max(1, Math.round(rect.width)); cropped.height = Math.max(1, Math.round(rect.height))
  const ctx = cropped.getContext("2d")
  if (!ctx) return source.toDataURL("image/png")
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, cropped.width, cropped.height)
  return cropped.toDataURL("image/png")
}
