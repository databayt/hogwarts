---
epic: 08
sprint: Q3-2026
title: Translation Engine
file_type: issue
owner: Samia
maturity: Production-ready
completion: 95
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/translation
last_audited: 2026-06-12
---

# Translation Engine — Live Work List

## Done (2026-07-12 provider-chain resilience + backfill "final fix")

**Root cause found for "database content is not translated":** the Google
Translate quota died 2026-06-14 (403 `userRateLimitExceeded` on every call —
billing/quota needs fixing in the Google Cloud console) and NOTHING was
cached for a month; every page silently fell back to source text. The demo
school (created after the outage began) had exactly 1 cache row.

- [x] **Provider chain (`engine.ts`)** — Google → Groq LLM fallback
      (`groq.ts`, llama-3.1-8b-instant, free tier), each behind its own
      circuit breaker (3 failures → open; Google probes every 5 min, Groq
      every 2 min). All consumers (localize/actions/prewarm) now import
      `./engine`; nothing imports google.ts/groq.ts directly. One dead
      provider can never again silently kill translations or tax renders
      with its timeout.
- [x] **Sweep core (`sweep.ts`)** — shared registry+person-names walker
      behind `pnpm i18n:backfill` AND the new daily
      `/api/cron/translation-sweep` (03:30 UTC, bounded 2000
      translations/240s). Names (students/teachers/guardians/staff) sweep as
      composed fullName — exactly what getNames() looks up. Junk tenants
      skipped; Notification excluded by default; values >1500 chars left to
      read-time caching; global memo dedupes across schools.
- [x] **Prune widened** — predicate now `provider != "manual"` (was
      `= "google"`) so engine/sweep rows ("groq"/"auto") stay evictable.
- [x] **Vercel GROQ_API_KEY replaced** — the 215-day-old prod/preview key
      was revoked ("Invalid API Key"); replaced with the working key and
      verified live against the Groq API.
- [x] Tests: engine.test.ts (chain/breaker/error-preference),
      groq.test.ts (JSON protocol, count-mismatch, blank substitution,
      chunking, retry policy); prewarm/localize/actions mocks retargeted to
      engine. Suite: 180 green.

## Done (2026-06-17 read-path degradation polish)

- [x] **403 rate-limit now classified transient** — Google returns
      `userRateLimitExceeded` / `rateLimitExceeded` as **403** (not 429); the retry
      policy used to treat all 403 as permanent, so prewarm never retried a throttle.
      Now 403-with-`rateLimitExceeded` is retryable; a 403 bad-key (no rateLimit
      reason) stays permanent. (+2 google.test.ts cases.)
- [x] **Read-path fallback log downgraded to `console.warn`** (`localize.ts`) — the
      per-render catch logged the raw Error via `console.error`, which tripped the
      Next dev error overlay on every render under quota exhaustion and spammed logs.
      The loud, throttled production signal still lives in google.ts's
      `reportTranslationDegraded`. Fallback-to-source behavior unchanged.

## Done (2026-06-10/12 production-readiness pass)

- [x] In-memory LRU on the legacy `translate()` path — all getText/getName/getLabels callers inherit zero-DB hot-term reads
- [x] `translateBatch` chunking guard (100 q / 4k chars) + 2.5s timeout + transient-only opt-in retry
- [x] **Registry schema-true** (Department→departmentName, GradingScheme description
      dropped, YearLevel=levelName) + NEW Conference/Notification/StreamCategory/Route/
      YearLevel; `CATALOG_GLOBAL` set pinned to schema by registry-schema.test.ts
- [x] **Three CI ratchets**: person-names raw (0), zero-translation features,
      prewarm gaps — with verified `PREWARM_EXEMPT` (reasons inline)
- [x] **Prewarm everywhere school-scoped**: announcements (create/update/wizard/
      templates), events (info+schedule wizards), classes (+wizard), classrooms,
      conference (create/update/sessions), departments, year-levels ×2, exams quick +
      qbank standards, stream/saas video, **dispatchNotification hub** (covers every
      feature's notifications in one place; cron/webhook-safe void form)
- [x] Batched migration of per-row getText loops: announcements (list/detail/
      suggestions/search), events (list/detail/previous/search), classes (+search),
      classrooms ×3, exams admin/student/guardian/results/manage/upcoming, grades,
      students, teachers, admission, transportation, parent-portal (announcements/
      events/attendance/grades/report-cards), notifications (polled bell + center),
      conference, departments, year-levels, subjects, library, stream catalog,
      mobile subjects/catalog/contacts routes
- [x] `pnpm i18n:prune` (age+zero-hits keyed) + **`pnpm i18n:backfill`**
      (scripts/prewarm-existing.ts — deploy-time corpus sweep, dry-run default,
      create-only, cost report)
- [x] 46 stale engine tests repaired + **32 new engine tests** (memory-cache LRU,
      prewarm no-clobber/direction-grouping, locale chain, person fallback, search
      shapes) — i18n suite 250 green / 19 files
- [x] Bilingual `search()` adopted in announcements/events/classes/assignments/
      teachers/students lists; reverse-lookup cap 50→200 (named constant)

## P1 — remaining

- [ ] **Route feature** (transportation/routes) — only remaining zero-translation
      feature + unwired prewarm (`transportation/actions/routes.ts`); transportation
      is under active concurrent migration, finish there
- [ ] Run `pnpm i18n:backfill -- --execute` at deploy (after reviewing the dry-run
      cost report) so the existing corpus reads seamlessly from day one
- [ ] Single-value `getText` long-tail (~20 files: layouts school-name, config
      titles, dashboard/profile/finance single strings) — legitimate per the helper
      rule; verify none sit in `.map()` loops as features evolve

## P2 — enhancements

- [ ] Global-catalog translation tier: saas-dashboard Subject/Book have no schoolId;
      per-school cache can't serve them. Options: schoolId="**global**" cache rows, or
      accept source-language on operator surfaces (current behavior).
- [ ] Transportation Stop + remaining lang-bearing transportation models as registry
      candidates (Route is registered now)
- [ ] `getLabels`/`getNames` internal findMany batching (currently dedupe + parallel
      per-unique-value translate; LRU makes repeats free, but a cold page with many
      unique names still fans out)
- [ ] Placeholder-preserving template-body translation (AnnouncementTemplate/
      NotificationTemplate bodies are deliberately unregistered — MT mangles
      `{{placeholders}}`)
- [ ] Degradation observability beyond the throttled log (health-check field /
      dashboard counter for translation fallback rate)

## Known gotchas (for the record)

- Engine API was renamed in the clean-names pass (translateWithCache→translate,
  getDisplayText→getText, googleTranslate→translateRaw) — 3 test files imported dead
  symbols for weeks because CI's test job never ran (`pnpm tests` typo, fixed)
- The LRU is process-level: tests MUST `memoClear()` in beforeEach
- `after()` requires next/server ≥15; vitest mocks it via the importOriginal pattern
