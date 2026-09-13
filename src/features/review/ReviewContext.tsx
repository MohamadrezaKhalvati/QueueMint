import { Layers3, SquareKanban } from "lucide-react"
import { BoardSelect } from "@/components/jira-controls"
import { cn } from "@/lib/utils"
import type { JiraBoard } from "@/types"

export function ContextItem({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Layers3; tone?: "success" }) {
  return (
    <div className="context-item qm-context-item inline-flex min-w-[150px] flex-1 items-center gap-3 px-3 py-1 sm:max-w-[235px]">
      <span className={cn("qm-context-icon grid size-9 shrink-0 place-items-center rounded-lg border bg-muted/45 text-muted-foreground", tone === "success" && "border-primary/15 bg-primary/[0.07] text-primary")}><Icon className="size-4" /></span>
      <span className="min-w-0 leading-tight"><span className="block text-[11px] text-muted-foreground">{label}</span><span className="mt-1 block truncate text-[15px] font-semibold" title={value}>{value}</span></span>
    </div>
  )
}

export function BoardContextItem({ label, boards, value, onValueChange, disabled }: { label: string; boards: JiraBoard[]; value: number | null; onValueChange: (value: number) => void; disabled?: boolean }) {
  return (
    <div className="context-item qm-context-item inline-flex min-w-[150px] flex-1 items-center gap-3 px-3 py-1 sm:max-w-[300px]">
      <span className="qm-context-icon grid size-9 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary/[0.07] text-primary"><SquareKanban className="size-4" /></span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block text-[11px] text-muted-foreground">{label}</span>
        <BoardSelect boards={boards} value={value} onValueChange={onValueChange} disabled={disabled} className="qm-context-board-select mt-0.5 h-7 border-0 bg-transparent px-0 py-0 text-[15px] font-semibold shadow-none hover:bg-transparent focus-visible:border-transparent focus-visible:ring-0 data-[state=open]:border-transparent data-[state=open]:ring-0" />
      </span>
    </div>
  )
}
