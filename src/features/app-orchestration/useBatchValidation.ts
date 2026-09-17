import { toast } from "sonner"

import type { LocalAttachment } from "@/components/attachment-picker"
import type { AppCopy } from "@/features/app-shell/app-copy"
import { EMPTY_VALIDATION } from "@/features/bulk/bulk-utils"
import { getCreateMeta, getProject, jiraErrorMessage } from "@/lib/jira"
import { parseBulkJson, validatePayload } from "@/lib/validation"
import type { BulkPayload, CreateRunResult, JiraMetadata, JiraProject, JiraSprint, ValidationResult } from "@/types"
import type { StateSetter } from "./types"

type BatchValidationOptions = {
  payload: BulkPayload | undefined
  parsedError: string | undefined
  metadata: JiraMetadata | null
  project: JiraProject | null
  sprints: JiraSprint[]
  selectedForCreate: Set<number>
  t: AppCopy
  setValidating: StateSetter<boolean>
  setRemoteNote: StateSetter<string | null>
  setValidation: StateSetter<ValidationResult>
  setProject: StateSetter<JiraProject | null>
  setCreateDialogOpen: StateSetter<boolean>
  setJsonText: StateSetter<string>
  setRunResult: StateSetter<CreateRunResult | null>
  setSelectedIndex: StateSetter<number>
  setAttachmentsByIndex: StateSetter<Record<number, LocalAttachment[]>>
  setSelectedForCreate: StateSetter<Set<number>>
}

export function useBatchValidation(options: BatchValidationOptions) {
  const {
    payload, parsedError, metadata, project, sprints, selectedForCreate, t, setValidating,
    setRemoteNote, setValidation, setProject, setCreateDialogOpen, setJsonText, setRunResult,
    setSelectedIndex, setAttachmentsByIndex, setSelectedForCreate,
  } = options

  async function validate() {
    setValidating(true)
    setRemoteNote(null)
    try {
      if (!payload) {
        const message = parsedError ?? "Invalid JSON."
        setValidation({ valid: false, errors: [{ level: "error", message }], warnings: [] })
        toast.error(t.validationFailed, { description: message })
        return false
      }
      let activeProject = project
      if (metadata && (!activeProject || activeProject.key !== payload.project)) {
        try {
          activeProject = await getProject(payload.project)
          setProject(activeProject)
        } catch (error) {
          const local = validatePayload(payload, metadata, undefined, sprints)
          const message = jiraErrorMessage(error, "Unable to read project metadata.")
          setValidation({ ...local, valid: false, errors: [...local.errors, { level: "error", message }] })
          toast.error(t.validationFailed, { description: message })
          return false
        }
      }
      const local = validatePayload(payload, metadata ?? undefined, activeProject ?? undefined, sprints)
      setValidation(local)
      if (local.valid) {
        try {
          await getCreateMeta(payload.project)
          setRemoteNote("Jira create metadata is reachable. The batch is ready for creation.")
        } catch (error) {
          setRemoteNote(`Local validation passed. Jira create-metadata was unavailable: ${jiraErrorMessage(error, "unknown error")}.`)
        }
        toast.success(t.validationPassed, { description: `${payload.issues.length} ${t.issues}` })
      } else toast.error(t.validationFailed, { description: local.errors[0]?.message })
      return local.valid
    } finally { setValidating(false) }
  }

  function includedIndicesForCreation() {
    if (!payload) return []
    const selected = new Set(selectedForCreate)
    const localEpicByRef = new Map<string, number>()
    payload.issues.forEach((issue, index) => {
      if (issue.type.toLowerCase() === "epic" && issue.ref) localEpicByRef.set(issue.ref, index)
    })
    for (const index of Array.from(selected)) {
      const ref = payload.issues[index]?.epic
      const epicIndex = ref ? localEpicByRef.get(ref) : undefined
      if (epicIndex !== undefined) selected.add(epicIndex)
    }
    return Array.from(selected).filter((index) => index >= 0 && index < payload.issues.length).sort((a, b) => a - b)
  }

  async function requestCreateBatch() {
    if (!payload || !metadata || !selectedForCreate.size) return
    if (await validate()) setCreateDialogOpen(true)
  }

  function importFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") return
      const nextParsed = parseBulkJson(reader.result)
      setJsonText(reader.result); setRunResult(null); setValidation(EMPTY_VALIDATION); setSelectedIndex(0); setAttachmentsByIndex({})
      if (nextParsed.payload?.issues?.length) {
        setSelectedForCreate(new Set(nextParsed.payload.issues.map((_, index) => index)))
        toast.success(t.importSucceeded, { description: `${nextParsed.payload.issues.length} ${t.issues}` })
      } else if (nextParsed.error) toast.error(t.importFailed, { description: nextParsed.error })
    }
    reader.readAsText(file)
  }

  return { validate, includedIndicesForCreation, requestCreateBatch, importFile }
}
