import type {
  GitHubConnection, GitHubCreateIssueInput, GitHubCreateIssueResult, GitHubPage, GitHubRepository, GitHubServiceErrorShape,
  GitHubIssueSummary,
} from "@/types"
import { GitHubProviderError } from "@/types"
import { mockGitHubProvider } from "./mock"

const SESSION_KEY = "queuemint-github-session-v1"
const REQUEST_TIMEOUT_MS = 12000

type ServiceEnvelope<T> = { data: T }
type AuthStart = { authorizationUrl: string; transactionId: string }
type AuthExchange = { session: string }

const env = ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {})
const serviceBaseUrl = (env.VITE_GITHUB_SERVICE_BASE_URL ?? "").trim().replace(/\/+$/, "")
const mockEnabled = env.DEV === "true" && env.VITE_GITHUB_PROVIDER_MOCK === "true"

function requireServiceUrl() {
  if (!serviceBaseUrl) throw new Error("VITE_GITHUB_SERVICE_BASE_URL is required for the GitHub service provider.")
  const url = new URL(serviceBaseUrl)
  if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
    throw new Error("GitHub service must use HTTPS outside localhost.")
  }
  return url
}

async function getSession() {
  if (typeof chrome === "undefined" || !chrome.storage?.session) return undefined
  const result = await chrome.storage.session.get(SESSION_KEY)
  return typeof result?.[SESSION_KEY] === "string" ? result[SESSION_KEY] as string : undefined
}

async function setSession(value?: string) {
  if (typeof chrome === "undefined" || !chrome.storage?.session) return
  if (value) await chrome.storage.session.set({ [SESSION_KEY]: value })
  else await chrome.storage.session.remove(SESSION_KEY)
}

async function ensureServicePermission(url: URL) {
  if (typeof chrome === "undefined" || !chrome.permissions?.request) return
  const originPattern = `${url.origin}/*`
  const alreadyAllowed = await chrome.permissions.contains({ origins: [originPattern] })
  if (alreadyAllowed) return
  const granted = await chrome.permissions.request({ origins: [originPattern] })
  if (!granted) throw new Error("GitHub service permission was not granted.")
}

async function serviceRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const base = requireServiceUrl()
  const session = authenticated ? await getSession() : undefined
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${base.origin}${base.pathname.replace(/\/$/, "")}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(session ? { authorization: `Bearer ${session}` } : {}),
        ...init.headers,
      },
    })
    const payload = await response.json().catch(() => null) as ServiceEnvelope<T> | { error?: GitHubServiceErrorShape } | null
    if (!response.ok) {
      const error = payload && "error" in payload ? payload.error : undefined
      throw new GitHubProviderError(error ?? { code: "UPSTREAM_UNAVAILABLE", message: `GitHub service returned HTTP ${response.status}.` })
    }
    if (!payload || !("data" in payload)) throw new Error("GitHub service returned an invalid response.")
    return payload.data
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new GitHubProviderError({ code: "UPSTREAM_UNAVAILABLE", message: "GitHub service request timed out." })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

async function connectService(): Promise<GitHubConnection> {
  if (typeof chrome === "undefined" || !chrome.identity?.launchWebAuthFlow) {
    throw new Error("Chrome identity API is unavailable.")
  }
  const base = requireServiceUrl()
  await ensureServicePermission(base)
  const redirectUrl = chrome.identity.getRedirectURL("github")
  const started = await serviceRequest<AuthStart>("/v1/auth/github/start", {
    method: "POST",
    body: JSON.stringify({ redirectUrl }),
  }, false)
  const callbackUrl = await chrome.identity.launchWebAuthFlow({ url: started.authorizationUrl, interactive: true })
  if (!callbackUrl) throw new Error("GitHub authorization was cancelled.")
  const callback = new URL(callbackUrl)
  const grant = callback.searchParams.get("grant")
  const transactionId = callback.searchParams.get("transactionId")
  if (!grant || transactionId !== started.transactionId) throw new Error("GitHub authorization callback could not be verified.")
  const exchanged = await serviceRequest<AuthExchange>("/v1/auth/github/exchange", {
    method: "POST",
    body: JSON.stringify({ grant, transactionId, redirectUrl }),
  }, false)
  await setSession(exchanged.session)
  return serviceRequest<GitHubConnection>("/v1/github/connection")
}

const serviceProvider = {
  connect: connectService,
  async disconnect() {
    try { await serviceRequest<void>("/v1/auth/github/disconnect", { method: "POST", body: "{}" }) }
    finally { await setSession(undefined) }
  },
  connection: () => serviceRequest<GitHubConnection>("/v1/github/connection"),
  repositories: () => serviceRequest<GitHubPage<GitHubRepository>>("/v1/github/repositories"),
  issues: (repositoryId: number) => serviceRequest<GitHubPage<GitHubIssueSummary>>(`/v1/github/repositories/${repositoryId}/issues?state=open`),
  createIssue: (repositoryId: number, input: GitHubCreateIssueInput) => serviceRequest<GitHubCreateIssueResult>(
    `/v1/github/repositories/${repositoryId}/issues`,
    { method: "POST", body: JSON.stringify(input) },
  ),
}

export const githubProvider = mockEnabled ? mockGitHubProvider : serviceProvider

export const githubProviderRuntime = {
  mode: mockEnabled ? "mock" as const : "service" as const,
  serviceConfigured: Boolean(serviceBaseUrl),
}
