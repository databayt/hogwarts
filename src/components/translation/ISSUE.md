---
epic: 08
sprint: Q3-2026
title: Translation Engine
file_type: issue
owner: Samia
maturity: Production-ready
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/translation
last_audited: 2026-06-11
---

# Translation Engine — Live Work List

## Done (2026-06-10/11 production-readiness pass)

- [x] In-memory LRU on the legacy `translate()` path — all getText/getName/getLabels callers inherit zero-DB hot-term reads
- [x] `translateBatch` chunking guard (100 q / 4k chars) + 2.5s timeout + transient-only opt-in retry
- [x] Prewarm on create AND update: Announcement, Event, Class, Assignment, Exam
- [x] `pnpm i18n:prune` manual cleanup (age + zero-hits keyed; spares manual overrides)
- [x] Batched migration of legacy per-row getText loops: grades, students, transportation
      (translate-display rewritten, +11 tests), parent-portal announcements/events,
      mobile catalog subjects, stream catalog, exam wizard surfaces
- [x] 46 stale engine tests repaired; registry-schema test validates TRANSLATABLE against Prisma

## P1 — remaining

- [ ] **Finish the batched migration** (in flight): teachers/staff/classrooms/subjects/
      assignments listings, admission, finance, school admin/config, mobile contacts +
      subjects routes, attendance, notifications, messaging, exams content
      (concurrently being migrated). Grep `from "@/components/translation/display"` —
      target: no `getText` inside any `.map()`/loop.
- [ ] Prewarm backlog: Lesson, Chapter, Material, Quiz, Book, Document, StreamCourse,
      GradingScheme write actions (wire `after(() => prewarm(...))` when those actions
      gain translatable-field writes). Subject/Section: no school-scoped writes to their
      translatable fields exist today (catalog Subject is global, no schoolId) — revisit
      if that changes.

## P2 — enhancements

- [ ] Global-catalog translation tier: saas-dashboard Subject/Book have no schoolId;
      per-school cache can't serve them. Options: schoolId="**global**" cache rows, or
      accept source-language on operator surfaces (current behavior).
- [ ] Registry candidates reported by migrations: transportation Route/Stop (currently
      via getLabels, which works but skips the single-findMany path)
- [ ] `getLabels`/`getNames` internal findMany batching (currently dedupe + parallel
      per-unique-value translate; LRU makes repeats free, but a cold page with many
      unique names still fans out)

## Known gotchas (for the record)

- Engine API was renamed in the clean-names pass (translateWithCache→translate,
  getDisplayText→getText, googleTranslate→translateRaw) — 3 test files imported dead
  symbols for weeks because CI's test job never ran (`pnpm tests` typo, fixed)
- The LRU is process-level: tests MUST `memoClear()` in beforeEach
- `after()` requires next/server ≥15; vitest mocks it via the importOriginal pattern
