import { Check, CircleDot, ExternalLink, SquareKanban } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { copy } from "@/features/app-shell/app-copy"
import { cn } from "@/lib/utils"
import type { JiraConnectionStatus } from "@/types"

export function JiraConnectionSheet({
  open,
  onOpenChange,
  t,
  status,
  onSelect,
  onOpenJira,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: typeof copy.en | typeof copy.fa
  status: JiraConnectionStatus | null
  onSelect: (tabId: number) => void
  onOpenJira: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t.chooseJiraTab}</SheetTitle>
          <SheetDescription>{t.chooseJiraTabHint}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-4">
          <div className="qm-jira-connected-card rounded-[var(--qm-panel-radius)] border bg-gradient-to-br from-muted/45 to-background p-4 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><CircleDot className="size-3.5 text-success" />{t.connectedSite}</div>
            <div className="mt-1.5 truncate text-sm font-semibold" dir="ltr" title={status?.origin ?? ""}>{status?.origin ?? "—"}</div>
          </div>
          {status?.tabs?.length ? (
            <div className="space-y-2">
              {status.tabs.map((tab) => {
                const selected = tab.id === status.selectedTabId
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelect(tab.id)}
                    className={cn(
                      "qm-jira-tab-card w-full rounded-[var(--qm-panel-radius)] border p-3.5 text-start shadow-xs transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20",
                      selected ? "border-primary/35 bg-primary/[0.045] shadow-sm" : "bg-card hover:border-primary/20 hover:bg-muted/25",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("qm-jira-tab-icon mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--qm-control-radius)]", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {selected ? <Check className="size-4" /> : <SquareKanban className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{tab.title || "Jira"}</span>
                          {selected ? <Badge variant="success">{t.tabInUse}</Badge> : null}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{tab.url}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="qm-jira-empty-card rounded-[var(--qm-panel-radius)] border border-dashed p-6 text-center text-sm text-muted-foreground">{t.noJiraTabs}</div>
          )}
        </SheetBody>
        <SheetFooter className="grid grid-cols-2 sm:flex sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onOpenJira}><ExternalLink className="size-4" />{t.openJira}</Button>
          <Button className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>{t.done}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
