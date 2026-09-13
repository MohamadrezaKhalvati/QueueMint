import { useRef, type ChangeEvent, type DragEvent } from "react"
import { FileImage, Paperclip, Plus, Trash2, UploadCloud } from "lucide-react"

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
  className?: string
}

const MAX_FILES = 10
const MAX_FILE_BYTES = 12 * 1024 * 1024
const MAX_TOTAL_BYTES = 20 * 1024 * 1024

export function AttachmentPicker({ files, onChange, label, helper, addLabel, className }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function appendFiles(list: FileList | File[]) {
    let remainingBytes = Math.max(0, MAX_TOTAL_BYTES - files.reduce((sum, item) => sum + item.file.size, 0))
    const accepted = Array.from(list).filter((file) => {
      if (file.size > MAX_FILE_BYTES || file.size > remainingBytes) return false
      remainingBytes -= file.size
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

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</div>
      </div>

      {files.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {files.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border bg-muted/30">
              <div className="aspect-[4/3] overflow-hidden bg-muted/40">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground"><Paperclip className="size-5" /></div>
                )}
              </div>
              <div className="min-w-0 px-2 py-1.5">
                <div className="truncate text-[11px] font-medium">{item.file.name}</div>
                <div className="text-[10px] text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(1)} MB</div>
              </div>
              <Button
                variant="destructive"
                size="icon-sm"
                className="absolute end-1.5 top-1.5 size-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.file.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <Button
        variant="outline"
        className="min-h-24 h-auto w-full cursor-pointer justify-start whitespace-normal border-dashed bg-muted/15 px-4 text-muted-foreground hover:border-primary/45 hover:bg-primary/5 hover:text-foreground"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event: DragEvent<HTMLButtonElement>) => event.preventDefault()}
        onDrop={(event: DragEvent<HTMLButtonElement>) => {
          event.preventDefault()
          appendFiles(event.dataTransfer.files)
        }}
      >
        <span className="grid size-9 place-items-center rounded-lg bg-background shadow-xs"><UploadCloud className="size-4" /></span>
        <span className="text-start">
          <span className="block font-medium text-foreground">{addLabel}</span>
          <span className="mt-0.5 block text-xs">PNG, JPG, WEBP, PDF, WEBM, TXT, JSON · max 12 MB each</span>
        </span>
        <Plus className="ms-auto size-4" />
      </Button>
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
