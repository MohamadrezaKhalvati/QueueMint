import type { LocalAttachment } from "@/components/attachment-picker"
import type { JiraAttachmentUpload } from "@/types"

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : ""
      const base64 = value.split(",")[1]
      if (!base64) reject(new Error("Could not encode the attachment."))
      else resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the attachment."))
    reader.readAsDataURL(blob)
  })
}

export async function fileToJiraAttachment(file: File): Promise<JiraAttachmentUpload> {
  return { name: file.name, type: file.type || "application/octet-stream", base64: await blobToBase64(file) }
}

export async function localAttachmentsToJira(files: LocalAttachment[]) {
  return Promise.all(files.map((item) => fileToJiraAttachment(item.file)))
}
