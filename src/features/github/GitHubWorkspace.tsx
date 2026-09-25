import { ExternalLink, Github, LoaderCircle, LockKeyhole, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useGitHubProvider } from "./useGitHubProvider"

export function GitHubWorkspace({ locale }: { locale: "en" | "fa" }) {
  const g = useGitHubProvider()
  const fa = locale === "fa"

  if (!g.connection?.connected) {
    return (
      <section className="mx-auto max-w-3xl space-y-6 py-10">
        <div className="rounded-[var(--qm-panel-radius)] border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-[var(--qm-control-radius)] bg-foreground text-background"><Github className="size-5" /></div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold">{fa ? "اتصال GitHub" : "Connect GitHub"}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {fa ? "GitHub مستقل از Jira متصل می‌شود. دسترسی repository و عملیات ساخت issue از همان سطح دسترسی واقعی کاربر پیروی می‌کند." : "GitHub connects independently from Jira. Repository visibility and issue creation follow the user's effective GitHub access."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant={g.runtime.mode === "mock" ? "warning" : "outline"}>{g.runtime.mode === "mock" ? "DEV MOCK" : "SERVICE"}</Badge>
                {!g.runtime.serviceConfigured && g.runtime.mode === "service" ? <Badge variant="destructive">Service URL missing</Badge> : null}
              </div>
              {g.error ? <div className="mt-4 rounded-[var(--qm-control-radius)] border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{g.error}</div> : null}
              <Button className="mt-5" onClick={() => void g.connect()} disabled={g.loading}>
                {g.loading ? <LoaderCircle className="size-4 animate-spin" /> : <Github className="size-4" />}
                {fa ? "اتصال GitHub" : "Connect GitHub"}
              </Button>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--qm-panel-radius)] border border-dashed p-4 text-sm text-muted-foreground">
          <LockKeyhole className="me-2 inline size-4" />
          {fa ? "توکن GitHub داخل extension ذخیره دائمی نمی‌شود. session واقعی فقط در chrome.storage.session نگهداری می‌شود." : "GitHub tokens are not persisted in the extension. The real provider keeps only the QueueMint session in chrome.storage.session."}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5 py-6">
      <div className="flex flex-col gap-3 rounded-[var(--qm-panel-radius)] border bg-card p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><Github className="size-5" /><span className="font-semibold">{g.connection.user?.name || g.connection.user?.login}</span><Badge variant="success">{fa ? "متصل" : "Connected"}</Badge></div>
          <div className="mt-1 text-xs text-muted-foreground">@{g.connection.user?.login} · {g.connection.mode}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void g.refreshRepositories()} disabled={g.loading}><RefreshCw className="size-4" />{fa ? "تازه‌سازی" : "Refresh"}</Button>
          <Button variant="ghost" size="sm" onClick={() => void g.disconnect()}>{fa ? "قطع اتصال" : "Disconnect"}</Button>
        </div>
      </div>

      {g.error ? <div className="rounded-[var(--qm-control-radius)] border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{g.error}</div> : null}
      {g.unknownWriteOutcome ? <div className="rounded-[var(--qm-control-radius)] border border-warning/30 bg-warning/8 p-3 text-sm">{fa ? "نتیجه ساخت issue نامشخص است. قبل از تلاش مجدد repository را بررسی کن." : "The create outcome is unknown. Inspect the repository before retrying to avoid a duplicate issue."}</div> : null}

      <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-[var(--qm-panel-radius)] border bg-card p-4">
          <div className="text-sm font-semibold">{fa ? "Repository" : "Repositories"}</div>
          {g.repositories.length ? g.repositories.map((repo) => (
            <button key={repo.id} type="button" onClick={() => g.setSelectedRepositoryId(repo.id)} className={`w-full rounded-[var(--qm-control-radius)] border p-3 text-start transition ${g.selectedRepositoryId === repo.id ? "border-primary/40 bg-primary/5" : "hover:bg-muted/40"}`}>
              <div className="truncate text-sm font-medium">{repo.fullName}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{repo.private ? (fa ? "خصوصی" : "Private") : (fa ? "عمومی" : "Public")}</span>
                {repo.capabilities.createIssues ? <Badge variant="outline">{fa ? "قابل ساخت" : "Can create"}</Badge> : null}
              </div>
            </button>
          )) : <div className="text-sm text-muted-foreground">{fa ? "repository در دسترس نیست." : "No accessible repositories."}</div>}
        </aside>

        <div className="space-y-5">
          {g.selectedRepository ? (
            <>
              <div className="rounded-[var(--qm-panel-radius)] border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="font-semibold">{g.selectedRepository.fullName}</h2><p className="mt-1 text-xs text-muted-foreground">{g.selectedRepository.installationAccount ? `Installation: ${g.selectedRepository.installationAccount}` : ""}</p></div>
                  <Button variant="ghost" size="sm" onClick={() => window.open(g.selectedRepository?.htmlUrl, "_blank")}><ExternalLink className="size-4" />GitHub</Button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-[var(--qm-panel-radius)] border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{fa ? "Issueها" : "Issues"}</h3><Button variant="ghost" size="icon-sm" onClick={() => void g.refreshIssues()}><RefreshCw className="size-4" /></Button></div>
                  <div className="space-y-2">
                    {g.issues.map((issue) => (
                      <button key={issue.id} type="button" onClick={() => g.setSelectedIssue(issue)} className="w-full rounded-[var(--qm-control-radius)] border p-3 text-start hover:bg-muted/35">
                        <div className="text-xs text-muted-foreground">#{issue.number} · {issue.state}</div>
                        <div className="mt-1 text-sm font-medium">{issue.title}</div>
                      </button>
                    ))}
                    {!g.issues.length ? <div className="text-sm text-muted-foreground">{fa ? "issue بازی پیدا نشد." : "No open issues found."}</div> : null}
                  </div>
                  {g.selectedIssue ? (
                    <div className="mt-4 rounded-[var(--qm-control-radius)] bg-muted/35 p-3">
                      <div className="font-medium">#{g.selectedIssue.number} {g.selectedIssue.title}</div>
                      <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{g.selectedIssue.body || (fa ? "بدون توضیح" : "No description")}</div>
                      <Button variant="link" className="mt-2 h-auto px-0" onClick={() => window.open(g.selectedIssue?.htmlUrl, "_blank")}>{fa ? "باز کردن در GitHub" : "Open in GitHub"}</Button>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[var(--qm-panel-radius)] border bg-card p-4">
                  <h3 className="font-semibold">{fa ? "ساخت Issue" : "Create issue"}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{fa ? "نوشتن و review جدا هستند. هیچ writeای قبل از تأیید انجام نمی‌شود." : "Draft and review are separate. No write occurs before confirmation."}</p>
                  {!g.reviewing ? (
                    <div className="mt-4 space-y-3">
                      <Input value={g.title} onChange={(event) => g.setTitle(event.target.value)} placeholder={fa ? "عنوان issue" : "Issue title"} disabled={!g.selectedRepository.capabilities.createIssues} />
                      <Textarea value={g.body} onChange={(event) => g.setBody(event.target.value)} placeholder={fa ? "توضیحات Markdown" : "Markdown body"} disabled={!g.selectedRepository.capabilities.createIssues} />
                      <Button onClick={g.beginReview} disabled={!g.selectedRepository.capabilities.createIssues}>{fa ? "مرور قبل از ساخت" : "Review before create"}</Button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-[var(--qm-control-radius)] border bg-muted/25 p-3">
                        <div className="text-xs text-muted-foreground">{g.selectedRepository.fullName}</div>
                        <div className="mt-2 font-semibold">{g.title}</div>
                        <div className="mt-2 whitespace-pre-wrap text-sm">{g.body || (fa ? "بدون توضیح" : "No description")}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => g.setReviewing(false)} disabled={g.creating}>{fa ? "ویرایش" : "Edit"}</Button>
                        <Button onClick={() => void g.createIssue()} disabled={g.creating}>{g.creating ? <LoaderCircle className="size-4 animate-spin" /> : null}{fa ? "تأیید و ساخت" : "Confirm & create"}</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : <div className="rounded-[var(--qm-panel-radius)] border border-dashed p-8 text-center text-sm text-muted-foreground">{fa ? "یک repository انتخاب کن." : "Select a repository."}</div>}
        </div>
      </div>
    </section>
  )
}
