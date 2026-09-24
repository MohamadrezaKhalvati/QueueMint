import assert from "node:assert/strict"
import test from "node:test"

import { formatValidBulkJson } from "../src/lib/validation.ts"

test("formats a valid pasted bulk JSON document", () => {
  assert.equal(formatValidBulkJson('{"project":"DEMO","issues":[]}'), '{\n  "project": "DEMO",\n  "issues": []\n}')
})

test("does not format invalid or partial pasted JSON", () => {
  assert.equal(formatValidBulkJson('{"project":"DEMO"'), undefined)
  assert.equal(formatValidBulkJson('{"project":"DEMO"} trailing'), undefined)
})
