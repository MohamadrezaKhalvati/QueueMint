import { Check, ChevronDown } from "lucide-react"
import { Fragment, useState, type ChangeEvent, type ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { AppearanceSettings } from "./appearance-preset"
import { ACCENT_PRESETS } from "./appearance-preset"
import type { customizationCopy } from "./customization-copy"
import { SHADCN_FONT_CHOICES } from "./font-options"

type Copy = ReturnType<typeof customizationCopy>
type Choice = { value: string; label: string; sample?: string; sampleClass?: string; group?: string }
type Patch = Partial<AppearanceSettings>

type Props = {
  tx: Copy
  settings: AppearanceSettings
  onPatch: (patch: Patch) => void
  onPreviewPatch: (patch: Patch) => void
  onPreviewEnd: () => void
}

export function CustomizationControls({ tx, settings: s, onPatch, onPreviewPatch, onPreviewEnd }: Props) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuState = (id: string) => ({ open: openMenu === id, onOpenChange: (open: boolean) => setOpenMenu(open ? id : null) })
  return (
    <div className="qm-custom-controls">
      <MenuChoiceControl {...menuState("theme")} label={tx.theme} value={s.theme} choices={[
        { value: "light", label: tx.light, sample: "☀" }, { value: "dark", label: tx.dark, sample: "◐" }, { value: "system", label: tx.system, sample: "A" },
      ]} onChange={(value) => onPatch({ theme: value as AppearanceSettings["theme"] })} onPreview={(value) => onPreviewPatch({ theme: value as AppearanceSettings["theme"] })} onPreviewEnd={onPreviewEnd} />
      <Control label={tx.accent}>
        <div className="qm-custom-accent-picker">
          <div className="qm-custom-accent-grid">
            {ACCENT_PRESETS.map((color) => (
              <button key={color} type="button" aria-label={color} aria-pressed={s.accentColor.toLowerCase() === color} className="qm-custom-swatch"
                onPointerEnter={() => onPreviewPatch({ accentColor: color })} onPointerLeave={onPreviewEnd} onClick={() => onPatch({ accentColor: color })}>
                <span className="qm-custom-swatch-color" style={{ backgroundColor: color }}>{s.accentColor.toLowerCase() === color ? <Check className="size-3.5" /> : null}</span>
              </button>
            ))}
          </div>
          <label className="qm-custom-color-input" title={tx.accent}>
            <span className="qm-custom-color-preview" style={{ backgroundColor: s.accentColor }} />
            <span className="min-w-0 flex-1"><strong>{tx.custom}</strong><small>{s.accentColor.toUpperCase()}</small></span>
            <Input type="color" value={s.accentColor} onChange={(event: ChangeEvent<HTMLInputElement>) => onPatch({ accentColor: event.target.value })} aria-label={tx.accent} />
          </label>
        </div>
      </Control>
      <MenuChoiceControl {...menuState("tone")} label={tx.tone} value={s.neutralTone} choices={[
        { value: "mist", label: tx.mist, sample: "", sampleClass: "tone-mist" }, { value: "slate", label: tx.slate, sample: "", sampleClass: "tone-slate" },
        { value: "zinc", label: tx.zinc, sample: "", sampleClass: "tone-zinc" }, { value: "gray", label: tx.gray, sample: "", sampleClass: "tone-gray" },
        { value: "neutral", label: tx.neutral, sample: "", sampleClass: "tone-neutral" }, { value: "stone", label: tx.stone, sample: "", sampleClass: "tone-stone" },
        { value: "sand", label: tx.sand, sample: "", sampleClass: "tone-sand" }, { value: "paper", label: tx.paper, sample: "", sampleClass: "tone-paper" },
      ]} onChange={(value) => onPatch({ neutralTone: value as AppearanceSettings["neutralTone"] })} onPreview={(value) => onPreviewPatch({ neutralTone: value as AppearanceSettings["neutralTone"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("heading-font")} label={tx.headingFont} value={s.headingFont} choices={fontChoices(tx, true)} onChange={(value) => onPatch({ headingFont: value as AppearanceSettings["headingFont"] })} onPreview={(value) => onPreviewPatch({ headingFont: value as AppearanceSettings["headingFont"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("body-font")} label={tx.bodyFont} value={s.bodyFont} choices={fontChoices(tx, false)} onChange={(value) => onPatch({ bodyFont: value as AppearanceSettings["bodyFont"] })} onPreview={(value) => onPreviewPatch({ bodyFont: value as AppearanceSettings["bodyFont"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("radius")} label={tx.radius} value={s.radius} choices={[
        { value: "none", label: tx.none, sample: "□" }, { value: "small", label: tx.small, sample: "▢" }, { value: "medium", label: tx.medium, sample: "▢" }, { value: "large", label: tx.large, sample: "▢" },
      ]} onChange={(value) => onPatch({ radius: value as AppearanceSettings["radius"] })} onPreview={(value) => onPreviewPatch({ radius: value as AppearanceSettings["radius"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("density")} label={tx.density} value={s.density} choices={[
        { value: "compact", label: tx.compact, sample: "≡" }, { value: "comfortable", label: tx.comfortable, sample: "≣" }, { value: "spacious", label: tx.spacious, sample: "☰" },
      ]} onChange={(value) => onPatch({ density: value as AppearanceSettings["density"] })} onPreview={(value) => onPreviewPatch({ density: value as AppearanceSettings["density"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("sidebar")} label={tx.sidebar} value={s.sidebarStyle} choices={[
        { value: "soft", label: tx.soft, sample: "◧" }, { value: "solid", label: tx.solid, sample: "▮" }, { value: "outline", label: tx.outline, sample: "▯" },
      ]} onChange={(value) => onPatch({ sidebarStyle: value as AppearanceSettings["sidebarStyle"] })} onPreview={(value) => onPreviewPatch({ sidebarStyle: value as AppearanceSettings["sidebarStyle"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("menu-accent")} label={tx.menuAccent} value={s.sidebarAccent} choices={[
        { value: "subtle", label: tx.subtle, sample: "◌" }, { value: "filled", label: tx.filled, sample: "●" },
      ]} onChange={(value) => onPatch({ sidebarAccent: value as AppearanceSettings["sidebarAccent"] })} onPreview={(value) => onPreviewPatch({ sidebarAccent: value as AppearanceSettings["sidebarAccent"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("surface")} label={tx.surface} value={s.surfaceStyle} choices={[
        { value: "flat", label: tx.flat, sample: "▬" }, { value: "bordered", label: tx.bordered, sample: "▭" }, { value: "raised", label: tx.raised, sample: "▱" },
      ]} onChange={(value) => onPatch({ surfaceStyle: value as AppearanceSettings["surfaceStyle"] })} onPreview={(value) => onPreviewPatch({ surfaceStyle: value as AppearanceSettings["surfaceStyle"] })} onPreviewEnd={onPreviewEnd} />
      <MenuChoiceControl {...menuState("layout")} label={tx.layout} value={s.reviewLayout} choices={[
        { value: "board", label: tx.board, sample: "▥" }, { value: "grid", label: tx.grid, sample: "▦" }, { value: "list", label: tx.list, sample: "☷" },
      ]} onChange={(value) => onPatch({ reviewLayout: value as AppearanceSettings["reviewLayout"] })} onPreviewEnd={onPreviewEnd} />
      {s.reviewLayout === "grid" ? <MenuChoiceControl {...menuState("columns")} label={tx.columns} value={String(s.gridColumns)} choices={[2, 3, 4].map((value) => ({ value: String(value), label: String(value), sample: `${value}×` }))} onChange={(value) => onPatch({ gridColumns: Number(value) as 2 | 3 | 4 })} onPreviewEnd={onPreviewEnd} /> : null}
    </div>
  )
}

function fontChoices(tx: Copy, heading: boolean): Choice[] {
  const presets: Choice[] = [
    ...(heading ? [{ value: "display", label: tx.display, sample: "Aa", sampleClass: "display", group: tx.fontPresets }] : [{ value: "humanist", label: tx.humanist, sample: "Aa", sampleClass: "humanist", group: tx.fontPresets }]),
    { value: "system", label: tx.systemFont, sample: "Aa", sampleClass: "system", group: tx.fontPresets },
    { value: "geometric", label: tx.geometric, sample: "Aa", sampleClass: "geometric", group: tx.fontPresets },
    { value: "rounded", label: tx.rounded, sample: "Aa", sampleClass: "rounded", group: tx.fontPresets },
    { value: "serif", label: tx.serif, sample: "Aa", sampleClass: "serif", group: tx.fontPresets },
    { value: "mono", label: tx.mono, sample: "Aa", sampleClass: "mono", group: tx.fontPresets },
  ]
  const groupLabel = (group: "sans" | "mono" | "serif") => group === "sans" ? tx.fontSans : group === "mono" ? tx.fontMono : tx.fontSerif
  const shadcn: Choice[] = SHADCN_FONT_CHOICES.map((font) => ({ value: font.value, label: font.label, sample: "Aa", sampleClass: font.value, group: groupLabel(font.group) }))
  const persian: Choice[] = [
    { value: "vazirmatn", label: tx.vazirmatn, sample: "آa", sampleClass: "vazirmatn", group: tx.fontPersian },
    { value: "mikhak", label: tx.mikhak, sample: "آa", sampleClass: "mikhak", group: tx.fontPersian },
    { value: "samim", label: tx.samim, sample: "آa", sampleClass: "samim", group: tx.fontPersian },
    { value: "shabnam", label: tx.shabnam, sample: "آa", sampleClass: "shabnam", group: tx.fontPersian },
    { value: "sahel", label: tx.sahel, sample: "آa", sampleClass: "sahel", group: tx.fontPersian },
    { value: "naskh", label: tx.naskh, sample: "آa", sampleClass: "naskh", group: tx.fontPersian },
    ...(heading ? [{ value: "lalezar", label: tx.lalezar, sample: "آa", sampleClass: "lalezar", group: tx.fontPersian }] : []),
  ]
  return [...presets, ...shadcn, ...persian]
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return <section className="qm-custom-control"><div className="qm-custom-control-label">{label}</div>{children}</section>
}

function MenuChoiceControl({ label, choices, value, open, onOpenChange, onChange, onPreview, onPreviewEnd }: {
  label: string; choices: Choice[]; value: string; open: boolean; onOpenChange: (open: boolean) => void
  onChange: (value: string) => void; onPreview?: (value: string) => void; onPreviewEnd: () => void
}) {
  const selected = choices.find((item) => item.value === value) ?? choices[0]
  return (
    <Control label={label}>
      <div className={cn("qm-custom-menu", open && "is-open")} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { onPreviewEnd(); onOpenChange(false) } }}>
        <button type="button" className="qm-custom-menu-trigger" aria-expanded={open} onClick={() => { onPreviewEnd(); onOpenChange(!open) }}>
          <span className={cn("qm-custom-menu-sample", selected.sampleClass && `is-font-${selected.sampleClass}`)}>{selected.sample ?? selected.label.slice(0, 2)}</span>
          <span className="qm-custom-menu-value">{selected.label}</span><ChevronDown className="size-3.5" />
        </button>
        {open ? <div className="qm-custom-menu-popover" onPointerLeave={onPreviewEnd}>{choices.map((choice, index) => {
          const showGroup = Boolean(choice.group && choice.group !== choices[index - 1]?.group)
          return <Fragment key={choice.value}>
            {showGroup ? <div className="qm-custom-menu-group-label">{choice.group}</div> : null}
            <button type="button" className="qm-custom-menu-option" aria-pressed={value === choice.value} onPointerEnter={() => onPreview?.(choice.value)} onFocus={() => onPreview?.(choice.value)} onClick={() => { onChange(choice.value); onPreviewEnd(); onOpenChange(false) }}>
              <span className={cn("qm-custom-menu-sample", choice.sampleClass && `is-font-${choice.sampleClass}`)}>{choice.sample ?? choice.label.slice(0, 2)}</span>
              <span>{choice.label}</span>{value === choice.value ? <Check className="ms-auto size-3.5" /> : null}
            </button>
          </Fragment>
        })}</div> : null}
      </div>
    </Control>
  )
}
