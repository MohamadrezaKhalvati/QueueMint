import { ArrowLeftRight, Check, Grid2X2, Grid3X3, Languages, Palette, RotateCcw, ScanLine, Sun } from "lucide-react"
import { useEffect, useState, type ChangeEvent, type ComponentType, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ACCENT_PRESETS } from "@/features/customization/appearance-preset"
import { accentForDarkMode, foregroundForHex } from "@/features/bulk/bulk-utils"
import type { AppLocale, AppTheme, DensityMode, RadiusMode, ReviewLayout } from "@/types"
import type { AppCopy } from "./app-copy"
import { SmartAssistantSettingsPanel } from "./SmartAssistantSettings"
import { ProductivitySettingsPanel } from "@/features/productivity/ProductivitySettings"

type IconType = ComponentType<{ className?: string }>
type Draft = { theme: AppTheme; locale: AppLocale; accentColor: string; reviewLayout: ReviewLayout; gridColumns: 2 | 3 | 4; density: DensityMode; radius: RadiusMode }

export function AppearanceSheet({ open, onOpenChange, locale, t, theme, setTheme, setLocale, accentColor, setAccentColor, reviewLayout, setReviewLayout, gridColumns, setGridColumns, density, setDensity, radius, setRadius }: {
  open: boolean; onOpenChange: (open: boolean) => void; locale: AppLocale; t: AppCopy; theme: AppTheme; setTheme: (theme: AppTheme) => void; setLocale: (locale: AppLocale) => void
  accentColor: string; setAccentColor: (color: string) => void; reviewLayout: ReviewLayout; setReviewLayout: (layout: ReviewLayout) => void; gridColumns: 2 | 3 | 4; setGridColumns: (columns: 2 | 3 | 4) => void
  density: DensityMode; setDensity: (density: DensityMode) => void; radius: RadiusMode; setRadius: (radius: RadiusMode) => void
}) {
  const applied: Draft = { theme, locale, accentColor, reviewLayout, gridColumns, density, radius }
  const [draft, setDraft] = useState<Draft>(applied)
  const labels = locale === "fa"
    ? { radius: "گردی گوشه ها", none: "بدون گردی", small: "کم", medium: "متوسط", large: "زیاد", reset: "بازنشانی ظاهر", hint: "تغییرها را پیش نمایش کن و با دکمه اعمال ذخیره کن.", apply: "اعمال", cancel: "لغو" }
    : { radius: "Corner radius", none: "None", small: "Small", medium: "Medium", large: "Large", reset: "Reset appearance", hint: "Preview changes first, then save them with Apply.", apply: "Apply", cancel: "Cancel" }

  useEffect(() => { if (open) { setDraft(applied); previewBasic(applied) } }, [open])
  function patch(patchValue: Partial<Draft>) { setDraft((current) => { const next = { ...current, ...patchValue }; previewBasic(next); return next }) }
  function discard() { previewBasic(applied); onOpenChange(false) }
  function handleOpenChange(next: boolean) { if (!next) previewBasic(applied); onOpenChange(next) }
  function apply() {
    setTheme(draft.theme); setLocale(draft.locale); setAccentColor(draft.accentColor); setReviewLayout(draft.reviewLayout)
    setGridColumns(draft.gridColumns); setDensity(draft.density); setRadius(draft.radius); previewBasic(draft); onOpenChange(false)
  }
  function resetAppearance() { patch({ theme: "system", accentColor: "#0f766e", density: "comfortable", radius: "medium" }) }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side={locale === "fa" ? "left" : "right"}>
        <SheetHeader><SheetTitle>{t.settings}</SheetTitle><SheetDescription>{labels.hint}</SheetDescription></SheetHeader>
        <SheetBody className="space-y-6">
          <SettingGroup title={t.theme} icon={Sun}><Segmented values={[{ value: "light", label: t.light }, { value: "dark", label: t.dark }, { value: "system", label: t.system }]} value={draft.theme} onChange={(value) => patch({ theme: value as AppTheme })} /></SettingGroup>
          <SettingGroup title={t.language} icon={Languages}><Segmented values={[{ value: "en", label: "English" }, { value: "fa", label: "فارسی" }]} value={draft.locale} onChange={(value) => patch({ locale: value as AppLocale })} /></SettingGroup>
          <SettingGroup title={t.accent} icon={Palette}>
            <div className="qm-custom-accent-picker">
              <div className="qm-custom-accent-grid">
                {ACCENT_PRESETS.map((color) => <button key={color} type="button" aria-label={color} aria-pressed={draft.accentColor.toLowerCase() === color} className="qm-custom-swatch" onClick={() => patch({ accentColor: color })}><span className="qm-custom-swatch-color" style={{ backgroundColor: color }}>{draft.accentColor.toLowerCase() === color ? <Check className="size-3.5" /> : null}</span></button>)}
              </div>
              <label className="qm-custom-color-input" title={t.accent}>
                <span className="qm-custom-color-preview" style={{ backgroundColor: draft.accentColor }} />
                <span className="min-w-0 flex-1"><strong>{t.accent}</strong><small>{draft.accentColor.toUpperCase()}</small></span>
                <Input type="color" value={draft.accentColor} onChange={(event: ChangeEvent<HTMLInputElement>) => patch({ accentColor: event.target.value })} aria-label={t.accent} />
              </label>
            </div>
          </SettingGroup>
          <SettingGroup title={labels.radius} icon={ScanLine}><Segmented values={[{ value: "none", label: labels.none }, { value: "small", label: labels.small }, { value: "medium", label: labels.medium }, { value: "large", label: labels.large }]} value={draft.radius} onChange={(value) => patch({ radius: value as RadiusMode })} /></SettingGroup>
          <SettingGroup title={t.density} icon={ArrowLeftRight}><Segmented values={[{ value: "compact", label: t.compact }, { value: "comfortable", label: t.comfortable }, { value: "spacious", label: t.spacious }]} value={draft.density} onChange={(value) => patch({ density: value as DensityMode })} /></SettingGroup>
          <SettingGroup title={t.layout} icon={Grid2X2}><Segmented values={[{ value: "board", label: t.boardView }, { value: "grid", label: t.grid }, { value: "list", label: t.list }]} value={draft.reviewLayout} onChange={(value) => patch({ reviewLayout: value as ReviewLayout })} /></SettingGroup>
          {draft.reviewLayout === "grid" ? <SettingGroup title={t.columns} icon={Grid3X3}><Segmented values={[2, 3, 4].map((value) => ({ value: String(value), label: String(value) }))} value={String(draft.gridColumns)} onChange={(value) => patch({ gridColumns: Number(value) as 2 | 3 | 4 })} /></SettingGroup> : null}
          <SmartAssistantSettingsPanel locale={locale} />
          <ProductivitySettingsPanel locale={locale} />
        </SheetBody>
        <SheetFooter className="justify-between"><Button variant="ghost" onClick={resetAppearance}><RotateCcw className="size-4" />{labels.reset}</Button><div className="flex gap-2"><Button variant="outline" onClick={discard}>{labels.cancel}</Button><Button className="min-w-24" onClick={apply}>{labels.apply}</Button></div></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function previewBasic(draft: Pick<Draft, "theme" | "accentColor" | "density" | "radius">) {
  const root = document.documentElement
  const dark = draft.theme === "dark" || (draft.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const color = dark ? accentForDarkMode(draft.accentColor) : draft.accentColor
  root.classList.toggle("dark", dark); root.style.setProperty("--primary", color); root.style.setProperty("--ring", color)
  root.style.setProperty("--primary-foreground", foregroundForHex(color)); root.dataset.density = draft.density; root.dataset.radius = draft.radius
}

function SettingGroup({ title, icon: Icon, children }: { title: string; icon: IconType; children: ReactNode }) {
  return <section><div className="mb-2 flex items-center gap-2 text-sm font-medium"><Icon className="size-4 text-muted-foreground" />{title}</div>{children}</section>
}

function Segmented({ values, value, onChange }: { values: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void }) {
  return <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-1 rounded-[var(--qm-control-radius)] border bg-muted/25 p-1">{values.map((item) => <Button key={item.value} variant={value === item.value ? "secondary" : "ghost"} size="sm" onClick={() => onChange(item.value)} aria-pressed={value === item.value}>{item.label}</Button>)}</div>
}
