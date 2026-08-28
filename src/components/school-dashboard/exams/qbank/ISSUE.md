# Question Bank -- Production Readiness Tracker

**Status:** IN PROGRESS
**Completion:** 72%
**Last Updated:** 2026-08-14

---

## Resolved 2026-08-14 — the Lumos lesson-quiz bridge

Traced from the Lumos side (`src/components/lumos/ISSUE.md` → 2026-08-14 second
pass close log). Two things were closed here:

- **A qbank question could never reach a lesson's practice quiz.**
  `createQuestion` writes a catalog `Question` and self-approves it
  (APPROVED + PUBLISHED), but only ever set `catalogSubjectId` — and Lumos'
  lesson quiz reads **`catalogLessonId`**. So the one authoring lane that
  publishes instantly could not target a lesson, while the one that can
  (`listings/subjects/catalog` `submitQuestion`) is platform-review-gated.
  The form now carries a chapter → lesson picker
  (`lesson-attach-field.tsx`) which calls the SAME route handlers as the Lumos
  upload dialog (`/api/lumos/proposable-chapters`,
  `/api/lumos/proposable-lessons`) — scope, tenant gating, hidden-content
  subtraction and name translation stay defined once, in
  `lumos/teach/get-proposable-lessons.ts`. **Do not build a second lesson
  enumerator here.** The server re-derives the lesson and refuses one that is
  not under the chosen subject; `updateQuestion` keeps the catalog row's link
  in step, with an empty value meaning an explicit detach. No schema change —
  `QuestionBank.catalogLessonId`, `Question.catalogLessonId` and the composite
  index already existed.
- **FILL_BLANK could not be saved at all.** `createQuestion`/`updateQuestion`
  spread the validated discriminated union straight into Prisma, and its
  FILL_BLANK arm carries `acceptedAnswers`/`caseSensitive`, which are **not
  columns** — every save threw "Unknown argument". Both now map columns
  explicitly (`questionBankColumns`) and store the answer key in `options` as
  `{ acceptedAnswers, caseSensitive }` — the shape the edit form reads back AND
  the shape the Lumos grader expects (`lumos/lib/lesson-quiz.ts`).

### Found while browser-verifying the picker (2026-08-14) — FIXED same day

- [x] **The Subject select lists 123 rows with duplicate names and no grade.**
      FIXED: `getSchoolSubjectOptions` now carries the grade (from the school's
      own `SubjectSelection.grade`, falling back to the catalog's
      `Subject.grades` tag) and the new `subjectOptionLabel()` renders
      `Grade 11 · العلوم التجارية` / `الصف 11 · العلوم التجارية`. The filter
      option's VALUE stays the bare name — it matches row data — only the label
      changed. Verified in the browser: 123/123 labelled, zero unlabelled, the
      two `العلوم التجارية` rows now distinguishable, correct in en and ar/RTL.
      The helper change is additive, so the **other six** subject pickers that
      share it (exam wizard, manage wizard, ai-generate, classes wizard, grades
      wizard, generate templates) can adopt the label with a one-line change —
      they all have the same ambiguity today. Original report:
      Observed on the demo school: "العلوم التجارية" appears twice (grade 11 and
      grade 12), mutually indistinguishable, and the same holds for most
      subjects — the catalog seeds **one Subject per grade** and deliberately
      leaves the grade out of `Subject.name`. Picking the right one is a coin
      flip. This is exactly the failure the Lumos block documents in its
      `CLAUDE.md` ("Any list of subjects rendered without their grade is a
      bug"), which is why the video upload dialog walks grade → subject instead
      of listing subjects flat. The new lesson tier is correctly scoped once a
      subject is chosen, so this is the tier ABOVE it. Fix = render the grade
      alongside the name, sourced from `SubjectSelection.gradeId →
AcademicGrade.gradeNumber` (`getProposableCatalog()` already returns
      exactly that tree), and derive the label from `gradeNumber`, never from
      `AcademicGrade.name`.

Still open here, unchanged: the moderation asymmetry (`createQuestion`
self-approves into the catalog at PRIVATE-by-default while `submitQuestion`
goes PENDING) and `contributeExamToCatalog` bypassing the approval queue. Both
lanes work; they just moderate differently. Recorded, not fixed.

---

## MVP Checklist

- [x] 5 question types (MCQ, True/False, Fill-in-Blank, Short Answer, Essay)
- [x] Difficulty levels (Easy, Medium, Hard)
- [x] Bloom's taxonomy classification (6 levels)
- [x] AI-powered question generation
- [x] Tagging and categorization system
- [x] Practice mode and practice sessions
- [x] Catalog tab browsing
- [x] Search with case-insensitive filtering
- [x] Server actions with Zod validation
- [x] Multi-tenant isolation (schoolId scoping)
- [ ] Route pages created in app directory (BLOCKER)
- [ ] Bulk CSV import tested end-to-end

---

## Known Issues

### P0 -- Critical

1. **No route pages** -- `src/app/.../exams/qbank/` directory does not exist

### P1 -- High

1. **AI generation requires API key** -- No graceful fallback if OPENAI_API_KEY not configured
2. **No question versioning** -- Edits overwrite original, no change history

### P2 -- Medium

1. **No image support in questions** -- Only external URL field, no upload
2. **Tag autocomplete performance** -- Loading all tags at once for large datasets
3. **No question dependencies/sequences** -- Cannot link related questions
4. **No collaborative review** -- Single-editor model only

---

## Enhancements (Post-MVP)

- Image upload support for questions
- Question versioning with history
- Question collections/pools
- Collaborative review workflow
- Import from QTI format
- Advanced analytics dashboard for question effectiveness

---

**Last Review:** 2026-03-19
