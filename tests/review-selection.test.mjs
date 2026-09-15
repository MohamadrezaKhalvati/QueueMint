import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

import { selectedVisibleCount, setVisibleSelection } from "../src/features/review/review-selection.ts"

const reviewScreen = readFileSync(new URL("../src/features/review/ReviewScreen.tsx", import.meta.url), "utf8")
const reviewTable = readFileSync(new URL("../src/features/review/ReviewIssueTable.tsx", import.meta.url), "utf8")

test("review select all acts on visible issues and preserves hidden selections", () => {
  const current = new Set([0, 9])
  const visible = [1, 3, 5]
  const selected = setVisibleSelection(current, visible, true)
  assert.deepEqual([...selected].sort((a, b) => a - b), [0, 1, 3, 5, 9])
  assert.equal(selectedVisibleCount(selected, visible), 3)

  const cleared = setVisibleSelection(selected, visible, false)
  assert.deepEqual([...cleared].sort((a, b) => a - b), [0, 9])
})

test("review table owns select-all while cards and board keep the external selection action", () => {
  assert.match(reviewScreen, /reviewLayout !== "list"/)
  assert.match(reviewScreen, /<ReviewIssueTable/)
  assert.match(reviewTable, /SelectionCheckbox checked=\{allVisibleSelected\}/)
  assert.match(reviewTable, /indeterminate=\{someVisibleSelected && !allVisibleSelected\}/)
})
