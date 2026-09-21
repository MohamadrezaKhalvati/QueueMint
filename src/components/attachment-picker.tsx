import { useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { FileText, Plus, Trash2, UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LocalAttachment {
  id: string
  file: File
  previewUrl?: string
}

interface AttachmentPickerProps {
  files: LocalAttachment[]
  onChange: (files: LocalAttachment[]) => void
  label: string
  helper: string
  addLabel: string
  dropLabel?: string
  dropActiveLabel?: string
  formatHint?: string
  className?: string
}

const MAX_FILES = 10
const MAX_FILE_BYTES = 12 * 1024 * 1024
const MAX_TOTAL_BYTES = 20 * 1024 * 1024
const FILE_HINT = "PNG, JPG, WEBP, PDF, WEBM, TXT, LOG, JSON · max 12 MB each"
const SUPPORTED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "video/webm",
  "text/plain",
  "application/json",
])
const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".pdf", ".webm", ".txt", ".log", ".json"]

function isSupportedFile(file: File) {
  const name = file.name.toLowerCase()
  return SUPPORTED_MIME.has(file.type.toLowerCase()) || SUPPORTED_EXTENSIONS.some((extension) => name.endsWith(extension))
}

function fileFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function fileSize(file: File) {
  if (file.size < 1024 * 1024) return `${Math.max(1, Math.round(file.size / 1024))} KB`
  return `${(file.size / 1024 / 1024).toFixed(1)} MB`
}

export function AttachmentPicker({ files, onChange, label, helper, addLabel, dropLabel, dropActiveLabel, formatHint, className }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)
  const [dragActive, setDragActive] = useState(false)

  function appendFiles(list: FileList | File[]) {
    let remainingBytes = Math.max(0, MAX_TOTAL_BYTES - files.reduce((sum, item) => sum + item.file.size, 0))
    const existing = new Set(files.map((item) => fileFingerprint(item.file)))
    const accepted = Array.from(list).filter((file) => {
      if (!isSupportedFile(file) || existing.has(fileFingerprint(file))) return false
      if (file.size > MAX_FILE_BYTES || file.size > remainingBytes) return false
      remainingBytes -= file.size
      existing.add(fileFingerprint(file))
      return true
    }).slice(0, Math.max(0, MAX_FILES - files.length))
    const next = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }))
    if (next.length) onChange([...files, ...next])
  }

  function remove(id: string) {
    const target = files.find((item) => item.id === id)
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
    onChange(files.filter((item) => item.id !== id))
  }

  function beginDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragDepthRef.current += 1
    setDragActive(true)
  }

  function continueDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }

  function endDrag(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setDragActive(false)
  }

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    dragDepthRef.current = 0
    setDragActive(false)
    appendFiles(event.dataTransfer.files)
  }

  const triggerTitle = dragActive ? dropActiveLabel ?? "Drop to attach" : dropLabel ?? addLabel

  return (
    <div
      className={cn("qm-attachment-picker space-y-3 rounded-[var(--qm-panel-radius)] transition-[background-color,border-color,box-shadow]", dragActive && "bg-primary/5 ring-2 ring-primary/25", className)}
      onDragEnter={beginDrag}
      onDragOver={continueDrag}
      onDragLeave={endDrag}
      onDrop={dropFiles}
    >
      <div className="qm-attachment-heading flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</div>
        </div>
        {files.length ? <span className="shrink-0 rounded-[var(--qm-control-radius)] bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{files.length}/{MAX_FILES}</span> : null}
      </div>

      {files.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((item) => (
            <div key={item.id} className="qm-attachment-file group relative overflow-hidden rounded-[var(--qm-control-radius)] border bg-muted/30">
              <div className="aspect-[4/3] overflow-hidden bg-muted/40">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><FileText className="size-5" /></div>
                )}
              </div>
              <div className="min-w-0 px-2 py-1.5 pe-9">
                <div className="truncate text-[11px] font-medium" title={item.file.name}>{item.file.name}</div>
                <div className="text-[10px] text-muted-foreground">{fileSize(item.file)}</div>
              </div>
              <Button
                variant="destructive"
                size="icon-sm"
                className="absolute end-1.5 top-1.5 size-7 opacity-100 shadow-sm md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.file.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        data-slot="attachment-trigger"
        className={cn(
          "qm-upload-control grid min-h-[76px] w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_32px] items-center gap-3 rounded-[var(--qm-control-radius)] border border-dashed px-3 py-3 text-start outline-none transition-[background-color,border-color,box-shadow,color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
          dragActive && "border-primary bg-primary/10 text-foreground",
        )}
        data-drag-active={dragActive ? "true" : undefined}
        onClick={() => inputRef.current?.click()}
        aria-label={addLabel}
      >
        <span className="qm-upload-icon grid size-10 shrink-0 place-items-center rounded-[var(--qm-control-radius)] border bg-background text-primary shadow-xs" aria-hidden="true"><UploadCloud className="size-4" /></span>
        <span className="qm-upload-copy min-w-0">
          <span className="qm-upload-title block text-sm font-medium leading-5 text-foreground">{triggerTitle}</span>
          <span className="qm-upload-hint mt-0.5 block break-words text-xs leading-5 text-muted-foreground">{formatHint ?? FILE_HINT}</span>
        </span>
        <span className="qm-upload-add grid size-8 place-items-center justify-self-end rounded-[var(--qm-control-radius)] border bg-background text-muted-foreground" aria-hidden="true"><Plus className="size-4" /></span>
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/png,image/jpeg,image/webp,application/pdf,video/webm,text/plain,application/json,.log"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (event.target.files) appendFiles(event.target.files)
          event.target.value = ""
        }}
      />
    </div>
  )
}
