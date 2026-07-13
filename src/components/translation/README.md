---
epic: 08
sprint: Q3-2026
title: Translation Engine
file_type: readme
owner: Samia
maturity: Production-ready
completion: 95
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/translation
last_audited: 2026-06-12
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
├── actions.ts         # translate() core (LRU→DB→engine), translateText/Fields, autoTranslate
├── engine.ts          # ⭐ Provider chain: Google → Groq, each behind a circuit breaker — THE import for consumers
├── google.ts          # Google provider — 2.5s timeout, chunking (100 q / 4k chars), transient retry opt-in
├── groq.ts            # Groq LLM fallback provider — free tier, JSON batch protocol, 10s timeout
├── sweep.ts           # Registry+names cache sweep core (shared by i18n:backfill + daily cron)
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
   memoize + return. Miss → ONE chunked `translateBatch` call through the
   **provider chain** (engine.ts: Google → Groq LLM fallback, each behind a
   circuit breaker — 3 consecutive failures open the circuit so a dead
   provider is skipped instantly instead of taxing every render with its
   timeout; Google probes again after 5 min, Groq after 2 min) → persist +
   memoize → return.
4. BOTH providers failing → **body text falls back to the source language**
   (logged, throttled 5-min); **names transliterate** ar→Latin offline.
   Renders never block or throw. (This chain exists because the Google quota
   died 2026-06-14 and silently killed ALL translation for a month.)

### Cache semantics

- `Translation` table (`translation_cache`): unique on
  `(schoolId, sourceText, sourceLanguage, targetLanguage)`. Edits create new
  source keys — self-invalidating; old rows become orphans.
- **Manual overrides** (`provider: "manual"`) are never overwritten by
  prewarm/localize (upserts only touch `lastAccessedAt`) and never pruned.
- Orphan cleanup: `pnpm i18n:prune` (manual, dry-run by default; deletes
  only `provider != "manual" AND hitCount=0 AND createdAt < cutoff` — recency
  is NOT the eviction key because batched reads don't bump `lastAccessedAt`).
- LRU is per-instance, latency-only; correctness never depends on it.

### Prewarm coverage

Every school-scoped registered model's write path either prewarm or is a
VERIFIED exemption (`PREWARM_EXEMPT` in `scripts/audit-untranslated.ts` —
provisioning engines, non-content writes, draft scaffolding; each entry
names its reason). Notifications prewarm at the `dispatchNotification` /
`dispatchNotificationsToAudience` hub, so every feature's notifications warm
both languages automatically. The prewarm ratchet
(`src/tests/i18n/audit-untranslated.test.ts`) fails the suite if a new
write path ships without prewarm.

### Backfill + self-heal sweep

`pnpm i18n:backfill` (`scripts/prewarm-existing.ts`) — CLI over the shared
sweep core (`sweep.ts`) that warms the cache for existing rows AND person
names (students/teachers/guardians/staff as composed full names — exactly
what `getNames()` looks up). Dry-run by default (reports rows/unique/chars
per school×model; catalog-global content costs rows × schools). Create-only,
never overwrites, batch errors skip and continue. Junk/test tenants are
skipped unless `--all-schools`; `Notification` (40k+ transient rows) is
excluded unless `--model Notification`.

`/api/cron/translation-sweep` (daily 03:30 UTC) runs the same core bounded
(`maxTranslations: 2000`, 240s deadline) — the self-heal that keeps NEW
schools (provisioned outside request scope, so never prewarmed), bulk
imports, and provider-outage backlogs translated without anyone thinking
about it. Steady-state runs find zero misses and cost zero provider calls.

### Tests

`src/tests/i18n/translation/` — engine suites: localize, actions, display,
google (timeout/chunk/retry), prune, registry-schema (DMMF drift gate),
memory-cache (LRU semantics), prewarm (direction grouping, no-clobber),
locale (ambient resolution), person (dedupe + transliteration fallback),
search (bilingual conditions). Plus the three audit ratchets in
`src/tests/i18n/audit-untranslated.test.ts` (person-names / zero-translation
features / prewarm gaps) and per-feature batched-call tests beside each
migrated feature.
