export interface QueueMintPageContext {
  tabId: number
  windowId: number
  url: string
  title: string
  hostname: string
  capturedAt: string
  viewportWidth?: number
  viewportHeight?: number
  documentWidth?: number
  documentHeight?: number
  scrollX?: number
  scrollY?: number
  devicePixelRatio?: number
  selection?: string
  userAgent?: string
}

export interface QueueMintCaptureResult {
  dataUrl: string
  context: QueueMintPageContext
}

interface BrowserPageDetails {
  viewportWidth?: number
  viewportHeight?: number
  documentWidth?: number
  documentHeight?: number
  scrollX?: number
  scrollY?: number
  devicePixelRatio?: number
  selection?: string
  userAgent?: string
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname
  } catch {
    return ""
  }
}

function assertCapturableTab(tab: chrome.tabs.Tab | null): asserts tab is chrome.tabs.Tab & { id: number; windowId: number } {
  if (!tab || typeof tab.id !== "number" || typeof tab.windowId !== "number") throw new Error("No active browser tab was found.")
  const url = tab.url ?? ""
  if (!/^(https?:|file:)/i.test(url)) {
    throw new Error("Chrome does not allow screenshots of this browser page. Open a normal website and retry.")
  }
}

async function readPageDetails(tabId: number): Promise<BrowserPageDetails> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
        documentHeight: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0),
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        devicePixelRatio: window.devicePixelRatio,
        selection: window.getSelection()?.toString().trim().slice(0, 1200) || undefined,
        userAgent: navigator.userAgent,
      }),
    })
    return results[0]?.result ?? {}
  } catch {
    return {}
  }
}

function makeContext(tab: chrome.tabs.Tab & { id: number; windowId: number }, details: BrowserPageDetails): QueueMintPageContext {
  const url = tab.url ?? ""
  return {
    tabId: tab.id,
    windowId: tab.windowId,
    url,
    title: tab.title ?? "Untitled page",
    hostname: hostnameFromUrl(url),
    capturedAt: new Date().toISOString(),
    ...details,
  }
}

function loadImage(value: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("The captured screenshot could not be decoded."))
    image.src = value
  })
}

async function setPageScroll(tabId: number, x: number, y: number, hideFixed: boolean) {
  await chrome.scripting.executeScript({
    target: { tabId },
    args: [x, y, hideFixed],
    func: async (nextX: number, nextY: number, shouldHideFixed: boolean) => {
      const marker = "data-queuemint-fixed-visibility"
      if (shouldHideFixed) {
        for (const element of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
          if (getComputedStyle(element).position !== "fixed" || element.hasAttribute(marker)) continue
          element.setAttribute(marker, element.style.visibility || "__empty__")
          element.style.setProperty("visibility", "hidden", "important")
        }
      }
      window.scrollTo(nextX, nextY)
      await new Promise((resolve) => window.setTimeout(resolve, 550))
    },
  })
}

async function restorePageAfterFullCapture(tabId: number, x: number, y: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      args: [x, y],
      func: (originalX: number, originalY: number) => {
        const marker = "data-queuemint-fixed-visibility"
        for (const element of Array.from(document.querySelectorAll<HTMLElement>(`[${marker}]`))) {
          const previous = element.getAttribute(marker)
          element.removeAttribute(marker)
          if (previous === "__empty__" || previous === null) element.style.removeProperty("visibility")
          else element.style.visibility = previous
        }
        window.scrollTo(originalX, originalY)
      },
    })
  } catch {
    // Navigation during capture can make restoration impossible. Nothing else to do.
  }
}

export async function getActiveBrowserTab() {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) return null
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs[0] ?? null
}

async function getBrowserTab(tabId?: number | null) {
  if (typeof tabId === "number") {
    try { return await chrome.tabs.get(tabId) } catch { throw new Error("The page linked to this capture session is no longer open. Reset the session or reopen QueueMint on the page you want to capture.") }
  }
  return getActiveBrowserTab()
}

async function withTabActive<T>(tab: chrome.tabs.Tab & { id: number }, task: () => Promise<T>) {
  const previous = await getActiveBrowserTab()
  const restoreId = previous?.id !== tab.id ? previous?.id : null
  if (restoreId) await chrome.tabs.update(tab.id, { active: true })
  try { return await task() } finally {
    if (restoreId) { try { await chrome.tabs.update(restoreId, { active: true }) } catch { /* previous tab closed */ } }
  }
}

export async function captureVisiblePage(tabId?: number | null): Promise<QueueMintCaptureResult> {
  if (typeof chrome === "undefined" || !chrome.tabs?.captureVisibleTab) {
    throw new Error("Chrome capture APIs are unavailable.")
  }

  const tab = await getBrowserTab(tabId)
  assertCapturableTab(tab)
  return withTabActive(tab, async () => {
    const details = await readPageDetails(tab.id)
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" })
    if (!dataUrl) throw new Error("Chrome returned an empty screenshot.")
    return { dataUrl, context: makeContext(tab, details) }
  })
}

export async function captureFullPage(tabId?: number | null): Promise<QueueMintCaptureResult> {
  if (typeof chrome === "undefined" || !chrome.tabs?.captureVisibleTab || !chrome.scripting?.executeScript) {
    throw new Error("Chrome full-page capture APIs are unavailable.")
  }

  const tab = await getBrowserTab(tabId)
  assertCapturableTab(tab)
  return withTabActive(tab, async () => {
  const details = await readPageDetails(tab.id)
  const viewportWidth = Math.max(1, Math.round(details.viewportWidth ?? 0))
  const viewportHeight = Math.max(1, Math.round(details.viewportHeight ?? 0))
  const documentHeight = Math.max(viewportHeight, Math.round(details.documentHeight ?? viewportHeight))
  const originalX = Math.round(details.scrollX ?? 0)
  const originalY = Math.round(details.scrollY ?? 0)

  if (!viewportWidth || !viewportHeight) throw new Error("This page did not expose usable viewport dimensions.")
  if (documentHeight > 18000) {
    throw new Error("This page is too tall for a safe full-page capture. Use visible-area capture and crop instead.")
  }

  const positions: number[] = []
  for (let y = 0; y < documentHeight; y += viewportHeight) positions.push(Math.min(y, Math.max(0, documentHeight - viewportHeight)))
  const uniquePositions = Array.from(new Set(positions))
  const tiles: Array<{ y: number; image: HTMLImageElement }> = []

  try {
    for (let index = 0; index < uniquePositions.length; index += 1) {
      const y = uniquePositions[index]
      await setPageScroll(tab.id, originalX, y, index > 0)
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" })
      if (!dataUrl) throw new Error("Chrome returned an empty screenshot while capturing the page.")
      const image = await loadImage(dataUrl)
      if (index === 0) {
        const estimatedScale = image.width / viewportWidth
        const estimatedPixels = image.width * Math.round(documentHeight * estimatedScale)
        if (estimatedPixels > 32_000_000) {
          throw new Error("The full-page screenshot would be too large. Use visible-area capture instead.")
        }
      }
      tiles.push({ y, image })
    }
  } finally {
    await restorePageAfterFullCapture(tab.id, originalX, originalY)
  }

  if (!tiles.length) throw new Error("No screenshot tiles were captured.")
  const scale = tiles[0].image.width / viewportWidth
  const outputWidth = tiles[0].image.width
  const outputHeight = Math.max(1, Math.round(documentHeight * scale))
  if (outputWidth * outputHeight > 32_000_000) {
    throw new Error("The full-page screenshot would be too large. Use visible-area capture instead.")
  }

  const canvas = document.createElement("canvas")
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not allocate a canvas for the full-page screenshot.")

  for (const tile of tiles) {
    const destinationY = Math.round(tile.y * scale)
    ctx.drawImage(tile.image, 0, destinationY)
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    context: makeContext(tab, { ...details, scrollX: originalX, scrollY: originalY }),
  }
  })
}

export function captureContextText(context: QueueMintPageContext) {
  const rows = [
    `URL: ${context.url}`,
    `Page: ${context.title}`,
    context.viewportWidth && context.viewportHeight ? `Viewport: ${context.viewportWidth}x${context.viewportHeight}` : "",
    context.documentWidth && context.documentHeight ? `Document: ${context.documentWidth}x${context.documentHeight}` : "",
    context.devicePixelRatio ? `Device pixel ratio: ${context.devicePixelRatio}` : "",
    `Captured: ${new Date(context.capturedAt).toLocaleString()}`,
    context.userAgent ? `Browser: ${context.userAgent}` : "",
    context.selection ? `Selected text: ${context.selection}` : "",
  ].filter(Boolean)

  return rows.join("\n")
}

export function screenshotFilename(context?: QueueMintPageContext) {
  const host = (context?.hostname || "page").replace(/[^a-z0-9.-]+/gi, "-").replace(/^-+|-+$/g, "") || "page"
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  return `queuemint-capture-${host}-${stamp}.png`
}
