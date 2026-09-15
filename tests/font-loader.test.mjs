import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { SHADCN_FONT_VALUES } from "../src/features/customization/font-options.ts"

const loader = readFileSync(new URL("../src/features/customization/font-loader.ts", import.meta.url), "utf8")

function expectedGoogleFamily(value) {
  const match = loader.match(new RegExp(`\\["${value}",\\s*"([^"]+)"\\]`))
  return match?.[1] ?? null
}

test("every shadcn font is wired to the on-demand Google Fonts loader", () => {
  assert.equal(SHADCN_FONT_VALUES.length, 26)
  assert.match(loader, /\.\.\.SHADCN_FONT_CHOICES\.map/)
  assert.match(loader, /https:\/\/fonts\.googleapis\.com\/css2\?family=/)
})

test("Persian and Arabic font sources are explicit and version-pinned", () => {
  assert.equal(expectedGoogleFamily("vazirmatn"), "Vazirmatn")
  assert.equal(expectedGoogleFamily("naskh"), "Noto Naskh Arabic")
  assert.equal(expectedGoogleFamily("lalezar"), "Lalezar")
  assert.match(loader, /samim-font@1941b5189935c9458806e96b4b6354c478a9e342/)
  assert.match(loader, /shabnam-font@6155d4d7c1cb3cd3f9c3e028c62226d12c36e7e9/)
  assert.match(loader, /sahel-font@52ffbf9a00d395fdeab9fbd0dd446f31dcbef9c8/)
  assert.match(loader, /Mikhak@9dea055eb3dfc752879442224460c6e5d6ebe232/)
  assert.match(loader, /locale === "fa"/)
  assert.match(loader, /bodyFont === "rounded" \|\| headingFont === "rounded"/)
  assert.match(loader, /bodyFont === "serif" \|\| headingFont === "serif"/)
})
