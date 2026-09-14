import assert from "node:assert/strict"
import test from "node:test"

import { captureSourceFromTab, shouldRebindCaptureSource } from "../src/lib/capture-source.ts"

test("toolbar capture source follows the current capturable browser tab", () => {
  const first = captureSourceFromTab({ id: 10, url: "https://one.example/page", title: "One" })
  const second = captureSourceFromTab({ id: 20, url: "https://two.example/page", title: "Two" })
  assert.deepEqual(first, { tabId: 10, url: "https://one.example/page", title: "One" })
  assert.deepEqual(second, { tabId: 20, url: "https://two.example/page", title: "Two" })
  assert.equal(shouldRebindCaptureSource(first, second), true)
})

test("same tab navigation refreshes capture source metadata", () => {
  const current = { tabId: 10, url: "https://example.com/old", title: "Old" }
  const next = { tabId: 10, url: "https://example.com/new", title: "New" }
  assert.equal(shouldRebindCaptureSource(current, next), true)
})

test("unchanged source does not trigger a needless rebind", () => {
  const current = { tabId: 10, url: "https://example.com/page", title: "Page" }
  assert.equal(shouldRebindCaptureSource(current, { ...current }), false)
})

test("extension and browser-internal tabs cannot become capture sources", () => {
  assert.equal(captureSourceFromTab({ id: 1, url: "chrome://extensions", title: "Extensions" }), null)
  assert.equal(captureSourceFromTab({ id: 2, url: "chrome-extension://abc/popup.html", title: "QueueMint" }), null)
  assert.equal(captureSourceFromTab({ id: 3, url: "https://example.com", title: "Page" })?.tabId, 3)
})
