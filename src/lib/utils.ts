import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })
  downloadBlob(filename, blob)
}

export function downloadText(filename: string, value: string, type = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([value], { type }))
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function formatIssueCount(count: number) {
  return `${count} issue${count === 1 ? "" : "s"}`
}
