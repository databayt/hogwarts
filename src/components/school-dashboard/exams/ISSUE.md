# Exams -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** ~75%
**Last Updated:** 2026-05-30

> **Authoritative status lives in [`PRODUCTION-AUDIT.md`](./PRODUCTION-AUDIT.md).**
> The old "Route pages not created (BLOCKER)" items below are **resolved** — all
> routes are wired (100+ `page.tsx` under `(school-dashboard)/exams/` +
> `(exam-wizard)/`). Remaining blockers are mostly schema-level (see audit).
>
> **Code-only hardening pass (2026-05-30):** unit suite green (211 tests, was
> 18 failing); added RBAC role×permission matrix tests (`lib/__tests__/permissions.test.ts`),
> CSV/formula-injection escaping (`results/lib/csv-utils.ts`), lang-aware exam
> notifications (`manage/notification-text.ts` — removed hardcoded Arabic),
> and revived 3 dead form-test suites. The wizard section steps now render a
> compact "pure section" preview instead of a scaled mockup floating in a gray box.

---

## MVP Checklist

### Manage Sub-Block

- [x] Multi-step exam creation form (basic info, schedule/marks, instructions)
- [x] Exam status workflow (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
- [x] Calendar view for scheduling
- [x] Marks entry interface with validation
- [x] Analytics dashboard (averages, distribution, rankings)
- [x] Search, filter, and sort
- [x] Conflict detection (same class, overlapping time)
- [x] Export capabilities (CSV, PDF schedule)
- [x] Server actions with Zod validation
- [x] Route pages created in app directory (DONE — all routes wired)

### Question Bank Sub-Block

- [x] 5 question types (MCQ, True/False, Fill-in-Blank, Short Answer, Essay)
- [x] Difficulty levels (Easy, Medium, Hard)
- [x] Bloom's taxonomy classification (6 levels)
- [x] AI-powered question generation
- [x] Tagging and categorization
- [x] Practice mode and sessions
- [x] Catalog tab view
- [x] Server actions with Zod validation
- [x] Route pages created in app directory (DONE — all routes wired)

### Generate Sub-Block

- [x] Exam template management
- [x] Question distribution configuration
- [x] Distribution editor UI
- [x] Question selection algorithms
- [x] Bloom's taxonomy balancing
- [x] Difficulty distribution
- [x] Template reuse across classes
- [x] Version library
- [x] Route pages created in app directory (DONE — all routes wired)

### Mark Sub-Block

- [x] Auto-grading for MCQ/True-False/Fill-in-Blank
- [x] AI-assisted essay and short answer grading
- [x] Rubric-based grading system
- [x] Manual grading interface with override support
- [x] Bulk grading capabilities
- [x] CSV import for marks
- [x] Mobile grading view
- [x] Answer key management
- [x] Server actions with Zod validation
- [x] Route pages created in app directory (DONE — all routes wired)

### Results Sub-Block

- [x] Grade calculation with configurable boundaries
- [x] Class rank computation with tie handling
- [x] Performance analytics (average, median, distribution)
- [x] PDF report generation (3 templates: classic, modern, minimal)
- [x] Batch PDF generation
- [x] CSV import/export for results
- [x] Question-wise breakdown
- [x] Analytics charts
- [x] Cache manager for performance
- [x] Route pages created in app directory (DONE — all routes wired)

### Additional Modules

- [x] Paper composition system with multiple templates (classic, modern, formal, custom)
- [x] Template wizard with 14 configuration steps
- [x] Grading module (grade converter, CGPA calculator, retake manager)
- [x] Progress/schedule tracking
- [x] Mock exam content

### Cross-Cutting

- [x] Multi-tenant isolation (schoolId on all queries)
- [x] Zod validation on all server actions
- [x] TypeScript types for all data models
- [x] i18n dictionary keys (150+ keys, EN/AR)
- [x] RTL support for Arabic
- [x] Route pages wired for all sub-blocks (DONE — 100+ page.tsx)
- [x] Sidebar navigation entries added

---

## Known Issues

### P0 -- Critical

> See [`PRODUCTION-AUDIT.md`](./PRODUCTION-AUDIT.md) for the full, current P0 list.
> The remaining P0s are predominantly **schema migrations** (deferred to an
> approved Neon-branch DB session): bilingual-field removal, `Cascade`→`Restrict`
>
> - soft-deletes, `ExamResult.marksObtained Int`→`Decimal`, `lang` on 17 models,
>   and resolving the dual `Result`/`ExamResult` models.

1. ~~**No route pages exist**~~ -- RESOLVED. All routes are wired (100+ `page.tsx`).
2. **Schema rule violations** -- bilingual fields, missing `lang`, destructive cascades, `Int` marks (see audit §C). Needs a Prisma migration.

### P1 -- High

1. **Gradebook integration** -- Exam results do not sync to gradebook module
2. **OCR dependency** -- AI-assisted marking requires OpenAI API key configuration
3. **AI generation costs** -- No budget controls or cost tracking in production
4. **Orphaned `mark/form.tsx` `QuestionForm`** -- not mounted anywhere; reads a `dictionary.marking.*` structure that is empty in `school-en.json`. Wire its dictionary keys or remove the component.
5. **N+1 / pagination** -- see audit §P1 (7 N+1 patterns, 12 unbounded `findMany`).

### P2 -- Medium

1. **Recurring exams** -- Cannot schedule weekly quizzes automatically
2. **Partial marks** -- Marks are integer-only, no half marks support
3. **Offline mode** -- No offline support for marks entry
4. **Drag-and-drop** -- Calendar rescheduling via drag-and-drop not implemented
5. **Question versioning** -- Editing overwrites original, no history
6. **Real-time collaboration** -- No live updates when multiple teachers grade

---

## Enhancements (Post-MVP)

- Automatic status transitions based on exam date/time
- Plagiarism detection for essay answers
- Video/audio answer support
- Peer grading workflows
- Question import from external formats (QTI)
- Custom PDF template builder
- Performance trend analysis across terms
- Student self-assessment and practice exams

---

**Last Review:** 2026-05-30
