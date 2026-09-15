import assert from "node:assert/strict"
import test from "node:test"

import {
  buildAppearancePreset,
  DEFAULT_APPEARANCE,
  parseAppearancePreset,
  sanitizeAppearanceSettings,
} from "../src/features/customization/appearance-preset.ts"
import { SHADCN_FONT_VALUES } from "../src/features/customization/font-options.ts"

test("appearance settings keep supported live customization values", () => {
  const settings = sanitizeAppearanceSettings({
    theme: "dark",
    accentColor: "#2563eb",
    neutralTone: "slate",
    density: "compact",
    radius: "large",
    bodyFont: "geometric",
    headingFont: "humanist",
    sidebarStyle: "solid",
    sidebarAccent: "filled",
    surfaceStyle: "raised",
    reviewLayout: "grid",
    gridColumns: 4,
  })

  assert.deepEqual(settings, {
    theme: "dark",
    accentColor: "#2563eb",
    neutralTone: "slate",
    density: "compact",
    radius: "large",
    bodyFont: "geometric",
    headingFont: "humanist",
    sidebarStyle: "solid",
    sidebarAccent: "filled",
    surfaceStyle: "raised",
    reviewLayout: "grid",
    gridColumns: 4,
  })
})

test("invalid appearance values fall back to safe defaults", () => {
  const settings = sanitizeAppearanceSettings({
    theme: "neon",
    accentColor: "javascript:alert(1)",
    neutralTone: "rainbow",
    density: "tiny",
    radius: "roundest",
    gridColumns: 99,
  })

  assert.deepEqual(settings, DEFAULT_APPEARANCE)
})

test("portable appearance preset round trips and rejects unrelated json", () => {
  const preset = buildAppearancePreset({ ...DEFAULT_APPEARANCE, accentColor: "#be123c", surfaceStyle: "raised" })
  assert.equal(preset.kind, "queuemint-appearance-preset")
  assert.equal(preset.schemaVersion, 1)
  assert.equal(parseAppearancePreset(preset).accentColor, "#be123c")
  assert.equal(parseAppearancePreset(preset).surfaceStyle, "raised")
  assert.throws(() => parseAppearancePreset({ kind: "other", schemaVersion: 1, settings: {} }))
})

test("Persian and Arabic font choices survive sanitization", () => {
  for (const bodyFont of ["vazirmatn", "mikhak", "samim", "shabnam", "sahel", "naskh"]) {
    assert.equal(sanitizeAppearanceSettings({ ...DEFAULT_APPEARANCE, bodyFont }).bodyFont, bodyFont)
  }
  for (const headingFont of ["vazirmatn", "mikhak", "samim", "shabnam", "sahel", "naskh", "lalezar"]) {
    assert.equal(sanitizeAppearanceSettings({ ...DEFAULT_APPEARANCE, headingFont }).headingFont, headingFont)
  }
})


test("the complete shadcn font menu survives appearance sanitization", () => {
  assert.equal(SHADCN_FONT_VALUES.length, 26)
  for (const font of SHADCN_FONT_VALUES) {
    assert.equal(sanitizeAppearanceSettings({ ...DEFAULT_APPEARANCE, bodyFont: font }).bodyFont, font)
    assert.equal(sanitizeAppearanceSettings({ ...DEFAULT_APPEARANCE, headingFont: font }).headingFont, font)
  }
})

test("expanded neutral tone library survives appearance sanitization", () => {
  for (const neutralTone of ["mist", "slate", "zinc", "gray", "neutral", "stone", "sand", "paper"]) {
    assert.equal(sanitizeAppearanceSettings({ ...DEFAULT_APPEARANCE, neutralTone }).neutralTone, neutralTone)
  }
})
