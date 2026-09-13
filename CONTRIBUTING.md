# Contributing to QueueMint

QueueMint is intentionally a Jira companion, not a Jira replacement. Read `docs/PRODUCT.md` and `docs/ROADMAP.md` before proposing a large feature.

## Required checks

```bash
npm install
npm run check:architecture
npm run typecheck
npm run build
```

## Code rules

- No production `.ts`, `.tsx`, `.js`, `.mjs`, or `.css` file over 300 lines.
- Split by responsibility.
- Keep transport out of presentation components.
- Reuse existing Jira mutation paths and previews.
- Avoid silent multi-issue writes.
- Avoid new browser permissions when the workflow can be solved without them.
- Do not commit customer/private Jira data.

## Pull requests

Explain:

- the user problem
- why native Jira does not already solve it well enough
- the behavior change
- browser/Jira permission impact
- validation performed
- screenshots for meaningful UI changes
