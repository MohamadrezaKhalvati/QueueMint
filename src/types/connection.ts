export interface JiraTabSummary {
  id: number
  title: string
  url: string
  active: boolean
  lastAccessed: number
}

export interface JiraTabContext {
  projectKey?: string
  boardId?: number
  issueKey?: string
  url: string
}

export interface JiraConnectionStatus {
  configured: boolean
  origin?: string
  selectedTabId?: number | null
  selectedTab?: JiraTabSummary | null
  tabs: JiraTabSummary[]
  context?: JiraTabContext | null
  candidate?: { tabId?: number; url?: string; title?: string } | null
}
