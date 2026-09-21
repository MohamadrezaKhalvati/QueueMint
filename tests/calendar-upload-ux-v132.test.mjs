import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import { formatDateOnly, parseDateOnly } from "../src/lib/date-only.ts"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("popup due date uses the shared QueueMint calendar instead of the browser native date input", async () => {
  const [extra, datePicker] = await Promise.all([
    read("../src/features/popup/PopupIssueExtraFields.tsx"),
    read("../src/components/ui/date-picker.tsx"),
  ])
  assert.match(extra, /<DatePicker/)
  assert.match(extra, /formatDateOnly/)
  assert.match(extra, /parseDateOnly/)
  assert.doesNotMatch(extra, /type="date"/)
  assert.match(datePicker, /<Calendar/)
  assert.match(datePicker, /showToday/)
  assert.match(datePicker, /onClear/)
})

test("shared calendar supports direct month and year navigation", async () => {
  const calendar = await read("../src/components/ui/calendar.tsx")
  assert.match(calendar, /Previous month/)
  assert.match(calendar, /Next month/)
  assert.match(calendar, /Previous year/)
  assert.match(calendar, /Next year/)
  assert.match(calendar, /shiftMonth/)
  assert.match(calendar, /shiftYear/)
})

test("dynamic Jira date fields reuse the shared date picker", async () => {
  const editor = await read("../src/features/jira-manager/DynamicBulkFieldEditor.tsx")
  assert.match(editor, /if \(type === "date"\) return <DatePicker/)
  assert.doesNotMatch(editor, /type="date"/)
})

test("attachment picker uses a stable three-column upload trigger with narrow-width fallback", async () => {
  const [picker, responsiveCss] = await Promise.all([
    read("../src/components/attachment-picker.tsx"),
    read("../src/styles/app-15-theme-contract.css"),
  ])
  assert.match(picker, /data-slot="attachment-trigger"/)
  assert.match(picker, /grid-cols-\[40px_minmax\(0,1fr\)_32px\]/)
  assert.match(picker, /qm-upload-copy/)
  assert.match(picker, /qm-upload-add/)
  assert.match(responsiveCss, /@media \(max-width: 420px\)[\s\S]*\.qm-upload-add[\s\S]*display: none !important/)
})


test("date-only conversion preserves Jira YYYY-MM-DD values without UTC shifting", () => {
  const parsed = parseDateOnly("2026-09-21")
  assert.ok(parsed)
  assert.equal(parsed.getFullYear(), 2026)
  assert.equal(parsed.getMonth(), 8)
  assert.equal(parsed.getDate(), 21)
  assert.equal(formatDateOnly(parsed), "2026-09-21")
  assert.equal(parseDateOnly("2026-02-31"), undefined)
})
