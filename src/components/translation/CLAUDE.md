---
epic: 08
sprint: Q3-2026
title: Translation Engine
file_type: claude
owner: Samia
maturity: Production-ready
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/translation
last_audited: 2026-06-11
---

# Translation Engine Block

## Context

Dynamic DB-content translation (System B): registry-driven batched
`localize()` over a 3-tier cache (LRU → `Translation` table → Google v2),
with prewarm-on-write. See [README](README.md) for the API decision table
and [ISSUE](ISSUE.md) for the backlog. Static UI dictionaries are
[internationalization/](../internationalization/CLAUDE.md) (System A).

## Before You Start

1. Read `README.md` — especially "Which API do I use?"
2. New translatable model/field? ONE edit in `registry.ts` TRANSLATABLE map
   (`registry-schema.test.ts` validates fields against the Prisma schema)
3. New write action for registered content? Wire
   `after(() => prewarm(model, row, { schoolId }))` on the success path

## Key Decisions

- **Source-language truth = `detectScript(value)`**, never the stored `lang`
  flag — a mislabeled row must render correctly, not garbled. prewarm uses
  the same rule so cache keys always line up with read-time keys.
- **Batched-only on lists**: `localize()` resolves the whole render in ONE
  `findMany` + ONE chunked Google call. The legacy single-value path
  (`getText` → `translate()`) is LRU-backed but still 1 DB hit per unique
  value — acceptable for single values, an N+1 in a loop.
- **Non-destructive prewarm/upserts**: `update: { lastAccessedAt }` only.
  A human's `provider:"manual"` correction must survive every re-prewarm.
- **Fallback semantics (deliberate)**: body text falls back to SOURCE
  language on API failure (transliterating paragraphs produces gibberish);
  person names transliterate ar→Latin (a name in the wrong script is
  unreadable). Both log via the throttled degradation reporter in google.ts.
- **Read path fails fast** (2.5s timeout, NO retry) — a hung Google socket
  must not hang a page render. Retry (`{ retry: true }`) is opt-in and used
  only by prewarm, which runs off the response path via `after()`.
- **Prune is age+zero-hits keyed, NOT recency** — `localize()`'s batched
  reads deliberately don't bump `lastAccessedAt` (would add a write per
  render), so recency-keyed eviction would delete the hottest rows.

## Danger Zones

- **Never clobber `translatedText` in an upsert** — manual overrides die.
- **Never trust `row.lang` for translation direction** — use detectScript.
- **`Message` has NO schoolId** — scope via Conversation if you ever
  register messaging content.
- **Global catalog (Subject/Book in saas-dashboard) has no schoolId** —
  the per-school cache can't key it; localize() no-ops without a tenant.
  Leave those surfaces alone or design a global-cache tier first.
- **memoClear() in beforeEach** for any test touching `translate()`/LRU —
  the process-level cache bleeds across tests otherwise.
- **`"use server"` files** (actions.ts, google.ts, display.ts) may only
  EXPORT async functions — helpers go in non-action modules.

## Related Blocks

- [internationalization/](../internationalization/CLAUDE.md) — System A;
  provides `getDisplayLang()`'s `x-locale` header via src/proxy.ts.
- Every content feature (announcements, exams, transportation, …) consumes
  this engine; reference migration: listings/announcements + the committed
  patterns in listings/grades and transportation/shared/translate-display.

## After You Finish

1. `pnpm vitest run src/tests/i18n/translation/` — engine suites green
2. `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
3. Update `ISSUE.md` (prewarm coverage, registry additions)
