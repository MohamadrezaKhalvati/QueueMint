import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import test from "node:test"

const root = new URL("../src/", import.meta.url)

function files(directory, extension) {
  const absolute = new URL(directory, root)
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => path.join(entry.parentPath, entry.name))
}

test("production TSX has no legacy fixed Tailwind corner-radius utilities", () => {
  const legacy = /(?:^|\s)rounded-(?:sm|md|lg|xl|2xl|3xl)(?=\s|["'`])/m
  for (const file of files("./", ".tsx")) {
    const text = readFileSync(file, "utf8")
    assert.doesNotMatch(text, legacy, `${file} should use QueueMint radius tokens`)
  }
})

test("production CSS has no fixed pixel radius except intentional circles and pills", () => {
  const fixed = /border-radius:\s*(?!999px)(\d+)px/g
  for (const file of files("./", ".css")) {
    const text = readFileSync(file, "utf8")
    assert.equal([...text.matchAll(fixed)].length, 0, `${file} should use QueueMint radius tokens`)
  }
})


test("non-semantic UI colors use QueueMint semantic tokens", () => {
  const fixedPalette = /\b(?:bg|text|border|ring|fill)-(?:blue|sky|indigo|violet|purple|fuchsia|pink|rose|red|orange|amber|yellow|lime|green|emerald|teal|cyan|stone|neutral|zinc|gray|slate)-\d{2,3}\b/g
  const allowed = new Set(["priority.tsx", "sheet.tsx"])
  for (const file of files("./", ".tsx")) {
    if (allowed.has(path.basename(file))) continue
    const text = readFileSync(file, "utf8")
    assert.equal([...text.matchAll(fixedPalette)].length, 0, `${file} should use primary/muted/success/warning/destructive tokens`)
  }
})

test("Rounded typography preset stays a font value, not a Tailwind radius class", () => {
  const controls = readFileSync(new URL("../src/features/customization/CustomizationControls.tsx", import.meta.url), "utf8")
  const screen = readFileSync(new URL("../src/features/customization/CustomizationScreen.tsx", import.meta.url), "utf8")
  assert.match(controls, /value: "rounded", label: tx\.rounded/)
  assert.match(screen, /"geometric", "rounded", "serif"/)
  assert.doesNotMatch(controls, /value: "rounded-\[var/)
  assert.doesNotMatch(screen, /"rounded-\[var/)
})

test("font delivery CSP cannot execute remote scripts", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.json", import.meta.url), "utf8"))
  const csp = manifest.content_security_policy?.extension_pages ?? ""
  assert.match(csp, /script-src 'self'/)
  assert.doesNotMatch(csp, /script-src[^;]*https?:/)
  assert.match(csp, /style-src[^;]*https:\/\/fonts\.googleapis\.com/)
  assert.match(csp, /font-src[^;]*https:\/\/fonts\.gstatic\.com/)
  assert.match(csp, /https:\/\/cdn\.jsdelivr\.net/)
})
