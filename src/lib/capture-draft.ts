import type { LocalAttachment } from "@/components/attachment-picker"
import type { CaptureEvidenceShot, QueueMintPageDiagnostics } from "@/features/capture-pro/types"
import type { QueueMintPageContext } from "@/lib/capture"

export interface QueueMintCaptureIssueDraft {
  summary: string
  description: string
  projectKey: string
  issueType: string
  priority: string
  boardId: number | null
  sprintId: number | null
  assignee: string
  epic: string
  estimate: string
  storyPoints: string
  labels: string
  component: string
  fixVersion: string
  dueDate: string
  moreFields: boolean
  includeContext: boolean
  includeScreenshot: boolean
  includeDiagnostics: boolean
  attachments: LocalAttachment[]
}

export interface QueueMintCaptureSource {
  tabId: number
  url: string
  title: string
}

export interface QueueMintCaptureDraft {
  id: string
  dataUrl: string
  context: QueueMintPageContext | null
  shots: CaptureEvidenceShot[]
  activeShotId: string | null
  view: "capture" | "issue"
  finalScreenshot: string | null
  diagnostics: QueueMintPageDiagnostics | null
  issueDraft: QueueMintCaptureIssueDraft | null
  editorTabId: number | null
  source: QueueMintCaptureSource | null
  createdAt: string
  updatedAt: string
}

const DB_NAME = "queuemint-capture"
const STORE_NAME = "drafts"
const DB_VERSION = 1
const ACTIVE_KEY = "queuemintActiveCaptureDraftId"

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Could not open the QueueMint capture store."))
  })
}

async function putDraft(draft: QueueMintCaptureDraft) {
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).put(draft)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the capture draft."))
  })
  db.close()
}

export async function setActiveCaptureDraftId(id: string | null) {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    if (id) await chrome.storage.local.set({ [ACTIVE_KEY]: id })
    else await chrome.storage.local.remove(ACTIVE_KEY)
    return
  }
  if (id) localStorage.setItem(ACTIVE_KEY, id)
  else localStorage.removeItem(ACTIVE_KEY)
}

export async function getActiveCaptureDraftId() {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    const stored = await chrome.storage.local.get(ACTIVE_KEY)
    return typeof stored?.[ACTIVE_KEY] === "string" ? stored[ACTIVE_KEY] as string : null
  }
  return localStorage.getItem(ACTIVE_KEY)
}

export async function saveCaptureDraft(dataUrl: string, context: QueueMintPageContext | null, shots: CaptureEvidenceShot[] = [], activeShotId: string | null = null) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const draft: QueueMintCaptureDraft = {
    id, dataUrl, context, shots, activeShotId, view: "capture", finalScreenshot: null,
    diagnostics: null, issueDraft: null, editorTabId: null, source: context ? { tabId: context.tabId, url: context.url, title: context.title } : null, createdAt: now, updatedAt: now,
  }
  await putDraft(draft)
  await setActiveCaptureDraftId(id)
  return id
}

export async function updateCaptureDraft(id: string, patch: Partial<Omit<QueueMintCaptureDraft, "id" | "createdAt">>) {
  const current = await loadCaptureDraft(id)
  if (!current) return null
  const next: QueueMintCaptureDraft = { ...current, ...patch, id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() }
  await putDraft(next)
  await setActiveCaptureDraftId(id)
  return next
}

export async function loadCaptureDraft(id: string) {
  if (!id) return null
  const db = await openDatabase()
  const draft = await new Promise<QueueMintCaptureDraft | null>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly")
    const request = transaction.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve((request.result as QueueMintCaptureDraft | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error("Could not load the capture draft."))
  })
  db.close()
  if (!draft) return null
  return normalizeLegacyDraft(draft)
}

export async function loadActiveCaptureDraft() {
  const id = await getActiveCaptureDraftId()
  if (!id) return null
  const draft = await loadCaptureDraft(id)
  if (!draft) await setActiveCaptureDraftId(null)
  return draft
}

export async function deleteCaptureDraft(id: string) {
  if (!id) return
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete the capture draft."))
  })
  db.close()
  if (await getActiveCaptureDraftId() === id) await setActiveCaptureDraftId(null)
}

function normalizeLegacyDraft(draft: QueueMintCaptureDraft) {
  const shots = Array.isArray(draft.shots) ? draft.shots : []
  const now = draft.updatedAt || draft.createdAt || new Date().toISOString()
  return {
    ...draft,
    shots,
    activeShotId: draft.activeShotId ?? shots[0]?.id ?? null,
    view: draft.view === "issue" ? "issue" as const : "capture" as const,
    finalScreenshot: draft.finalScreenshot ?? null,
    diagnostics: draft.diagnostics ?? null,
    issueDraft: draft.issueDraft ?? null,
    editorTabId: draft.editorTabId ?? null,
    source: draft.source ?? (draft.context ? { tabId: draft.context.tabId, url: draft.context.url, title: draft.context.title } : shots[0]?.context ? { tabId: shots[0].context.tabId, url: shots[0].context.url, title: shots[0].context.title } : null),
    createdAt: draft.createdAt || now,
    updatedAt: now,
  }
}
