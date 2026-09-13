import type { JiraConnectionStatus, JiraRequestResponse } from "@/types"

let jiraOrigin = ""

function normalizeJiraOrigin(value: string) {
  const url = new URL(value)
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Jira URL must use http or https.")
  return url.origin
}

function hostPermissionPattern(origin: string) {
  const url = new URL(origin)
  return `${url.protocol}//${url.hostname}/*`
}

export function getJiraOrigin() { return jiraOrigin }

export async function getJiraConnectionStatus(): Promise<JiraConnectionStatus> {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) return { configured: false, tabs: [] }
  const status = (await chrome.runtime.sendMessage({ type: "QUEUEMINT_JIRA_GET_STATUS" })) as JiraConnectionStatus
  if (status?.origin) jiraOrigin = status.origin
  return status ?? { configured: false, tabs: [] }
}

export async function configureJiraConnection(value: string, tabId?: number) {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) throw new Error("Chrome extension APIs are unavailable.")
  const origin = normalizeJiraOrigin(value)
  const granted = await chrome.permissions.request({ origins: [hostPermissionPattern(origin)] })
  if (!granted) throw new Error("Jira site permission was not granted.")
  const response = (await chrome.runtime.sendMessage({ type: "QUEUEMINT_JIRA_CONFIGURE", origin, tabId })) as { ok?: boolean; status?: JiraConnectionStatus; error?: { message?: string } }
  if (!response?.ok) throw new Error(response?.error?.message ?? "Could not configure Jira connection.")
  jiraOrigin = origin
  return response.status ?? getJiraConnectionStatus()
}

export async function selectJiraTab(tabId: number) {
  const response = (await chrome.runtime.sendMessage({ type: "QUEUEMINT_JIRA_SELECT_TAB", tabId })) as { ok?: boolean; status?: JiraConnectionStatus; error?: { message?: string } }
  if (!response?.ok) throw new Error(response?.error?.message ?? "Could not switch Jira tab.")
  if (response.status?.origin) jiraOrigin = response.status.origin
  return response.status as JiraConnectionStatus
}

export async function sendJiraRequest<T>(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: unknown) {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) throw new Error("Chrome extension APIs are unavailable. Load the built dist folder as an unpacked extension.")
  const response = (await chrome.runtime.sendMessage({ type: "QUEUEMINT_JIRA_REQUEST", request: { path, method, body: body ?? null } })) as JiraRequestResponse<T>
  if (!response?.ok) throw new Error(response?.error?.message ?? "Jira request failed.")
  return response.data as T
}

const avatarDataUrlCache = new Map<string, Promise<string | null>>()

export async function getJiraAvatarDataUrl(value: string) {
  if (!value || typeof chrome === "undefined" || !chrome.runtime?.id) return null
  const cached = avatarDataUrlCache.get(value)
  if (cached) return cached
  const request = (async () => {
    const response = (await chrome.runtime.sendMessage({ type: "QUEUEMINT_JIRA_FETCH_AVATAR", url: value })) as JiraRequestResponse<{ dataUrl?: string }>
    if (!response?.ok) return null
    return typeof response.data?.dataUrl === "string" ? response.data.dataUrl : null
  })().catch(() => null)
  avatarDataUrlCache.set(value, request)
  return request
}

export async function openJira() {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) throw new Error("Chrome extension APIs are unavailable. Load the built dist folder as an unpacked extension.")
  await chrome.runtime.sendMessage({ type: "QUEUEMINT_OPEN_JIRA" })
}

export function jiraBrowseUrl(issueKey: string) {
  return `${jiraOrigin || "#"}/browse/${encodeURIComponent(issueKey)}`
}
