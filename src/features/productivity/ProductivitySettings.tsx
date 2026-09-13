import { Download, ShieldCheck, Upload } from "lucide-react"
import { useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { buildPortableBackup, restorePortableBackup } from "./productivity-storage"
import { downloadJson } from "@/lib/utils"
import type { AppLocale } from "@/types"

function text(locale: AppLocale) {
  return locale === "fa" ? {
    title: "پشتیبان تنظیمات", hint: "تنظیمات، فرمان‌های محبوب، پروژه‌های اخیر، نماها و عملیات ذخیره‌شده را جابه‌جا کن.",
    export: "خروجی پشتیبان", import: "بازیابی پشتیبان", safe: "کلید API هوش مصنوعی، تاریخچه فعالیت و متن‌های کاری داخل فایل پشتیبان قرار نمی‌گیرند.",
    exported: "فایل پشتیبان ساخته شد", restored: "پشتیبان بازیابی شد. QueueMint دوباره بارگذاری می‌شود.", invalid: "فایل پشتیبان QueueMint معتبر نیست.",
  } : {
    title: "Preferences backup", hint: "Move preferences, favorite commands, recent projects, Saved Views, and Saved Actions between installs.",
    export: "Export backup", import: "Restore backup", safe: "AI API keys, activity history, and working drafts are intentionally excluded from portable backups.",
    exported: "Backup exported", restored: "Backup restored. QueueMint will reload now.", invalid: "That is not a valid QueueMint backup file.",
  }
}

export function ProductivitySettingsPanel({ locale }: { locale: AppLocale }) {
  const tx = text(locale)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function exportBackup() {
    setBusy(true)
    try {
      downloadJson(`queuemint-backup-${new Date().toISOString().slice(0, 10)}.json`, await buildPortableBackup())
      toast.success(tx.exported)
    } finally { setBusy(false) }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setBusy(true)
    try {
      await restorePortableBackup(JSON.parse(await file.text()))
      toast.success(tx.restored)
      window.location.reload()
    } catch { toast.error(tx.invalid) } finally { setBusy(false) }
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium"><Download className="size-4 text-muted-foreground" />{tx.title}</div>
      <div className="rounded-xl border bg-muted/10 p-3.5">
        <p className="text-xs leading-5 text-muted-foreground">{tx.hint}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void exportBackup()}><Download className="size-3.5" />{tx.export}</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}><Upload className="size-3.5" />{tx.import}</Button></div>
        <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importBackup(event)} />
        <div className="mt-3 flex items-start gap-2 rounded-lg border bg-background p-2.5 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /><span>{tx.safe}</span></div>
      </div>
    </section>
  )
}
