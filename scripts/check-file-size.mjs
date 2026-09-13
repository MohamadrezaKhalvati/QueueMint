import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const limit = 300
const sourceRoots = ["src", "public", "scripts"]
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css"])
const failures = []

function lineCount(file) {
  const text = fs.readFileSync(file, "utf8")
  return text ? text.split(/\r?\n/).length - (text.endsWith("\n") ? 1 : 0) : 0
}

function walk(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return ["node_modules", "dist", ".git"].includes(entry.name) ? [] : walk(full)
    return extensions.has(path.extname(entry.name)) ? [full] : []
  })
}

for (const file of sourceRoots.flatMap((item) => walk(path.join(root, item)))) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/")
  const lines = lineCount(file)
  if (lines > limit) failures.push(`${relative}: ${lines} lines, limit is ${limit}.`)
}

if (failures.length) {
  console.error("Architecture line-limit check failed:\n" + failures.map((item) => `- ${item}`).join("\n"))
  process.exit(1)
}
console.log(`Architecture line-limit check passed. Every production code file is capped at ${limit} lines.`)
