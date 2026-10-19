# Assignments -- Production Readiness Tracker

## 2026-10-19 — online-school pass (LOCAL, not pushed) · `c45032510` `60fa1bdec`

- [x] **The wizard never published.** Finishing it left the row DRAFT; students' lists hide drafts and
      no web path set PUBLISHED. Finishing now publishes (DRAFT only) and has the role gate it lacked.
- [x] **`assignment_created` was never sent** — `notify.ts` tells the audience from the wizard and
      from the live room's Set homework. The due reminder now speaks the school's language.
- [x] **Web marking.** The Submissions tab was a placeholder; `submissions-core.ts` +
      `submissions-review.tsx`: hand-ins, signed attachments, "12 of 25", score + feedback on
      `gradeSubmission`. TEACHER sees only work they teach.
- [x] **Students attach files** (`presignSubmissionUpload`, attachment kind, 25MB). `submitAssignment`
      now accepts only this school's stored objects (it took any URL, `javascript:` included).
- [ ] Records drift: README lists `teacher-review.tsx` / `submission-form.tsx` / `student-view.tsx`,
      which do not exist, and a publish notification that did not exist until today.
- [ ] Report-card marks ignore `weight`; in-room polls count toward the report card (decision).

**Status:** IN PROGRESS
**Completion:** 80%
**Last Updated:** 2026-10-04

---

## 2026-10-04 — assignments without classes (LOCAL, not pushed)

New schools have no `Class` rows, so "+" failed ("no_classes") and nothing could
be set. An assignment is now set for a grade — one section or the whole grade —
plus a subject (migration `20261004150000_assignment_scope`, **owed on prod**):

- The wizard's information step uses `TeachingScopePicker`; drafts need no class
  and reach nobody until the step saves (`resolveTeachingScope` checks it).
- Students see, open and submit assignments set for their section, grade or a
  legacy class (`my-assignments.ts`, `submit-core.ts`, mobile `shared.ts`) via
  `studentAudienceWhere` in `@/lib/teaching-audience`.
- Teachers: a legacy class they teach, assignments they set, or a subject they're
  assigned in the section/grade (`teacherAssignmentsWhere`, `teachesAssignment`).
- The due-date reminder cron and the parent portal read the audience; exports and
  the mobile DTO name the section or grade (mobile keeps `class_*` alongside
  `grade_id` / `section_id`).

Open:

- [ ] `form.tsx` / `information.tsx` (modal) and `createAssignment` still take a
      class — no UI renders them (S15).
- [ ] Dashboards that count a student's assignments via StudentClass (S14).

## MVP Checklist

- [x] Assignment CRUD operations with Zod validation
- [x] Two-step wizard (information, details/grading)
- [x] Nine assignment types (Homework, Quiz, Test, Midterm, Final Exam, Project, Lab Report, Essay, Presentation)
- [x] Due date management with date picker
- [x] Points and weight configuration
- [x] Targeting — a grade, one of its sections, or (legacy) a class
- [x] Status management (DRAFT, PUBLISHED)
- [x] Student view component (`student-view.tsx`)
- [x] Student submission form (`submission-form.tsx`)
- [x] Teacher review/grading interface (`teacher-review.tsx`)
- [x] CSV export (`export-button.tsx`, `columns/export.ts`)
- [x] Notification dispatch on publish
- [x] Multi-tenant isolation (schoolId scoping)
- [x] RBAC authorization
- [x] Table with search, sort, filter, pagination
- [x] Unit tests (actions + validation)
- [ ] File attachment upload (cloud storage integration)
- [ ] Late submission policy engine

## Known Issues

### P0 -- Critical

_None_

### P1 -- High

- [ ] File upload for submissions not wired to cloud storage (UI exists, backend pending)
- [ ] Teacher-only assignment scoping not enforced (any admin/teacher can edit any assignment)

### P2 -- Medium

- [ ] Grade distribution visualization not implemented
- [ ] Bulk assignment creation (same assignment to multiple classes)
- [ ] Rubric-based grading not yet available

## Enhancements (Post-MVP)

- [ ] Cloud storage integration for file attachments (S3 or Vercel Blob)
- [ ] Late submission policies (penalty per day, grace period, cutoff)
- [ ] Rubrics and marking guides
- [ ] Peer review functionality
- [ ] Plagiarism detection integration
- [ ] Recurring assignments (weekly homework templates)
- [ ] Clone assignment to another class
- [ ] Grade import from CSV
- [ ] Assignment analytics dashboard (class average, distribution, trends)
- [ ] Parent notification on grade publication

---

**Last Review:** 2026-03-19
