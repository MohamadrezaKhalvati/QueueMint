import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"))

test("package-lock direct package entries match package.json", async () => {
  const manifest = await readJson("../package.json")
  const lock = await readJson("../package-lock.json")
  const direct = { ...manifest.dependencies, ...manifest.devDependencies }

  for (const [name, expected] of Object.entries(direct)) {
    if (!/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(expected)) continue
    const entry = lock.packages?.[`node_modules/${name}`]
    assert.ok(entry, `package-lock is missing node_modules/${name}`)
    assert.equal(entry.version, expected, `${name} is out of sync between package.json and package-lock.json`)
  }
})
