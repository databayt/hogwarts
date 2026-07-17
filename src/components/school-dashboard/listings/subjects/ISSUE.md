# Subjects — Production Readiness Tracker

**Status:** 🟢 READY
**Completion:** 90%
**Last Updated:** 2026-06-14

---

## MVP Checklist

- [x] CRUD operations with Zod validation
- [x] Subject catalog management
- [x] Browse by education level (elementary, middle, high)
- [x] Subject detail with chapters and materials
- [x] Search and filtering
- [x] Class and teacher assignment
- [x] Multi-tenant isolation (schoolId scoping)
- [x] Catalog browsing experience (hero, grid, cards)
- [x] Contribution system (materials, assignments)
- [x] RBAC authorization checks

## Known Issues

### P2 — Medium

- [ ] Prerequisites tracking not yet implemented
- [ ] Curriculum standards mapping not yet implemented
- [ ] Learning outcomes not yet defined per subject

## Enhancements (Post-MVP)

- [ ] Prerequisites tracking between subjects
- [ ] Curriculum standards alignment
- [ ] Learning outcomes per subject
- [ ] Subject grouping (electives, core, etc.)
- [ ] Grade-level subject configuration
- [ ] Subject-wise performance analytics
- [ ] Bulk "hide all videos from instructor X" (today the instructor preference
      only re-sorts; per-video hide is manual via the catalog controls)

## Resolved

- **2026-07-16 — Hid the "Customize Content" panel + i18n gaps on the subject
  detail page.** `subjects/[slug]/page.tsx` no longer renders
  `SchoolCatalogCustomization` (the admin hide/show + contribute collapsible);
  the component + its actions (`topic-overrides`, `ContentOverride`,
  `setLessonQuizHidden`) are retained, just not surfaced here. Removed the
  now-dead admin-only `db.video.findMany` + `videosByLesson`/`quizHiddenLessonIds`
  machinery it fed. i18n: `catalog-content-sections.tsx` count units
  (`test/tests`, `exam/exams`, `item/items`, `pg avg`) and the `Diagnostic`
  exam-type now read dictionary keys — added `unitExam/unitExams/unitTest/
unitTests/unitItem/unitItems/pagesAvg` + `examTypes.diagnostic` to both
  `school-en.json` and `school-ar.json` (parity test green). tsc 0 errors.
  **NOTE:** the panel was removed for ALL subject detail pages (route is generic
  `[slug]`), not just `sd-g1-math`.
- **PENDING (blocked on DB) — `sd-g1-math` still shows leftover Grade-7 chapters
  on the live demo.** The corrected Grade-1 structure (Numbers 0-9, Add/Sub
  within 9, Numbers 10-99, Measurement — 5ch/47le) is staged in the working tree
  (`curriculum/sd/g1/`, `prisma/seeds/catalog/sd-content.ts`). Apply with
  `pnpm db:seed:single sd` (fixes chapters + rotating concept thumbnails) then
  `pnpm db:seed:single sd-content` (qbank + exams) — but these must run against
  the live demo DB (Neon **account#2** `ep-muddy-mountain`, separate login). The
  local `.env` points at the quota-frozen account#1 DB (`ep-little-credit`,
  unreachable), so the seed can't run from the dev environment as-is.
- **2026-06-14 — School catalog customization controls** (part of the
  LMS/Stream flow pass, tracked under #323): wired the previously-dead per-video
  / per-instructor hide toggle (the page now fetches each lesson's videos +
  override state); added a per-lesson **quiz hide** control
  (`ContentOverride.hideQuiz` + `setLessonQuizHidden`, enforced in stream's
  `getLessonContent`); `toggleContentOverride` now preserves the override row
  while a quiz override remains. tsc clean, 54 catalog + 259 stream tests green.
  Schema (`ContentOverride.hideQuiz`) is deploy-pending (`prisma db push`).

---

**Last Review:** 2026-06-14
