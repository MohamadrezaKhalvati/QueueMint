export type Point = { x: number; y: number }
export type Rect = { x: number; y: number; width: number; height: number }
export type CaptureTool = "pointer" | "rect" | "arrow" | "highlight" | "pen" | "blur" | "crop" | "text"

export type Annotation =
  | { id: string; kind: "rect" | "highlight" | "blur"; rect: Rect }
  | { id: string; kind: "arrow"; start: Point; end: Point }
  | { id: string; kind: "pen"; points: Point[] }
  | { id: string; kind: "text"; point: Point; text: string }

export interface CaptureEditorState {
  annotations: Annotation[]
  cropRect: Rect | null
}

export const TOOL_LABELS = {
  en: {
    pointer: "Pointer", rect: "Rectangle", arrow: "Arrow", highlight: "Highlight", pen: "Pen", blur: "Blur",
    crop: "Crop", text: "Text", undo: "Undo", redo: "Redo", clear: "Clear", textPrompt: "Annotation text",
  },
  fa: {
    pointer: "انتخاب", rect: "کادر", arrow: "فلش", highlight: "هایلایت", pen: "قلم", blur: "محو",
    crop: "برش", text: "متن", undo: "برگشت", redo: "دوباره", clear: "پاک کردن", textPrompt: "متن یادداشت",
  },
} as const

export function normalizeRect(start: Point, end: Point): Rect {
  return {
    x: Math.min(start.x, end.x), y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y),
  }
}

export function clampRect(rect: Rect, width: number, height: number): Rect {
  const x = Math.max(0, Math.min(rect.x, width))
  const y = Math.max(0, Math.min(rect.y, height))
  return {
    x, y,
    width: Math.max(1, Math.min(rect.width, Math.max(1, width - x))),
    height: Math.max(1, Math.min(rect.height, Math.max(1, height - y))),
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, start: Point, end: Point, width: number) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const head = Math.max(14, width * 4)
  ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(end.x, end.y)
  ctx.lineTo(end.x - head * Math.cos(angle - Math.PI / 6), end.y - head * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(end.x - head * Math.cos(angle + Math.PI / 6), end.y - head * Math.sin(angle + Math.PI / 6))
  ctx.closePath(); ctx.fill()
}

export function drawAnnotation(ctx: CanvasRenderingContext2D, annotation: Annotation, image: HTMLImageElement, scale: number) {
  const lineWidth = Math.max(3, scale * 3)
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"
  if (annotation.kind === "rect") {
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = lineWidth
    ctx.strokeRect(annotation.rect.x, annotation.rect.y, annotation.rect.width, annotation.rect.height)
  } else if (annotation.kind === "highlight") {
    ctx.fillStyle = "rgba(250, 204, 21, 0.28)"; ctx.strokeStyle = "rgba(202, 138, 4, 0.78)"; ctx.lineWidth = Math.max(2, scale * 2)
    ctx.fillRect(annotation.rect.x, annotation.rect.y, annotation.rect.width, annotation.rect.height)
    ctx.strokeRect(annotation.rect.x, annotation.rect.y, annotation.rect.width, annotation.rect.height)
  } else if (annotation.kind === "blur") {
    const rect = annotation.rect
    ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.width, rect.height); ctx.clip()
    ctx.filter = `blur(${Math.max(8, scale * 8)}px)`; ctx.drawImage(image, 0, 0); ctx.restore()
    ctx.strokeStyle = "rgba(100, 116, 139, 0.8)"; ctx.setLineDash([Math.max(6, scale * 5), Math.max(5, scale * 4)])
    ctx.lineWidth = Math.max(2, scale * 2); ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  } else if (annotation.kind === "arrow") {
    ctx.strokeStyle = "#ef4444"; ctx.fillStyle = "#ef4444"; ctx.lineWidth = lineWidth
    drawArrow(ctx, annotation.start, annotation.end, lineWidth)
  } else if (annotation.kind === "pen" && annotation.points.length > 1) {
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = lineWidth; ctx.beginPath(); ctx.moveTo(annotation.points[0].x, annotation.points[0].y)
    for (const point of annotation.points.slice(1)) ctx.lineTo(point.x, point.y)
    ctx.stroke()
  } else if (annotation.kind === "text") {
    const fontSize = Math.max(18, scale * 18); const padding = Math.max(6, scale * 6)
    ctx.font = `600 ${fontSize}px "Segoe UI", Arial, sans-serif`; ctx.textBaseline = "top"
    const metrics = ctx.measureText(annotation.text); const height = fontSize * 1.35
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)"; ctx.fillRect(annotation.point.x - padding, annotation.point.y - padding, metrics.width + padding * 2, height + padding * 2)
    ctx.fillStyle = "#ffffff"; ctx.fillText(annotation.text, annotation.point.x, annotation.point.y)
  }
  ctx.restore()
}
