import type { ChangeEvent } from "react"
import { CircleDot, LoaderCircle, SquareKanban } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { copy } from "@/features/app-shell/app-copy"
import type { JiraConnectionStatus } from "@/types"

import { looksLikeJiraCandidate, safeOrigin } from "@/features/connection/jira-candidate"

export function JiraOnboardingSheet({
  open,
  onOpenChange,
  t,
  status,
  url,
  setUrl,
  loading,
  onConnect,
  onSkip,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  t: typeof copy.en | typeof copy.fa
  status: JiraConnectionStatus | null
  url: string
  setUrl: (value: string) => void
  loading: boolean
  onConnect: (value: string, tabId?: number) => void
  onSkip: () => void
}) {
  const candidateOrigin = looksLikeJiraCandidate(status?.candidate) ? safeOrigin(status?.candidate?.url) : ""
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t.onboardingTitle}</SheetTitle>
          <SheetDescription>{t.onboardingHint}</SheetDescription>
        </SheetHeader>
        <SheetBody className="space-y-5">
          {candidateOrigin ? (
            <button
              type="button"
              onClick={() => onConnect(candidateOrigin, status?.candidate?.tabId)}
              disabled={loading}
              className="w-full rounded-[var(--qm-panel-radius)] border bg-card p-4 text-start shadow-xs transition hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-[var(--qm-control-radius)] bg-primary/10 text-primary"><SquareKanban className="size-5" /></div>
                <div className="min-w-0">
                  <div className="font-medium">{t.currentJiraTab}</div>
                  <div className="mt-1 truncate text-sm text-muted-foreground" dir="ltr">{status?.candidate?.title || candidateOrigin}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{candidateOrigin}</div>
                </div>
              </div>
            </button>
          ) : null}

          <Field>
            <FieldLabel>{t.jiraUrl}</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={url} onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)} placeholder={t.jiraUrlPlaceholder} dir="ltr" />
              <Button onClick={() => onConnect(url)} disabled={loading || !url.trim()}>
                {loading ? <LoaderCircle className="size-4 animate-spin" /> : <CircleDot className="size-4" />}
                {t.connect}
              </Button>
            </div>
            <FieldDescription>{t.onboardingHint}</FieldDescription>
          </Field>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" onClick={onSkip}>{t.skipForNow}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
