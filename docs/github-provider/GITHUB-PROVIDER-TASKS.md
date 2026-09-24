# GitHub provider implementation plan and task backlog

Status: proposed, 2026-09-24. Source of requirements: [GitHub provider specification](GITHUB-PROVIDER-SPEC.md). These are planned tasks, not completed worklogs or Jira issues. Each task has a reviewable output and a pass condition.

## Delivery order

```text
Discovery and proof (GHP-01..03)
    → provider shell and Jira regression shield (GHP-04..05)
    → service/auth/access (GHP-06..09)
    → GitHub read views (GHP-10..11)
    → reviewed issue creation (GHP-12)
    → hardening and pilot rollout (GHP-13..16)
```

Release A is useful once GHP-01 through GHP-11 and the read-only parts of GHP-13 through GHP-16 pass. Release B adds GHP-12 and write-specific gates. Project item mutations, Jira↔GitHub sync, personal Projects, and Enterprise Server are separate future proposals, not hidden tasks in this backlog.

| ID | Priority | Task and deliverable | Depends on | Acceptance criteria |
| --- | --- | --- | --- | --- |
| GHP-01 | P0 | Confirm customer workflow: interview or review 3–5 target users; rank connect/discover, Project browsing, and issue create; record use cases and non-goals in the spec. | — | One agreed first-release journey and measurable success criteria; Jira↔GitHub sync explicitly in or out. |
| GHP-02 | P0 | GitHub App permission/API spike using a development app and one personal + one organization test account. Prove user-token installation/repository discovery, Issues read/write, organization Projects v2 query, private Project item behavior, and owner-approval path. | GHP-01 | Redacted request/response evidence and exact permission list; unsupported paths and personal Project result recorded; no production credentials in repo. |
| GHP-03 | P0 | Auth/browser spike: deployed test callback and `chrome.identity.launchWebAuthFlow` on Chrome/Edge, development/production extension ID strategy, state/PKCE/grant exchange, refresh race. | GHP-02 | A complete connect, restart, reconnect, revoke, and cancellation demonstration; threat review approves callback allowlist and storage choice. |
| GHP-04 | P0 | Add shell-level `ProviderId`, independent connection states, provider selector, and GitHub-only route/screen container. Leave Jira hooks/services Jira-specific. | GHP-01 | GitHub can be selected with no Jira connection; Jira can be selected with no GitHub connection; switching clears cross-provider selections and preserves drafts. |
| GHP-05 | P0 | Additive local-state migration and namespace. Keep `queuemint-state-v1` valid; introduce GitHub context and provider-scoped draft keys; plan backup schema update. | GHP-04 | Upgrade from an existing Jira profile preserves project, board, saved views/actions, worklog, and Capture session; no GitHub credential enters backup/export. |
| GHP-06 | P0 | Create QueueMint GitHub service skeleton, deployment pipeline, secret store, encrypted token persistence, health endpoint, request IDs, structured redaction, and owner/on-call runbook. | GHP-03 | Staging deployed; auth secrets and GitHub tokens absent from source/client/logs; health, rollback, and rotation procedures exercised. |
| GHP-07 | P0 | Implement GitHub App auth, user-token refresh under lock, one-time extension grant, short-lived QueueMint session, disconnect/revocation, and auth rate limits. | GHP-06 | State/replay/redirect tests pass; two concurrent refreshes do not lose the new refresh token; browser restart behavior matches spec; disconnect invalidates session. |
| GHP-08 | P0 | Add extension GitHub connection UI and transport: connect, authorization cancellation, status, reconnect, disconnect, install/request access. Update manifest permission and release guard. | GHP-04, GHP-07 | No Jira tab required; clear account/status; GitHub failure leaves Jira usable; Chrome/Edge auth flow works; permission review updated. |
| GHP-09 | P0 | Implement user-scoped installation and repository discovery in service and UI with pagination, identity-safe cache, permission-gap states, and selected-repo handling. | GHP-07, GHP-08 | Multiple installations work; only user-accessible repositories appear; removed access clears selection and cached private data; fake installation ID cannot disclose data. |
| GHP-10 | P1 | Repository issue list/detail with REST, cursor/page bounds, PR distinction, loading/error/empty states, open-in-GitHub links. | GHP-09 | Private repo and read-only user cases pass; issue list excludes or marks PRs; 403/404/429 do not masquerade as empty results. |
| GHP-11 | P1 | Organization Projects v2 read view with GraphQL, accessible project discovery, item type mapping, private item handling, and bounded query cost. | GHP-02, GHP-09 | Project and repository pickers remain distinct; hidden private content is not cached or rendered; Project permission failure explains the next action. |
| GHP-12 | P1 | Review-first GitHub issue creation, server validation and permission check, draft persistence, request-ID dedupe, uncertain-write handling, success link, and write kill switch. | GHP-10, GHP-13 | Exactly one issue for normal/double-click flow; title/body/repo reviewed; 410/422 preserve draft; timeout after forwarded create never triggers blind retry. |
| GHP-13 | P0 | Security/privacy audit: narrow service endpoints, CORS/redirect allowlist, input limits, token and log redaction, account isolation, threat tests, `PRIVACY.md`/`SECURITY.md`/permission docs. | GHP-06; repeat after GHP-12 | No generic GitHub proxy or arbitrary GraphQL; wrong user/installation/resource denied; docs reflect actual data flows and retention; release guard passes. |
| GHP-14 | P1 | Accessibility, English/Persian copy, responsive UI, and popup entry to GitHub workspace. | GHP-08, GHP-10, GHP-11 | Keyboard, focus, screen reader, RTL, and 200% zoom checks pass in Chrome and Edge; access states use text, not only color. |
| GHP-15 | P0 | Automated and manual regression matrix: auth, access removal, token expiry/race, rate limits, service outages, GitHub read/write, Jira-only upgrade and core flows, backup exclusion. | GHP-05, GHP-09, GHP-10, GHP-11; repeat after GHP-12 | `npm run verify` passes where applicable; pilot evidence records browser versions, GitHub roles, and Jira regression results; known gaps have owners. |
| GHP-16 | P0 | Rollout: feature flag, staging smoke test, internal pilot, dashboards/alerts, incident drill, rollback, then staged release notes and support guidance. | GHP-13, GHP-14, GHP-15 | Named service owner and on-call; alert and kill switch tested; pilot access/latency/create metrics reviewed; release decision recorded. |

## Task ownership and risk notes

- **Product owner:** GHP-01 scope and success measure; maintain the distinction between repository issues and Projects.
- **Extension owner:** GHP-04/05/08/10/11/12/14/15. Avoid threading GitHub through Jira-specific hooks and the Jira bridge.
- **Service owner:** GHP-03/06/07/09/10/11/12/13/16. This is a new operational responsibility; assign it before production credentials are issued.
- **Security reviewer:** GHP-03/07/13 and the write enablement gate. Review account isolation and uncertain create outcome specifically.

The largest delivery risk is the new service, not the UI. Do the auth/permission spikes before building generic provider abstractions or promising Projects parity. GitHub organization permission approval, Project item visibility, browser extension ID stability, and token refresh behavior are the hard gates.

## Next concrete actions

1. Resolve the GHP-01 priority question and name the GitHub pilot organization/repositories (use test data; do not put credentials in documentation).
2. Run GHP-02 and GHP-03 as time-boxed proof tasks; update the specification with observed API and browser results.
3. Choose the service repository and operating owner, then begin GHP-04 and GHP-06 in parallel within the normal team workflow.
