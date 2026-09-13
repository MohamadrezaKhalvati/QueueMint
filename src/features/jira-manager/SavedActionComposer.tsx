import { Layers3, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { SimpleSelect } from "@/components/jira-controls"
import { Button } from "@/components/ui/button"
import type { SavedWorkspaceAction } from "@/lib/storage"
import type { AppLocale } from "@/types"

export function SavedActionComposer({ locale, actions, onCompose }: {
  locale: AppLocale
  actions: SavedWorkspaceAction[]
  onCompose: (action: SavedWorkspaceAction) => void
}) {
  const [actionId, setActionId] = useState("")
  const selected = useMemo(() => actions.find((action) => action.id === actionId), [actions, actionId])
  if (!actions.length) return null
  const isFa = locale === "fa"
  return (
    <section className="rounded-xl border bg-muted/[0.12] p-3.5">
      <div className="mb-3 flex items-start gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Layers3 className="size-4" /></div><div><div className="text-sm font-semibold">{isFa ? "ترکیب عملیات ذخیره‌شده" : "Compose saved actions"}</div><div className="mt-0.5 text-xs leading-5 text-muted-foreground">{isFa ? "یک عملیات دیگر را به پیش‌نویس فعلی اضافه کن. فقط فیلدهایی که آن عملیات تنظیم کرده‌اند جایگزین می‌شوند." : "Layer another saved action onto this draft. Only fields configured by that action override existing draft values."}</div></div></div>
      <div className="flex flex-col gap-2 sm:flex-row"><SimpleSelect value={actionId} onValueChange={setActionId} className="min-w-0 flex-1" placeholder={isFa ? "انتخاب عملیات" : "Choose saved action"} items={actions.map((action) => ({ value: action.id, label: action.name }))} /><Button variant="outline" disabled={!selected} onClick={() => { if (selected) onCompose(selected) }}><Plus className="size-4" />{isFa ? "افزودن به پیش‌نویس" : "Add to draft"}</Button></div>
    </section>
  )
}
