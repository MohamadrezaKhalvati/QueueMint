export interface CaptureSourceCandidate {
  tabId: number
  url: string
  title: string
}

interface BrowserTabLike {
  id?: number
  url?: string
  title?: string
}

export function captureSourceFromTab(tab: BrowserTabLike | null | undefined): CaptureSourceCandidate | null {
  if (!tab || typeof tab.id !== "number") return null
  const url = tab.url ?? ""
  if (!/^(https?:|file:)/i.test(url)) return null
  return { tabId: tab.id, url, title: tab.title ?? "" }
}

export function shouldRebindCaptureSource(current: CaptureSourceCandidate | null | undefined, next: CaptureSourceCandidate) {
  return !current
    || current.tabId !== next.tabId
    || current.url !== next.url
    || current.title !== next.title
}
