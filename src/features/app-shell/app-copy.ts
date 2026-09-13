import { copyENA } from "./app-copy-en-a"
import { copyENB } from "./app-copy-en-b"
import { copyFAA } from "./app-copy-fa-a"
import { copyFAB } from "./app-copy-fa-b"

export const copy = {
  en: { ...copyENA, ...copyENB },
  fa: { ...copyFAA, ...copyFAB },
} as const

export type AppCopy = typeof copy.en | typeof copy.fa
