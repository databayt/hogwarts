---
epic: 08
sprint: Q3-2026
title: Translation Engine
file_type: readme
owner: Samia
maturity: Production-ready
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/translation
last_audited: 2026-06-11
---

## Translation — Dynamic Content Engine (System B)

### Overview

On-demand translation for user-generated DB content (announcements, subject
names, student names…). Content is stored in ONE language (`lang` field);
the viewer's locale decides what they see. Three-tier resolution keeps the
read path imperceptible: **in-memory LRU → per-school `Translation` DB
cache → Google Translate v2** — plus **prewarm-on-write** so the first
reader in the other language is already a cache hit. Static UI strings are
the sibling block: [`internationalization/`](../internationalization/README.md)
(System A).

### File Structure

```
src/components/translation/
├── localize.ts        # ⭐ Batched engine: localize(model, rows) / localizeOne — ONE findMany per render
├── registry.ts        # TRANSLATABLE map: model → translatable fields (single source of truth)
├── prewarm.ts         # prewarm(model, row) — call via after() from write actions
├── memory-cache.ts    # Process LRU (5k entries, ≤120 chars): memoGet/memoSet/memoClear
├── locale.ts          # getDisplayLang() — ambient viewer locale (x-locale → cookie → ar)
├── person.ts          # getNames()/getLabels() — batched names/labels, transliteration fallback
├── display.ts         # getText()/getFields() — single-value path (LRU-backed via translate())
├── actions.ts         # translate() core (LRU→DB→Google), translateText/Fields, autoTranslate
├── google.ts          # translateRaw/translateBatch — 2.5s timeout, chunking (100 q / 4k chars), transient retry opt-in
├── search.ts          # Bilingual cache-only search OR-conditions (no API cost)
├── transliterate.ts   # Offline ar→Latin (names fallback when API down)
├── util.ts            # withLang(), detectScript(), detectLang(), needsTranslation()
├── types.ts           # Lang = "en" | "ar"
└── config.ts          # GOOGLE_TRANSLATE_API_URL
```

### Which API do I use?

| Situation                                            | Use                                              |
| ---------------------------------------------------- | ------------------------------------------------ |
| List of rows of a registered model (see registry.ts) | `localize(model, rows, { schoolId, lang })`      |
| One row of a registered model (detail page)          | `localizeOne(model, row, { schoolId, lang })`    |
| Person names (students, teachers, guardians)         | `getNames(rows, accessor, lang, schoolId)`       |
| Arbitrary short strings / unregistered fields        | `getLabels(values, lang, schoolId)`              |
| One genuinely single value                           | `getText(text, contentLang, lang, schoolId)`     |
| Write path (create/update server action)             | `after(() => prewarm(model, row, { schoolId }))` |

**Never** call `getText` inside a `.map()` — that's the N+1 the batched
APIs exist to kill. The hardcoded-string + audit ratchets don't catch this;
code review and the per-feature batched-call tests do.

### How resolution works

1. `detectScript(value)` decides the TRUE source language (never trust the
   stored `lang` flag — mislabeled rows must not render garbled).
2. Values already in the display script are returned as-is (zero cost).
3. LRU hit → return. DB cache hit (ONE `findMany` for the whole batch) →
   memoize + return. Miss → ONE chunked `translateBatch` call → persist +
   memoize → return.
4. Google failure → **body text falls back to the source language** (logged,
   throttled 5-min); **names transliterate** ar→Latin offline. Renders never
   block or throw.

### Cache semantics

- `Translation` table (`translation_cache`): unique on
  `(schoolId, sourceText, sourceLanguage, targetLanguage)`. Edits create new
  source keys — self-invalidating; old rows become orphans.
- **Manual overrides** (`provider: "manual"`) are never overwritten by
  prewarm/localize (upserts only touch `lastAccessedAt`) and never pruned.
- Orphan cleanup: `pnpm i18n:prune` (manual, dry-run by default; deletes
  only `provider=google AND hitCount=0 AND createdAt < cutoff` — recency is
  NOT the eviction key because batched reads don't bump `lastAccessedAt`).
- LRU is per-instance, latency-only; correctness never depends on it.

### Prewarm coverage

Wired (create + update, via `after()`): Announcement, Event, Class,
Assignment, Exam. See [ISSUE](ISSUE.md) for the not-yet-wired backlog and
why Subject/Section have no school-scoped writes to prewarm.

### Tests

`src/tests/i18n/translation/` — engine suites (localize, actions, display,
google, prune, registry-schema) + per-feature batched-call tests beside
each migrated feature (e.g.
`src/tests/school-dashboard/transportation/translate-display.test.ts`).
