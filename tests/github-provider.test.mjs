import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const read = (path) => readFile(new URL(path, import.meta.url), "utf8")

test("GitHub service auth uses Chrome identity and session-only QueueMint credentials", async () => {
  const [client, manifest] = await Promise.all([
    read("../src/lib/github-provider/client.ts"),
    read("../public/manifest.json"),
  ])
  assert.match(client, /chrome\.identity\.launchWebAuthFlow/)
  assert.match(client, /chrome\.storage\.session/)
  assert.doesNotMatch(client, /chrome\.storage\.local.*SESSION_KEY/)
  assert.match(manifest, /"identity"/)
})

test("GitHub mock mode is explicitly development gated", async () => {
  const client = await read("../src/lib/github-provider/client.ts")
  assert.match(client, /env\.DEV === true/)
  assert.match(client, /VITE_GITHUB_PROVIDER_MOCK === "true"/)
  assert.match(client, /\/v1\/github\/installations/)
  assert.doesNotMatch(client, /"\/v1\/github\/repositories"/)
})

test("GitHub issue creation is review-first and preserves unknown outcomes", async () => {
  const [workspace, hook] = await Promise.all([
    read("../src/features/github/GitHubWorkspace.tsx"),
    read("../src/features/github/useGitHubProvider.ts"),
  ])
  assert.match(workspace, /Review before create/)
  assert.match(workspace, /Confirm & create/)
  assert.match(hook, /WRITE_OUTCOME_UNKNOWN/)
  assert.match(hook, /setUnknownWriteOutcome\(true\)/)
})

test("GitHub local context stores drafts but not auth material", async () => {
  const storage = await read("../src/lib/github-provider/storage.ts")
  assert.match(storage, /selectedRepositoryId/)
  assert.match(storage, /draft/)
  assert.doesNotMatch(storage, /token|session|authorization/i)
})

test("GitHub workspace is isolated as its own app mode", async () => {
  const [modes, shell, sidebar] = await Promise.all([
    read("../src/features/bulk/bulk-utils.ts"),
    read("../src/features/app-orchestration/AppMainShell.tsx"),
    read("../src/features/app-shell/WorkspaceSidebar.tsx"),
  ])
  assert.match(modes, /"github"/)
  assert.match(shell, /<GitHubWorkspace/)
  assert.match(sidebar, /value: "github"/)
})
