import type { QueueMintPageDiagnostics } from "./types"

const MAX_ERRORS = 30
const MAX_NETWORK = 50

export async function installPageDiagnostics(tabId: number) {
  if (!chrome.scripting?.executeScript) return
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const key = "__QUEUEMINT_DIAGNOSTICS_V1__"
        const root = window as unknown as Record<string, unknown>
        if (root[key]) return
        const state = { startedAt: new Date().toISOString(), errors: [] as Array<Record<string, unknown>> }
        const push = (entry: Record<string, unknown>) => {
          state.errors.push(entry)
          if (state.errors.length > 60) state.errors.splice(0, state.errors.length - 60)
        }
        window.addEventListener("error", (event) => {
          const target = event.target
          if (target instanceof HTMLElement) {
            const source = (target as HTMLImageElement).currentSrc || (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || ""
            push({ kind: "resource", message: `Resource failed to load${source ? `: ${source}` : ""}`, source, capturedAt: new Date().toISOString() })
            return
          }
          push({ kind: "runtime", message: event.message || "Runtime error", source: event.filename || "", line: event.lineno || undefined, column: event.colno || undefined, capturedAt: new Date().toISOString() })
        }, true)
        window.addEventListener("unhandledrejection", (event) => {
          const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "Unhandled promise rejection")
          push({ kind: "promise", message: reason.slice(0, 1200), capturedAt: new Date().toISOString() })
        })
        root[key] = state
      },
    })
  } catch {
    // Restricted pages can reject injection. Capture still works without diagnostics.
  }
}

export async function collectPageDiagnostics(tabId: number): Promise<QueueMintPageDiagnostics | null> {
  if (!chrome.scripting?.executeScript) return null
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const key = "__QUEUEMINT_DIAGNOSTICS_V1__"
        const root = window as unknown as Record<string, unknown>
        const state = root[key] as { startedAt?: string; errors?: Array<Record<string, unknown>> } | undefined
        const resources = performance.getEntriesByType("resource").slice(-80).map((entry) => {
          const resource = entry as PerformanceResourceTiming & { responseStatus?: number }
          return {
            name: resource.name,
            initiatorType: resource.initiatorType || "resource",
            durationMs: Math.round(resource.duration),
            transferSize: resource.transferSize || undefined,
            responseStatus: typeof resource.responseStatus === "number" && resource.responseStatus > 0 ? resource.responseStatus : undefined,
          }
        })
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
        return {
          collectedAt: new Date().toISOString(),
          collectorStartedAt: state?.startedAt,
          errors: state?.errors ?? [],
          network: resources,
          navigation: navigation ? {
            type: navigation.type,
            domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
            loadMs: Math.round(navigation.loadEventEnd),
            transferSize: navigation.transferSize || undefined,
          } : undefined,
        }
      },
    })
    const value = results[0]?.result as QueueMintPageDiagnostics | undefined
    if (!value) return null
    return {
      ...value,
      errors: value.errors.slice(-MAX_ERRORS),
      network: value.network.slice(-MAX_NETWORK),
    }
  } catch {
    return null
  }
}

export function diagnosticsSummary(value: QueueMintPageDiagnostics | null) {
  if (!value) return { errors: 0, failedRequests: 0, requests: 0 }
  return {
    errors: value.errors.length,
    failedRequests: value.network.filter((item) => typeof item.responseStatus === "number" && item.responseStatus >= 400).length,
    requests: value.network.length,
  }
}

export function formatDiagnosticsText(value: QueueMintPageDiagnostics) {
  const rows: string[] = ["QueueMint diagnostics", `Collected: ${new Date(value.collectedAt).toLocaleString()}`]
  if (value.navigation) {
    rows.push(`Navigation: ${value.navigation.type ?? "navigate"}, DOM ${value.navigation.domContentLoadedMs ?? "?"}ms, load ${value.navigation.loadMs ?? "?"}ms`)
  }
  if (value.errors.length) {
    rows.push("", `Runtime/resource errors (${value.errors.length}):`)
    for (const item of value.errors.slice(-12)) rows.push(`- [${item.kind}] ${item.message}${item.source ? ` (${item.source})` : ""}`)
  }
  const failed = value.network.filter((item) => typeof item.responseStatus === "number" && item.responseStatus >= 400)
  if (failed.length) {
    rows.push("", `Failed network entries (${failed.length}):`)
    for (const item of failed.slice(-12)) rows.push(`- ${item.responseStatus} ${item.initiatorType}: ${item.name}`)
  } else {
    rows.push("", `Recent network entries captured: ${value.network.length}`)
  }
  return rows.join("\n")
}
