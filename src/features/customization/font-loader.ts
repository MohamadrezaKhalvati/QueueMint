import type { AppLocale, BodyFontMode, HeadingFontMode } from "@/types"
import { SHADCN_FONT_CHOICES } from "./font-options"

const googleFamilies = new Map<string, string>([
  ...SHADCN_FONT_CHOICES.map((font) => [font.value, font.label] as const),
  ["vazirmatn", "Vazirmatn"],
  ["naskh", "Noto Naskh Arabic"],
  ["lalezar", "Lalezar"],
])

const stylesheetByFont: Record<string, string> = {
  samim: "https://cdn.jsdelivr.net/gh/rastikerdar/samim-font@1941b5189935c9458806e96b4b6354c478a9e342/dist/font-face.css",
  shabnam: "https://cdn.jsdelivr.net/gh/rastikerdar/shabnam-font@6155d4d7c1cb3cd3f9c3e028c62226d12c36e7e9/dist/font-face.css",
  sahel: "https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@52ffbf9a00d395fdeab9fbd0dd446f31dcbef9c8/dist/font-face.css",
}

const mikhakUrl = "https://cdn.jsdelivr.net/gh/aminabedi68/Mikhak@9dea055eb3dfc752879442224460c6e5d6ebe232/fonts/webfonts/variable/Mikhak%5BDSTY%2CKSHD%2Cwght%5D.woff2"
const regularOnly = new Set(["instrument-serif", "lalezar"])
const loaded = new Set<string>()

export function fontStylesheetUrl(value: string) {
  if (stylesheetByFont[value]) return stylesheetByFont[value]
  const family = googleFamilies.get(value)
  if (!family) return null
  const queryFamily = family.replaceAll(" ", "+")
  const weights = regularOnly.has(value) ? "" : ":wght@400;500;600;700"
  return `https://fonts.googleapis.com/css2?family=${queryFamily}${weights}&display=swap`
}

export function appearanceFontRequests(locale: AppLocale, bodyFont: BodyFontMode, headingFont: HeadingFontMode) {
  const values = new Set<string>([bodyFont, headingFont])
  if (locale === "fa") {
    values.add("vazirmatn")
    if (bodyFont === "rounded" || headingFont === "rounded") values.add("mikhak")
    if (bodyFont === "serif" || headingFont === "serif") values.add("naskh")
  }
  return Array.from(values).filter((value) => value === "mikhak" || Boolean(fontStylesheetUrl(value)))
}

export function ensureAppearanceFonts(locale: AppLocale, bodyFont: BodyFontMode, headingFont: HeadingFontMode) {
  if (typeof document === "undefined") return
  for (const value of appearanceFontRequests(locale, bodyFont, headingFont)) ensureFont(value)
}

function ensureFont(value: string) {
  if (loaded.has(value) || document.querySelector(`[data-qm-font-source="${value}"]`)) return
  loaded.add(value)
  if (value === "mikhak") {
    const style = document.createElement("style")
    style.dataset.qmFontSource = value
    style.textContent = `@font-face{font-family:"Mikhak";src:url("${mikhakUrl}") format("woff2");font-style:normal;font-weight:100 900;font-display:swap;}`
    document.head.append(style)
    return
  }
  const href = fontStylesheetUrl(value)
  if (!href) return
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.referrerPolicy = "no-referrer"
  link.href = href
  link.dataset.qmFontSource = value
  document.head.append(link)
}
