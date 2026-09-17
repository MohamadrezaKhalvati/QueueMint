import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

const assistant = fs.readFileSync(new URL("../src/features/worklog/useWorklogAssistant.ts", import.meta.url), "utf8")
const writer = fs.readFileSync(new URL("../src/lib/jira/worklogs.ts", import.meta.url), "utf8")
const sidebar = fs.readFileSync(new URL("../src/features/worklog/WorklogDraftSidebar.tsx", import.meta.url), "utf8")

test("Worklog Assistant resolves blank descriptions before Jira submission", () => {
  assert.match(assistant, /resolveWorklogComment\(entry, defaultComment\)/)
  assert.match(writer, /buildWorklogFallbackComment\(key\)/)
  assert.match(writer, /comment: safeComment/)
})

test("Worklog UI explains the generated description fallback", () => {
  assert.match(sidebar, /Default worklog description \(optional\)/)
  assert.match(sidebar, /QueueMint uses each issue key and summary as the worklog description/)
})
