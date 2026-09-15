import { Check, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { jiraBrowseUrl } from "@/lib/jira"
import type { PopupCopy } from "./popup-copy"

export function PopupSuccessView({ t, createdKey, onReset }: { t: PopupCopy; createdKey: string; onReset: () => void }) {
  return (
    <div className="grid min-h-[420px] place-items-center text-center"><div><div className="mx-auto grid size-14 place-items-center rounded-[var(--qm-panel-radius)] bg-accent text-primary"><Check className="size-7" /></div><div className="mt-4 text-lg font-semibold">{t.created}</div><div className="mt-1 font-mono text-sm text-muted-foreground">{createdKey}</div><div className="mt-5 flex justify-center gap-2"><Button onClick={() => { const url = jiraBrowseUrl(createdKey); if (url && url !== "#") void chrome.tabs.create({ url }) }}><ExternalLink className="size-4" />{t.openInJira}</Button><Button variant="outline" onClick={onReset}>{t.createAnother}</Button></div></div></div>
  )
}
