import type { JiraEditableField, JiraField } from "@/types"
import { sendJiraRequest } from "./request"

type JiraEditMetaField = {
  required?: boolean
  schema?: JiraField["schema"]
  name?: string
  operations?: string[]
  allowedValues?: unknown[]
}

type JiraEditMetaResponse = { fields?: Record<string, JiraEditMetaField> }

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

export async function getBulkEditableFields(issueKeys: string[]): Promise<JiraEditableField[]> {
  const safeKeys = Array.from(new Set(issueKeys.filter((key) => /^[A-Z][A-Z0-9_]*-\d+$/i.test(key)))).slice(0, 24)
  if (!safeKeys.length) return []
  const metas = await Promise.all(safeKeys.map(async (key) => {
    try { return await sendJiraRequest<JiraEditMetaResponse>(`/rest/api/2/issue/${encodeURIComponent(key)}/editmeta`) } catch { return null }
  }))
  const successful = metas.filter((meta): meta is JiraEditMetaResponse => Boolean(meta?.fields))
  if (!successful.length) throw new Error("Jira did not expose edit metadata for the selected issues.")
  const catalog = new Map<string, JiraEditableField & { allowedMap: Map<string, JiraEditableField["allowedValues"][number]> }>()
  for (const meta of successful) {
    for (const [id, field] of Object.entries(meta.fields ?? {})) {
      if (!field?.name) continue
      const existing = catalog.get(id)
      if (existing) {
        existing.availableOn += 1
        existing.required = existing.required || field.required === true
        for (const operation of field.operations ?? []) if (!existing.operations.includes(operation)) existing.operations.push(operation)
        for (const allowed of field.allowedValues ?? []) {
          const key = allowedValueKey(allowed)
          if (!existing.allowedMap.has(key)) existing.allowedMap.set(key, allowed as JiraEditableField["allowedValues"][number])
        }
        continue
      }
      const allowedMap = new Map<string, JiraEditableField["allowedValues"][number]>()
      for (const allowed of field.allowedValues ?? []) allowedMap.set(allowedValueKey(allowed), allowed as JiraEditableField["allowedValues"][number])
      catalog.set(id, {
        id, name: field.name, required: field.required === true, schema: field.schema,
        operations: Array.from(new Set(field.operations ?? [])), allowedValues: [], availableOn: 1,
        representativeCount: successful.length, allowedMap,
      })
    }
  }
  return Array.from(catalog.values()).map(({ allowedMap, ...field }) => ({ ...field, allowedValues: Array.from(allowedMap.values()) })).sort((a, b) => a.name.localeCompare(b.name))
}
