import { ArrowLeftRight, ShieldCheck, UserCheck } from "lucide-react"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { AppLocale } from "@/types"

type PendingMutation =
  | { kind: "assign"; count: number; targetLabel: string }
  | { kind: "move"; count: number; targetLabel: string }
  | null

export function ManageMutationConfirmDialog({ locale, pending, onOpenChange, onConfirm }: {
  locale: AppLocale
  pending: PendingMutation
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const isFa = locale === "fa"
  const isAssign = pending?.kind === "assign"
  const title = isAssign
    ? (isFa ? "این تسک‌ها به شما اختصاص داده شوند؟" : "Assign these issues to you?")
    : (isFa ? "این تسک‌ها جابه‌جا شوند؟" : "Move these issues?")
  const description = isAssign
    ? (isFa ? "QueueMint بعد از تایید، Assignee را مستقیم در Jira تغییر می‌دهد." : "After confirmation, QueueMint will change the assignee directly in Jira.")
    : (isFa ? "QueueMint بعد از تایید، محل این تسک‌ها را مستقیم در Jira تغییر می‌دهد." : "After confirmation, QueueMint will move these issues directly in Jira.")

  return (
    <AlertDialog open={Boolean(pending)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {pending ? (
          <div className="mt-4 grid gap-2 rounded-[var(--qm-panel-radius)] border bg-muted/15 p-3 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">{isFa ? "تعداد" : "Issues"}</div>
              <div className="mt-1"><Badge variant="secondary">{pending.count}</Badge></div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{isAssign ? (isFa ? "مسئول جدید" : "New assignee") : (isFa ? "مقصد" : "Destination")}</div>
              <div className="mt-1 flex items-center gap-2 font-medium">{isAssign ? <UserCheck className="size-4 text-primary" /> : <ArrowLeftRight className="size-4 text-primary" />}<span className="truncate">{pending.targetLabel}</span></div>
            </div>
          </div>
        ) : null}
        <div className="mt-3 flex items-start gap-2 rounded-[var(--qm-control-radius)] border border-primary/15 bg-primary/[0.035] p-3 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>{isFa ? "این مرحله برای جلوگیری از تغییر تصادفی روی Jira اضافه شده است." : "This confirmation prevents accidental Jira mutations."}</span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{isFa ? "انصراف" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{isFa ? "تایید و اعمال" : "Confirm and apply"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
