import { AlertTriangle, Check } from "lucide-react"

import type { SmartPreflightItem } from "@/lib/smart-capture"
import type { PopupCopy } from "./popup-copy"

export function PopupPreflightCard({ t, items }: { t: PopupCopy; items: SmartPreflightItem[] }) {
  const warnings = items.filter((item) => item.level !== "ok").length
  return (
    <div className="qm-field-span-2 qm-preflight-card">
      <div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold">{t.preflight}</div><span className={`grid min-w-6 place-items-center rounded-full px-2 py-1 text-[10px] font-semibold ${warnings ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>{warnings || <Check className="size-3.5" />}</span></div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{items.map((item) => <div key={item.id} className="flex items-center gap-2 text-[11px]"><span className={`grid size-5 shrink-0 place-items-center rounded-full ${item.level === "ok" ? "bg-primary/10 text-primary" : item.level === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>{item.level === "ok" ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}</span><span className="text-muted-foreground">{item.label}</span></div>)}</div>
    </div>
  )
}
