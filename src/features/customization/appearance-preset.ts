import type {
  AppTheme,
  BodyFontMode,
  DensityMode,
  HeadingFontMode,
  NeutralTone,
  RadiusMode,
  ReviewLayout,
  SidebarAccentMode,
  SidebarStyle,
  SurfaceStyle,
} from "@/types"


function foregroundForHex(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return "#ffffff"
  const value = Number.parseInt(match[1], 16)
  const srgb = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? "#ffffff" : "#111827"
}

function accentForDarkMode(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return hex
  const value = Number.parseInt(match[1], 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  const mixed = channels.map((channel) => Math.round(channel + (255 - channel) * 0.2))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

export const ACCENT_PRESETS = ["#0f766e", "#0891b2", "#2563eb", "#4f46e5", "#7c3aed", "#be123c", "#dc2626", "#c2410c"]

export interface AppearanceSettings {
  theme: AppTheme
  accentColor: string
  neutralTone: NeutralTone
  density: DensityMode
  radius: RadiusMode
  bodyFont: BodyFontMode
  headingFont: HeadingFontMode
  sidebarStyle: SidebarStyle
  sidebarAccent: SidebarAccentMode
  surfaceStyle: SurfaceStyle
  reviewLayout: ReviewLayout
  gridColumns: 2 | 3 | 4
}

export interface PortableAppearancePreset {
  kind: "queuemint-appearance-preset"
  schemaVersion: 1
  exportedAt: string
  settings: AppearanceSettings
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "system",
  accentColor: "#0f766e",
  neutralTone: "mist",
  density: "comfortable",
  radius: "medium",
  bodyFont: "system",
  headingFont: "system",
  sidebarStyle: "soft",
  sidebarAccent: "subtle",
  surfaceStyle: "bordered",
  reviewLayout: "board",
  gridColumns: 3,
}

const OPTIONS = {
  theme: ["light", "dark", "system"],
  neutralTone: ["mist", "slate", "zinc", "gray", "neutral", "stone", "sand", "paper"],
  density: ["compact", "comfortable", "spacious"],
  radius: ["none", "small", "medium", "large"],
  bodyFont: ["system", "humanist", "geometric", "rounded", "serif", "mono", "geist", "inter", "noto-sans", "nunito-sans", "figtree", "roboto", "raleway", "dm-sans", "public-sans", "outfit", "oxanium", "manrope", "space-grotesk", "montserrat", "ibm-plex-sans", "source-sans-3", "instrument-sans", "geist-mono", "jetbrains-mono", "noto-serif", "roboto-slab", "merriweather", "lora", "playfair-display", "eb-garamond", "instrument-serif", "vazirmatn", "mikhak", "samim", "shabnam", "sahel", "naskh"],
  headingFont: ["system", "display", "humanist", "geometric", "rounded", "serif", "mono", "geist", "inter", "noto-sans", "nunito-sans", "figtree", "roboto", "raleway", "dm-sans", "public-sans", "outfit", "oxanium", "manrope", "space-grotesk", "montserrat", "ibm-plex-sans", "source-sans-3", "instrument-sans", "geist-mono", "jetbrains-mono", "noto-serif", "roboto-slab", "merriweather", "lora", "playfair-display", "eb-garamond", "instrument-serif", "vazirmatn", "mikhak", "samim", "shabnam", "sahel", "naskh", "lalezar"],
  sidebarStyle: ["soft", "solid", "outline"],
  sidebarAccent: ["subtle", "filled"],
  surfaceStyle: ["flat", "bordered", "raised"],
  reviewLayout: ["board", "grid", "list"],
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function option<T extends readonly string[]>(value: unknown, values: T, fallback: T[number]): T[number] {
  return typeof value === "string" && values.includes(value as T[number]) ? value as T[number] : fallback
}

export function sanitizeAppearanceSettings(value: unknown): AppearanceSettings {
  const source = isRecord(value) ? value : {}
  return {
    theme: option(source.theme, OPTIONS.theme, DEFAULT_APPEARANCE.theme),
    accentColor: typeof source.accentColor === "string" && /^#[0-9a-f]{6}$/i.test(source.accentColor) ? source.accentColor : DEFAULT_APPEARANCE.accentColor,
    neutralTone: option(source.neutralTone, OPTIONS.neutralTone, DEFAULT_APPEARANCE.neutralTone),
    density: option(source.density, OPTIONS.density, DEFAULT_APPEARANCE.density),
    radius: option(source.radius, OPTIONS.radius, DEFAULT_APPEARANCE.radius),
    bodyFont: option(source.bodyFont, OPTIONS.bodyFont, DEFAULT_APPEARANCE.bodyFont),
    headingFont: option(source.headingFont, OPTIONS.headingFont, DEFAULT_APPEARANCE.headingFont),
    sidebarStyle: option(source.sidebarStyle, OPTIONS.sidebarStyle, DEFAULT_APPEARANCE.sidebarStyle),
    sidebarAccent: option(source.sidebarAccent, OPTIONS.sidebarAccent, DEFAULT_APPEARANCE.sidebarAccent),
    surfaceStyle: option(source.surfaceStyle, OPTIONS.surfaceStyle, DEFAULT_APPEARANCE.surfaceStyle),
    reviewLayout: option(source.reviewLayout, OPTIONS.reviewLayout, DEFAULT_APPEARANCE.reviewLayout),
    gridColumns: source.gridColumns === 2 || source.gridColumns === 3 || source.gridColumns === 4 ? source.gridColumns : DEFAULT_APPEARANCE.gridColumns,
  }
}

export function buildAppearancePreset(settings: AppearanceSettings): PortableAppearancePreset {
  return { kind: "queuemint-appearance-preset", schemaVersion: 1, exportedAt: new Date().toISOString(), settings: sanitizeAppearanceSettings(settings) }
}

export function parseAppearancePreset(value: unknown): AppearanceSettings {
  if (!isRecord(value) || value.kind !== "queuemint-appearance-preset" || value.schemaVersion !== 1) throw new Error("Unsupported QueueMint appearance preset.")
  return sanitizeAppearanceSettings(value.settings)
}

export function resolveAppearanceColors(settings: AppearanceSettings, systemDark = false) {
  const dark = settings.theme === "dark" || (settings.theme === "system" && systemDark)
  const accent = dark ? accentForDarkMode(settings.accentColor) : settings.accentColor
  return { dark, accent, foreground: foregroundForHex(accent) }
}

export function applyAppearancePreview(settings: AppearanceSettings) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
  const colors = resolveAppearanceColors(settings, Boolean(systemDark))
  root.classList.toggle("dark", colors.dark)
  root.style.setProperty("--primary", colors.accent)
  root.style.setProperty("--ring", colors.accent)
  root.style.setProperty("--primary-foreground", colors.foreground)
  root.dataset.density = settings.density
  root.dataset.radius = settings.radius
  root.dataset.tone = settings.neutralTone
  root.dataset.bodyFont = settings.bodyFont
  root.dataset.headingFont = settings.headingFont
  root.dataset.sidebarStyle = settings.sidebarStyle
  root.dataset.sidebarAccent = settings.sidebarAccent
  root.dataset.surface = settings.surfaceStyle
}

export function sameAppearance(left: AppearanceSettings, right: AppearanceSettings) {
  return JSON.stringify(left) === JSON.stringify(right)
}
