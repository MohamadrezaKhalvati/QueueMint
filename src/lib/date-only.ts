export function parseDateOnly(value: string | null | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "")
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day, 12, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return undefined
  return date
}

export function formatDateOnly(date: Date) {
  const year = String(date.getFullYear()).padStart(4, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
