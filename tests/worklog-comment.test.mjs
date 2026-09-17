import assert from "node:assert/strict"
import test from "node:test"

import { buildWorklogFallbackComment, resolveWorklogComment } from "../src/lib/worklog-comment.ts"

test("blank worklogs receive an issue-specific fallback description", () => {
  assert.equal(
    buildWorklogFallbackComment("RCRM-115", "Run live mailbox provider acceptance"),
    "Worked on RCRM-115: Run live mailbox provider acceptance",
  )
  assert.equal(buildWorklogFallbackComment("RCRM-60", ""), "Worked on issue RCRM-60")
  assert.equal(resolveWorklogComment({ issueKey: "RCRM-60", summary: "Connect mails", comment: "undefined" }), "Worked on RCRM-60: Connect mails")
})

test("worklog description precedence is per-issue then shared then generated fallback", () => {
  const entry = { issueKey: "RCRM-98", summary: "Add Sales Operations MCP parity", comment: "  Verified MCP parity  " }
  assert.equal(resolveWorklogComment(entry, "Shared note"), "Verified MCP parity")
  assert.equal(resolveWorklogComment({ ...entry, comment: "" }, "  Shared implementation work  "), "Shared implementation work")
  assert.equal(
    resolveWorklogComment({ ...entry, comment: "" }, ""),
    "Worked on RCRM-98: Add Sales Operations MCP parity",
  )
})
