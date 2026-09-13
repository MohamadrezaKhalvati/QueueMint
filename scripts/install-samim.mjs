import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { inflateRawSync } from "node:zlib"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, "..")
const destination = join(projectRoot, "public", "fonts")
const required = ["Samim.woff2", "Samim-Medium.woff2", "Samim-Bold.woff2"]

function argValue(...names) {
  const normalized = names.map((name) => name.toLowerCase())
  const index = process.argv.findIndex((value) => normalized.includes(value.toLowerCase()))
  return index >= 0 ? process.argv[index + 1] : undefined
}

function findEndOfCentralDirectory(buffer) {
  const signature = 0x06054b50
  const minimum = Math.max(0, buffer.length - 65_557)
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset
  }
  throw new Error("Invalid ZIP: end-of-central-directory record was not found.")
}

function readZipEntries(buffer) {
  const eocd = findEndOfCentralDirectory(buffer)
  const entryCount = buffer.readUInt16LE(eocd + 10)
  let offset = buffer.readUInt32LE(eocd + 16)
  const entries = []

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Invalid ZIP: central-directory entry was not found.")
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const uncompressedSize = buffer.readUInt32LE(offset + 24)
    const fileNameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8")

    entries.push({ fileName, compressionMethod, compressedSize, uncompressedSize, localHeaderOffset })
    offset += 46 + fileNameLength + extraLength + commentLength
  }

  return entries
}

function extractEntry(buffer, entry) {
  const offset = entry.localHeaderOffset
  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error(`Invalid ZIP: local header missing for ${entry.fileName}.`)
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26)
  const extraLength = buffer.readUInt16LE(offset + 28)
  const dataStart = offset + 30 + fileNameLength + extraLength
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize)

  let output
  if (entry.compressionMethod === 0) output = Buffer.from(compressed)
  else if (entry.compressionMethod === 8) output = inflateRawSync(compressed)
  else throw new Error(`Unsupported ZIP compression method ${entry.compressionMethod} for ${entry.fileName}.`)

  if (output.length !== entry.uncompressedSize) {
    throw new Error(`ZIP size check failed for ${entry.fileName}.`)
  }
  return output
}

let zipPath = argValue("-ZipPath", "--zip", "--zip-path")

if (!zipPath) {
  const candidates = [
    join(homedir(), "Downloads", "samim-font-v4.0.5.zip"),
    join(homedir(), "Desktop", "samim-font-v4.0.5.zip"),
    join(process.cwd(), "samim-font-v4.0.5.zip"),
  ]
  zipPath = candidates.find(existsSync)
}

if (!zipPath) {
  console.error("Samim zip was not found automatically.")
  console.error('Run: npm run font:install -- --zip "D:\\\\path\\\\to\\\\samim-font-v4.0.5.zip"')
  process.exit(1)
}

zipPath = resolve(zipPath)
if (!existsSync(zipPath)) {
  console.error(`Samim zip not found: ${zipPath}`)
  process.exit(1)
}

console.log(`Found Samim zip: ${zipPath}`)
mkdirSync(destination, { recursive: true })

try {
  const archive = readFileSync(zipPath)
  const entries = readZipEntries(archive)

  for (const name of required) {
    const entry = entries.find((candidate) => basename(candidate.fileName) === name)
    if (!entry) throw new Error(`Could not find ${name} inside ${basename(zipPath)}.`)
    writeFileSync(join(destination, name), extractEntry(archive, entry))
  }

  console.log("Samim fonts installed into public/fonts.")
  console.log("Now run: npm run build")
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
