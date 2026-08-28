# Generate -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 85%
**Last Updated:** 2026-08-14

---

## MVP Checklist

- [x] Exam template CRUD
- [x] Question distribution configuration
- [x] Distribution editor UI with real-time totals
- [x] Question selection algorithms
- [x] Bloom's taxonomy balancing
- [x] Difficulty distribution enforcement
- [x] Template reuse across classes
- [x] Version library for template history
- [x] Preview before finalization
- [x] Server actions with Zod validation
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Route pages created in app directory (verified 2026-08-14 — the full tree exists under `src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/generate/`: `add/`, `catalog/`, `contributions/`, `templates/`, `versions/`, plus `page.tsx`/`error.tsx`/`loading.tsx`)

---

## Known Issues

### P0 -- Critical

_None._ ~~**No route pages**~~ — **STALE, corrected 2026-08-14.** The directory exists and is
wired; see the MVP checklist above.

### P1 -- High

1. ~~**Hard failure on insufficient questions**~~ -- **STALE, corrected 2026-08-14.** `generateExamQuestions` has always degraded: it fills every distribution slot the bank can cover and reports the rest via `metadata.distributionMet` / `missingCategories`. Only a selection of _zero_ fails. The real defect was that callers **discarded** that metadata, so an under-stocked bank produced a silently short paper; `generateExamPaperFromTemplate` now returns `distributionMet` / `missingCategories` / `totalQuestions` alongside the document and the Use-template dialog names the unfilled slots.

### P2 -- Medium

1. **No question replacement** -- Cannot swap individual questions after generation
2. **Single template per exam** -- Cannot combine multiple templates
3. **No partial distribution filling** -- All-or-nothing on question counts

---

## Enhancements (Post-MVP)

- Graceful degradation when question pool is insufficient
- Post-generation question swapping
- Composite templates (combine multiple)
- Seeded randomization for reproducible exam variants
- Template sharing between teachers

---

**Last Review:** 2026-08-14
