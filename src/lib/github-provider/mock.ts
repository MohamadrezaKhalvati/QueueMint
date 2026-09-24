import type {
  GitHubConnection, GitHubCreateIssueInput, GitHubCreateIssueResult, GitHubIssueSummary, GitHubPage, GitHubRepository,
} from "@/types"

const repositories: GitHubRepository[] = [
  {
    id: 101,
    name: "queuemint-demo",
    fullName: "demo-org/queuemint-demo",
    ownerLogin: "demo-org",
    private: true,
    htmlUrl: "https://github.com/demo-org/queuemint-demo",
    installationId: 7001,
    installationAccount: "demo-org",
    capabilities: { readIssues: true, createIssues: true },
  },
  {
    id: 102,
    name: "public-playground",
    fullName: "demo-user/public-playground",
    ownerLogin: "demo-user",
    private: false,
    htmlUrl: "https://github.com/demo-user/public-playground",
    installationId: 7002,
    installationAccount: "demo-user",
    capabilities: { readIssues: true, createIssues: false },
  },
]

const issueStore = new Map<number, GitHubIssueSummary[]>([
  [101, [
    { id: 9001, number: 12, title: "Harden retry behavior", body: "Do not replay writes with unknown outcomes.", state: "open", htmlUrl: "https://github.com/demo-org/queuemint-demo/issues/12", authorLogin: "demo-user" },
    { id: 9002, number: 9, title: "Provider switcher accessibility", body: "Verify keyboard navigation and visible focus.", state: "open", htmlUrl: "https://github.com/demo-org/queuemint-demo/issues/9", authorLogin: "demo-user" },
  ]],
  [102, [
    { id: 9101, number: 3, title: "Read-only repository sample", body: "This repository intentionally cannot create issues.", state: "open", htmlUrl: "https://github.com/demo-user/public-playground/issues/3", authorLogin: "demo-user" },
  ]],
])

let connected = false
let nextIssueId = 10000

export const mockGitHubProvider = {
  async connect(): Promise<GitHubConnection> {
    connected = true
    return this.connection()
  },
  async disconnect(): Promise<void> {
    connected = false
  },
  async connection(): Promise<GitHubConnection> {
    return {
      connected,
      mode: "mock",
      user: connected ? { login: "demo-user", name: "QueueMint Demo" } : undefined,
      lastCheckedAt: new Date().toISOString(),
    }
  },
  async repositories(): Promise<GitHubPage<GitHubRepository>> {
    return { data: connected ? repositories : [] }
  },
  async issues(repositoryId: number): Promise<GitHubPage<GitHubIssueSummary>> {
    return { data: connected ? [...(issueStore.get(repositoryId) ?? [])] : [] }
  },
  async createIssue(repositoryId: number, input: GitHubCreateIssueInput): Promise<GitHubCreateIssueResult> {
    const repository = repositories.find((item) => item.id === repositoryId)
    if (!repository?.capabilities.createIssues) throw new Error("Issue creation is unavailable for this repository.")
    const number = (issueStore.get(repositoryId)?.reduce((max, item) => Math.max(max, item.number), 0) ?? 0) + 1
    const issue: GitHubIssueSummary = {
      id: nextIssueId += 1,
      number,
      title: input.title,
      body: input.body,
      state: "open",
      htmlUrl: `${repository.htmlUrl}/issues/${number}`,
      authorLogin: "demo-user",
    }
    issueStore.set(repositoryId, [issue, ...(issueStore.get(repositoryId) ?? [])])
    return { issue }
  },
}
