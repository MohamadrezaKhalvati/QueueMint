import type { GitHubCreateIssueInput } from "@/types"

const CONTEXT_KEY = "queuemint-github-context-v1"

export interface GitHubLocalContext {
  selectedRepositoryId?: number
  draft?: Omit<GitHubCreateIssueInput, "clientRequestId">
}

export async function loadGitHubContext(): Promise<GitHubLocalContext> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return {}
  const result = await chrome.storage.local.get(CONTEXT_KEY)
  const context = result?.[CONTEXT_KEY]
  if (!context || typeof context !== "object") return {}
  return context as GitHubLocalContext
}

export async function saveGitHubContext(context: GitHubLocalContext) {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return
  await chrome.storage.local.set({ [CONTEXT_KEY]: context })
}
