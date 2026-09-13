import { Camera, Copy, MonitorUp, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CaptureEvidenceShot } from "./types"

export function CaptureEvidenceStrip({ shots, activeId, capturing, evidenceLabel, addVisibleLabel, addFullLabel, copyLabel, removeLabel, onSelect, onRemove, onAdd, onCopy }: {
  shots: CaptureEvidenceShot[]
  activeId: string | null
  capturing: boolean
  evidenceLabel: string
  addVisibleLabel: string
  addFullLabel: string
  copyLabel: string
  removeLabel: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (mode: "visible" | "full") => void
  onCopy: () => void
}) {
  return (
    <div className="rounded-xl border bg-card p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold">{evidenceLabel} · {shots.length}</div>
        <div className="flex gap-1">
          <Button size="icon-sm" variant="ghost" disabled={!shots.length} onClick={onCopy} title={copyLabel}><Copy className="size-3.5" /></Button>
          <Button size="icon-sm" variant="ghost" disabled={capturing} onClick={() => onAdd("visible")} title={addVisibleLabel}><Camera className="size-3.5" /></Button>
          <Button size="icon-sm" variant="ghost" disabled={capturing} onClick={() => onAdd("full")} title={addFullLabel}><MonitorUp className="size-3.5" /></Button>
        </div>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {shots.map((shot, index) => (
          <div key={shot.id} className={`group relative w-24 shrink-0 overflow-hidden rounded-lg border ${shot.id === activeId ? "border-primary ring-1 ring-primary/25" : "border-border"}`}>
            <button type="button" className="block w-full text-start" onClick={() => onSelect(shot.id)}>
              <img src={shot.dataUrl} alt="" className="h-14 w-full bg-muted object-cover" />
              <div className="flex items-center justify-between px-1.5 py-1 text-[10px]"><span>#{index + 1}</span><span className="text-muted-foreground">{shot.kind === "full" ? "Full" : "View"}</span></div>
            </button>
            <Button variant="destructive" size="icon-sm" className="absolute end-1 top-1 size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => onRemove(shot.id)} title={removeLabel}><Trash2 className="size-3" /></Button>
          </div>
        ))}
        <button type="button" disabled={capturing} onClick={() => onAdd("visible")} className="grid h-[82px] w-20 shrink-0 place-items-center rounded-lg border border-dashed text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50" title={addVisibleLabel}><Plus className="size-4" /></button>
      </div>
    </div>
  )
}
