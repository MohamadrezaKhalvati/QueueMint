export type GitHubProviderMode = "service" | "mock"

export interface GitHubUserSummary {
  login: string
  name?: string
  avatarUrl?: string
}

export interface GitHubConnection {
  connected: boolean
  mode: GitHubProviderMode
  user?: GitHubUserSummary
  lastCheckedAt?: string
}

export interface GitHubRepository {
  id: number
  name: string
  fullName: string
  ownerLogin: string
  private: boolean
  htmlUrl: string
  installationId?: number
  installationAccount?: string
  capabilities: {
    readIssues: boolean
    createIssues: boolean
  }
}

export interface GitHubIssueSummary {
  id: number
  number: number
  title: string
  body?: string
  state: "open" | "closed"
  htmlUrl: string
  authorLogin?: string
}

export interface GitHubCreateIssueInput {
  title: string
  body: string
  clientRequestId: string
}

export interface GitHubCreateIssueResult {
  issue: GitHubIssueSummary
}

export interface GitHubPage<T> {
  data: T[]
  page?: { nextCursor?: string | null }
}

export interface GitHubServiceErrorShape {
  code: string
  message: string
  retryAfterSeconds?: number
  requestId?: string
}

export class GitHubProviderError extends Error {
  readonly code: string
  readonly retryAfterSeconds?: number
  readonly requestId?: string

  constructor(error: GitHubServiceErrorShape) {
    super(error.message)
    this.name = "GitHubProviderError"
    this.code = error.code
    this.retryAfterSeconds = error.retryAfterSeconds
    this.requestId = error.requestId
  }
}
