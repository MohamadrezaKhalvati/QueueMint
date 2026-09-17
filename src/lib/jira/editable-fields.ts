import type { JiraEditableField, JiraField } from "@/types"
import { jiraErrorMessage } from "./errors"
import { getJiraOrigin, sendJiraRequest } from "./request"

type JiraEditMetaField = {
  required?: boolean
  schema?: JiraField["schema"]
  name?: string
  operations?: string[]
  allowedValues?: unknown[]
}

type JiraEditMetaResponse = { fields?: Record<string, JiraEditMetaField> }
type EditMetaEntry = { key: string; fields: Record<string, JiraEditMetaField> }
export type JiraBulkFieldSupport = { fieldId: string; availableOn: number; total: number; missingKeys: string[] }

const EDIT_META_TTL_MS = 30_000
const editMetaCache = new Map<string, { expiresAt: number; promise: Promise<EditMetaEntry> }>()

function safeKeys(issueKeys: string[]) {
  return Array.from(new Set(issueKeys.filter((key) => /^[A-Z][A-Z0-9_]*-\d+$/i.test(key)).map((key) => key.toUpperCase())))
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length)
  let index = 0
  async function run() {
    while (index < items.length) {
      const current = index++
      results[current] = await worker(items[current])
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()))
  return results
}

async function getIssueEditMeta(key: string): Promise<EditMetaEntry> {
  const cacheKey = `${getJiraOrigin() || "current"}:${key}`
  const cached = editMetaCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.promise
  const promise = sendJiraRequest<JiraEditMetaResponse>(`/rest/api/2/issue/${encodeURIComponent(key)}/editmeta`)
    .then((meta) => {
      if (!meta?.fields) throw new Error(`Jira did not expose edit metadata for ${key}.`)
      return { key, fields: meta.fields }
    })
    .catch((error) => {
      editMetaCache.delete(cacheKey)
      throw new Error(`${key}: ${jiraErrorMessage(error, "Unable to load Jira edit metadata.")}`)
    })
  editMetaCache.set(cacheKey, { expiresAt: Date.now() + EDIT_META_TTL_MS, promise })
  return promise
}

async function loadEditMeta(issueKeys: string[]) {
  const keys = safeKeys(issueKeys)
  if (!keys.length) return []
  return mapWithConcurrency(keys, 6, getIssueEditMeta)
}

function allowedValueKey(value: unknown) {
  if (value === null) return "null"
  if (typeof value !== "object") return `${typeof value}:${String(value)}`
  const record = value as Record<string, unknown>
  for (const key of ["id", "accountId", "key", "name", "value", "displayName"]) {
    const candidate = record[key]
    if (typeof candidate === "string" || typeof candidate === "number") return `${key}:${String(candidate)}`
  }
  try { return JSON.stringify(value) ?? String(value) } catch { return String(value) }
}

function intersectOperations(fields: JiraEditMetaField[]) {
  const lists = fields.map((field) => Array.from(new Set(field.operations ?? [])))
  if (!lists.length) return []
  if (lists.every((list) => !list.length)) return []
  const first = lists.find((list) => list.length) ?? []
  return first.filter((operation) => lists.every((list) => !list.length || list.includes(operation)))
}

function intersectAllowedValues(fields: JiraEditMetaField[]) {
  const restricted = fields.map((field) => field.allowedValues ?? []).filter((values) => values.length)
  if (!restricted.length) return []
  const maps = restricted.map((values) => new Map(values.map((value) => [allowedValueKey(value), value])))
  return Array.from(maps[0].entries()).filter(([key]) => maps.every((map) => map.has(key))).map(([, value]) => value)
}

function aliasesFor(fieldId: string) {
  if (fieldId === "timeoriginalestimate") return ["timetracking", "timeoriginalestimate"]
  if (fieldId === "timeestimate") return ["timetracking", "timeestimate"]
  return [fieldId]
}

function fieldCanSet(fieldId: string, field: JiraEditMetaField | undefined) {
  if (!field) return false
  const operations = field.operations ?? []
  return !operations.length || operations.includes("set") || (fieldId === "timetracking" && operations.includes("edit"))
}

export async function getBulkFieldSupport(issueKeys: string[], fieldIds: string[]): Promise<JiraBulkFieldSupport[]> {
  const entries = await loadEditMeta(issueKeys)
  const total = entries.length
  return Array.from(new Set(fieldIds)).map((fieldId) => {
    const aliases = aliasesFor(fieldId)
    const missingKeys = entries.filter((entry) => !aliases.some((alias) => fieldCanSet(alias, entry.fields[alias]))).map((entry) => entry.key)
    return { fieldId, availableOn: total - missingKeys.length, total, missingKeys }
  })
}

export async function getBulkEditableFields(issueKeys: string[]): Promise<JiraEditableField[]> {
  const entries = await loadEditMeta(issueKeys)
  if (!entries.length) return []
  const ids = new Set(entries.flatMap((entry) => Object.keys(entry.fields)))
  const result: JiraEditableField[] = []
  for (const id of ids) {
    const instances = entries.map((entry) => entry.fields[id]).filter((field): field is JiraEditMetaField => Boolean(field?.name))
    if (!instances.length) continue
    result.push({
      id,
      name: instances[0].name as string,
      required: instances.some((field) => field.required === true),
      schema: instances[0].schema,
      operations: intersectOperations(instances),
      allowedValues: intersectAllowedValues(instances) as JiraEditableField["allowedValues"],
      availableOn: instances.length,
      representativeCount: entries.length,
    })
  }
  return result.sort((a, b) => a.name.localeCompare(b.name))
}
