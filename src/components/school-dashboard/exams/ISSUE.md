---
epic: 03
sprint: Q3-2026
title: Exams
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 78
tracker: https://github.com/databayt/hogwarts/issues/321
docs: https://ed.databayt.org/en/docs/exams
last_audited: 2026-06-14
---

# Exams -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 78%
**Last Updated:** 2026-06-14

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
- [ ] Route pages created in app directory (BLOCKER)

### Question Bank Sub-Block

- [x] 5 question types (MCQ, True/False, Fill-in-Blank, Short Answer, Essay)
- [x] Difficulty levels (Easy, Medium, Hard)
- [x] Bloom's taxonomy classification (6 levels)
- [x] AI-powered question generation
- [x] Tagging and categorization
- [x] Practice mode and sessions
- [x] Catalog tab view
- [x] Server actions with Zod validation
- [ ] Route pages created in app directory (BLOCKER)

### Generate Sub-Block

- [x] Exam template management
- [x] Question distribution configuration
- [x] Distribution editor UI
- [x] Question selection algorithms
- [x] Bloom's taxonomy balancing
- [x] Difficulty distribution
- [x] Template reuse across classes
- [x] Version library
- [ ] Route pages created in app directory (BLOCKER)

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
- [ ] Route pages created in app directory (BLOCKER)

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
- [ ] Route pages created in app directory (BLOCKER)

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
- [x] **Gradebook spine** — all scoring surfaces write to the unified `Result` table via `grades/lib/gradebook.ts`
- [x] **Auto-generate from template** — one-click question selection wired into the exam-generate wizard (`wizard/exam-wizard-v2/questions/auto-generate.ts`)
- [x] **Answer-key bug fixed** — `getOrCreateAnswerKey` now reads `GeneratedExamQuestion` relation instead of a non-existent `questionIds` field; empty answer keys no longer produced
- [x] **Finalize loop** — `exams/mark/actions/finalize.ts`: `finalizeExamResults` aggregates `MarkingResult` → `ExamResult` + unified `Result`, dispatches publish notifications
- [x] **Instant-grade on submit** — `submitExamSession` auto-marks fully-objective exams and writes the result immediately
- [x] **Exam reminders cron** — `/api/cron/exam-reminders` notifies students/teachers ahead of scheduled exams
- [x] **Unit tests** — `src/tests/school-dashboard/exams/gradebook.test.ts` (pure helpers) + `auto-generate-coverage.test.ts` (type shapes + coverage logic)
- [ ] Route pages wired for all sub-blocks (BLOCKER)
- [ ] Sidebar navigation entries added

---

## Known Issues

### P0 -- Critical

1. **No route pages exist** -- The entire `src/app/[lang]/s/[subdomain]/(school-dashboard)/exams/` directory is missing. All components are built but not accessible via URL.

### P1 -- High

1. **OCR dependency** -- AI-assisted marking requires OpenAI API key configuration
2. **AI generation costs** -- No budget controls or cost tracking in production

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

---

## Resolved Issues

- **2026-06-14 — Automation pass.** Auto-generate wired into wizard (one-click
  template → question selection); answer-key empty-key bug fixed (was reading
  non-existent `questionIds` field, now reads `GeneratedExamQuestion` relation);
  finalize loop (`finalizeExamResults` / `finalizeStudentExam`) writes both
  `ExamResult` and unified `Result`, dispatches results-published notification;
  instant-grade on submit for objective-only exams; exam-reminders cron added.
  Gradebook integration P1 resolved via `grades/lib/gradebook.ts` spine.

**Last Review:** 2026-06-14
