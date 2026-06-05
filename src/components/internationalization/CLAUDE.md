---
epic: 08
sprint: Q3-2026
title: Internationalization
file_type: claude
owner: Samia
maturity: In Progress
completion: 60
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/translation
last_audited: 2026-05-25
---

# Internationalization Block

## Context

Internationalization — Q3 2026 sprint epic 08, maturity `In Progress`, ~60% complete. See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [326](https://github.com/databayt/hogwarts/issues/326).

## Before You Start

1. Read `README.md` here for routes, props, and integration points
2. Read `ISSUE.md` here for the P0/P1/P2 priorities + MVP checklist
3. Skim the [Q3 Sprint Plan](https://kun.databayt.org/en/docs/sprint) for the epic's owner + bet
4. Check the [tracker](https://github.com/databayt/hogwarts/issues/326) for cross-feature dependencies

## Key Decisions

_To be filled in — capture architectural invariants and the "why" behind non-obvious choices._

## Danger Zones

_To be filled in — places not to break, shared state, cross-tenant boundaries._

## Related Blocks

_Cross-links to neighbor `CLAUDE.md` files — call out which ones consume / are consumed by this block._

## After You Finish

1. Update `ISSUE.md` — check completed items, add new issues found
2. Update `README.md` — if routes, files, or completion% changed; bump frontmatter `completion` and `last_audited`
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. If you touched DB: write a migration test before merging
