import { CircleDot, Inbox } from "lucide-react"

import { Button } from "@/components/ui/button"
import { copy } from "@/features/app-shell/app-copy"
import type { Placement } from "@/features/bulk/bulk-utils"

export function PlacementToggle({ value, onChange, t }: { value: Placement; onChange: (value: Placement) => void; t: typeof copy.en | typeof copy.fa }) {
  return (
    <div className="qm-placement-toggle grid grid-cols-2 border bg-muted/25 p-1">
      <Button variant={value === "sprint" ? "secondary" : "ghost"} size="sm" onClick={() => onChange("sprint")} aria-pressed={value === "sprint"}><CircleDot className="size-3.5 text-success" />{t.sprint}</Button>
      <Button variant={value === "backlog" ? "secondary" : "ghost"} size="sm" onClick={() => onChange("backlog")} aria-pressed={value === "backlog"}><Inbox className="size-3.5" />{t.backlog}</Button>
    </div>
  )
}
