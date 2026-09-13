import { CheckCircle2, ChevronRight, History, LoaderCircle, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { copy } from "@/features/app-shell/app-copy"
import type { BulkHistoryEntry, PendingBulkPreview } from "@/features/bulk/bulk-utils"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/types"

export function LiveBulkPreviewSheet({ open, onOpenChange, locale, t, preview, applying, onBack, onConfirm }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  preview: PendingBulkPreview | null
  applying: boolean
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"} className="w-[min(96vw,620px)]">
        <SheetHeader><SheetTitle>{t.bulkEditPreview}</SheetTitle><SheetDescription>{t.bulkEditPreviewHint}</SheetDescription></SheetHeader>
        <SheetBody className="space-y-4">
          <div className="rounded-xl border bg-primary/[0.035] px-4 py-3">
            <div className="text-sm font-semibold">{preview?.keys.length ?? 0} {t.issuesAffected}</div>
            <div className="mt-1 text-xs text-muted-foreground">{preview?.rows.length ?? 0} {t.changes}</div>
          </div>
          <div className="space-y-2">
            {(preview?.rows ?? []).map((row) => (
              <div key={row.id} className="rounded-xl border bg-card p-3">
                <div className="mb-2 text-sm font-medium">{row.label}</div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <div className="rounded-lg bg-muted/30 px-3 py-2"><div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{t.beforeValue}</div><div className="mt-1 break-words text-sm">{row.before}</div></div>
                  <ChevronRight className={cn("mx-auto size-4 text-muted-foreground", locale === "fa" && "rotate-180")} />
                  <div className="rounded-lg bg-primary/[0.06] px-3 py-2"><div className="text-[10px] uppercase tracking-[0.12em] text-primary">{t.afterValue}</div><div className="mt-1 break-words text-sm font-medium">{row.after}</div></div>
                </div>
              </div>
            ))}
          </div>
        </SheetBody>
        <SheetFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onBack} disabled={applying}>{t.backToEdit}</Button>
          <Button onClick={onConfirm} disabled={!preview || applying}>{applying ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}{t.confirmBulkEdit}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function BulkHistorySheet({ open, onOpenChange, locale, t, history, undoingId, onUndo }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: AppLocale
  t: typeof copy.en | typeof copy.fa
  history: BulkHistoryEntry[]
  undoingId: string | null
  onUndo: (entry: BulkHistoryEntry) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"} className="w-[min(94vw,520px)]">
        <SheetHeader><SheetTitle>{t.changeHistory}</SheetTitle><SheetDescription>{t.historyHint}</SheetDescription></SheetHeader>
        <SheetBody>
          {!history.length ? <div className="grid min-h-44 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">{t.noHistory}</div> : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-card p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><History className="size-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{entry.keys.length} {t.issuesAffected}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</div>
                      <div className="mt-2 flex flex-wrap gap-1">{entry.changes.slice(0, 5).map((change) => <Badge key={change} variant="secondary" className="px-1.5 py-0 text-[10px]">{change}</Badge>)}{entry.changes.length > 5 ? <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">+{entry.changes.length - 5}</Badge> : null}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onUndo(entry)} disabled={Boolean(undoingId)}>{undoingId === entry.id ? <LoaderCircle className="size-4 animate-spin" /> : <Undo2 className="size-4" />}{undoingId === entry.id ? t.undoing : t.undo}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
