import {
  ArrowUpRight, Crop, Eraser, Highlighter, MousePointer2, Pencil, Redo2, Square, Type, Undo2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CaptureTool } from "./editor-model"

const TOOL_ICONS = {
  pointer: MousePointer2,
  rect: Square,
  arrow: ArrowUpRight,
  highlight: Highlighter,
  pen: Pencil,
  blur: Eraser,
  crop: Crop,
  text: Type,
} as const

export function CaptureEditorToolbar({ tool, labels, canUndo, canRedo, onTool, onUndo, onRedo, onClear }: {
  tool: CaptureTool
  labels: Record<CaptureTool | "undo" | "redo" | "clear", string>
  canUndo: boolean
  canRedo: boolean
  onTool: (tool: CaptureTool) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}) {
  const tools = Object.entries(TOOL_ICONS) as Array<[CaptureTool, typeof MousePointer2]>
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-[var(--qm-panel-radius)] border bg-card p-1.5">
      {tools.map(([value, Icon]) => <button
        key={value}
        type="button"
        className={cn("grid size-8 shrink-0 place-items-center rounded-[var(--qm-control-radius)] text-muted-foreground transition hover:bg-accent hover:text-foreground", tool === value && "bg-accent text-primary")}
        title={labels[value]}
        aria-label={labels[value]}
        onClick={() => onTool(value)}
      ><Icon className="size-4" /></button>)}
      <div className="mx-0.5 h-5 w-px shrink-0 bg-border" />
      <Button variant="ghost" size="icon-sm" disabled={!canUndo} onClick={onUndo} title={labels.undo} aria-label={labels.undo}><Undo2 className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" disabled={!canRedo} onClick={onRedo} title={labels.redo} aria-label={labels.redo}><Redo2 className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" disabled={!canUndo} onClick={onClear} title={labels.clear} aria-label={labels.clear}><Eraser className="size-4" /></Button>
    </div>
  )
}
