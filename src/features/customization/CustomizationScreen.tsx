import { Check, Download, RotateCcw, Settings2, Shuffle, Upload, X } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { downloadJson } from "@/lib/utils"
import type {
  AppLocale, AppTheme, BodyFontMode, DensityMode, HeadingFontMode, NeutralTone, RadiusMode, ReviewLayout,
  SidebarAccentMode, SidebarStyle, SurfaceStyle,
} from "@/types"
import { CustomizationControls } from "./CustomizationControls"
import { CustomizationPreview } from "./CustomizationPreview"
import { buildAppearancePreset, DEFAULT_APPEARANCE, parseAppearancePreset, sameAppearance, type AppearanceSettings } from "./appearance-preset"
import { customizationCopy } from "./customization-copy"
import { ensureAppearanceFonts } from "./font-loader"
import { SHADCN_FONT_VALUES } from "./font-options"

type Props = {
  locale: AppLocale
  theme: AppTheme; setTheme: (value: AppTheme) => void
  accentColor: string; setAccentColor: (value: string) => void
  neutralTone: NeutralTone; setNeutralTone: (value: NeutralTone) => void
  density: DensityMode; setDensity: (value: DensityMode) => void
  radius: RadiusMode; setRadius: (value: RadiusMode) => void
  bodyFont: BodyFontMode; setBodyFont: (value: BodyFontMode) => void
  headingFont: HeadingFontMode; setHeadingFont: (value: HeadingFontMode) => void
  sidebarStyle: SidebarStyle; setSidebarStyle: (value: SidebarStyle) => void
  sidebarAccent: SidebarAccentMode; setSidebarAccent: (value: SidebarAccentMode) => void
  surfaceStyle: SurfaceStyle; setSurfaceStyle: (value: SurfaceStyle) => void
  reviewLayout: ReviewLayout; setReviewLayout: (value: ReviewLayout) => void
  gridColumns: 2 | 3 | 4; setGridColumns: (value: 2 | 3 | 4) => void
  onAdvanced: () => void
}

export function CustomizationScreen(props: Props) {
  const tx = customizationCopy(props.locale)
  const inputRef = useRef<HTMLInputElement>(null)
  const [baseline, setBaseline] = useState<AppearanceSettings>(() => currentSettings(props))
  const [draft, setDraft] = useState<AppearanceSettings>(() => baseline)
  const [hoverPatch, setHoverPatch] = useState<Partial<AppearanceSettings> | null>(null)
  const dirty = !sameAppearance(draft, baseline)
  const preview = hoverPatch ? { ...draft, ...hoverPatch } : draft

  useEffect(() => ensureAppearanceFonts(props.locale, preview.bodyFont, preview.headingFont), [props.locale, preview.bodyFont, preview.headingFont])

  function patchDraft(patch: Partial<AppearanceSettings>) { setHoverPatch(null); setDraft((current) => ({ ...current, ...patch })) }
  function replaceDraft(settings: AppearanceSettings) { setHoverPatch(null); setDraft(settings) }

  function commit(settings: AppearanceSettings) {
    props.setTheme(settings.theme); props.setAccentColor(settings.accentColor); props.setNeutralTone(settings.neutralTone)
    props.setDensity(settings.density); props.setRadius(settings.radius); props.setBodyFont(settings.bodyFont); props.setHeadingFont(settings.headingFont)
    props.setSidebarStyle(settings.sidebarStyle); props.setSidebarAccent(settings.sidebarAccent); props.setSurfaceStyle(settings.surfaceStyle)
    props.setReviewLayout(settings.reviewLayout); props.setGridColumns(settings.gridColumns)
  }

  function applyDraft() { commit(draft); setBaseline(draft); setHoverPatch(null); toast.success(tx.applied) }
  function discardDraft() { replaceDraft(baseline) }

  function shuffle() {
    const pick = <T,>(values: readonly T[]) => values[Math.floor(Math.random() * values.length)]
    replaceDraft({
      ...draft,
      accentColor: pick(["#0f766e", "#0891b2", "#2563eb", "#4f46e5", "#7c3aed", "#be123c", "#dc2626", "#c2410c"]),
      neutralTone: pick(["mist", "slate", "zinc", "gray", "neutral", "stone", "sand", "paper"] as const), density: pick(["compact", "comfortable", "spacious"] as const),
      radius: pick(["none", "small", "medium", "large"] as const),
      bodyFont: pick(["system", "humanist", "geometric", "rounded", "serif", "mono", ...SHADCN_FONT_VALUES, "vazirmatn", "mikhak", "samim", "shabnam", "sahel", "naskh"] as BodyFontMode[]),
      headingFont: pick(["system", "display", "humanist", "geometric", "rounded", "serif", "mono", ...SHADCN_FONT_VALUES, "vazirmatn", "mikhak", "samim", "shabnam", "sahel", "naskh", "lalezar"] as HeadingFontMode[]),
      sidebarStyle: pick(["soft", "solid", "outline"] as const), sidebarAccent: pick(["subtle", "filled"] as const), surfaceStyle: pick(["flat", "bordered", "raised"] as const),
    })
  }

  async function copyPreset() {
    await navigator.clipboard.writeText(JSON.stringify(buildAppearancePreset(draft), null, 2))
    toast.success(tx.copied)
  }

  function exportPreset() {
    downloadJson(`queuemint-appearance-${new Date().toISOString().slice(0, 10)}.json`, buildAppearancePreset(draft))
    toast.success(tx.exported)
  }

  async function importPreset(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try { replaceDraft(parseAppearancePreset(JSON.parse(await file.text()))); toast.success(tx.imported) } catch { toast.error(tx.invalid) }
  }

  return (
    <div className="qm-custom-page">
      <div className="qm-custom-heading">
        <div><div className="qm-custom-eyebrow">{tx.eyebrow}</div><h1>{tx.title}</h1><p>{tx.hint}</p></div>
        <div className="qm-custom-heading-actions"><Button variant="outline" onClick={props.onAdvanced}><Settings2 className="size-4" />{tx.advanced}</Button><Button variant="outline" onClick={() => void copyPreset()}>{tx.copy}</Button></div>
      </div>
      <div className="qm-custom-toolbar">
        <div className="qm-custom-preset-code"><span>{tx.preset}</span><code>{presetLabel(draft)}</code><span className={`qm-custom-save-state ${dirty ? "is-dirty" : ""}`}>{dirty ? tx.unsaved : tx.saved}</span></div>
        <div className="qm-custom-toolbar-actions">
          <Button size="sm" variant="ghost" onClick={() => replaceDraft(DEFAULT_APPEARANCE)}><RotateCcw className="size-4" />{tx.reset}</Button>
          <Button size="sm" variant="ghost" onClick={shuffle}><Shuffle className="size-4" />{tx.shuffle}</Button>
          <Button size="sm" variant="outline" onClick={exportPreset}><Download className="size-4" />{tx.export}</Button>
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}><Upload className="size-4" />{tx.import}</Button>
          <Button size="sm" variant="ghost" disabled={!dirty} onClick={discardDraft}><X className="size-4" />{tx.cancel}</Button>
          <Button size="sm" disabled={!dirty} onClick={applyDraft}><Check className="size-4" />{tx.apply}</Button>
          <input ref={inputRef} className="hidden" type="file" accept="application/json,.json" onChange={(event) => void importPreset(event)} />
        </div>
      </div>
      <div className="qm-custom-layout">
        <div className="qm-custom-control-column"><div className="qm-custom-hover-hint">{tx.hoverHint}</div><CustomizationControls tx={tx} settings={draft} onPatch={patchDraft} onPreviewPatch={setHoverPatch} onPreviewEnd={() => setHoverPatch(null)} /></div>
        <CustomizationPreview locale={props.locale} tx={tx} settings={preview} />
      </div>
    </div>
  )
}

function currentSettings(p: Props): AppearanceSettings {
  return {
    theme: p.theme, accentColor: p.accentColor, neutralTone: p.neutralTone, density: p.density, radius: p.radius,
    bodyFont: p.bodyFont, headingFont: p.headingFont, sidebarStyle: p.sidebarStyle, sidebarAccent: p.sidebarAccent,
    surfaceStyle: p.surfaceStyle, reviewLayout: p.reviewLayout, gridColumns: p.gridColumns,
  }
}

function presetLabel(settings: AppearanceSettings) {
  return `qm:${settings.neutralTone}.${settings.sidebarStyle}.${settings.bodyFont}.${settings.radius}.${settings.density}.${settings.accentColor.slice(1)}`
}
