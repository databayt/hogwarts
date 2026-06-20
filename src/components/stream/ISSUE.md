---
epic: 05
sprint: Q3-2026
title: Stream (LMS)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 80
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-06-14
---

# Stream (LMS) — Production Readiness Tracker

**Status:** BUILT
**Completion:** 80%
**Last Updated:** 2026-06-14

---

## MVP Checklist

_Bootstrap from the Q3 epic tracker (https://github.com/databayt/hogwarts/issues/323). Items there should map 1:1 to
checkboxes here. The tracker is canonical for cross-feature visibility; this file is
canonical for code-side context (read by the `/report` agent)._

- [ ] _To be filled in_

## Known Issues

### P0 — Critical

- [ ] _To be filled in_

### P1 — High

- [x] **Admin "Review" tab wired up** (2026-06-14) — `settings/page.tsx` now
      fetches `getPendingVideos()` (admin-gated, in the existing `Promise.all`)
      and passes `reviewContent={<VideoReviewContent .../>}` + `pendingReviewCount`.
      Also applied the previously-deferred optimizations for this now-live path:
      `reviewVideo` is now a single tenant-scoped `updateMany` (the write carries
      `schoolId`, not just the read) and `Video @@index([schoolId, approvalStatus])`
      was added.
- [x] **Lesson quiz → gradebook bridge** (2026-06-14) — `submitLessonQuiz`
      (Phase C) now writes to the unified `Result` table via
      `grades/lib/gradebook.ts`: `resolveStudentClassForSubject` finds the
      student's class for the subject, then `upsertGradebookResult` persists the
      score with idempotent match on `(schoolId, studentId, examId/assignmentId/subject+title)`.
      Quiz scores now appear in the grades UI and feed into report cards. Callers
      skip the write when `resolveStudentClassForSubject` returns `null` (student
      not enrolled in a class for that subject).

### P2 — Medium

- [ ] `Video.price`/`VideoPurchase.amount` Float→Decimal migration (deferred —
      shared-DB table rewrite + ~13 read-site `Number()` conversions).
- [ ] Server-action `message`-string + `search-bar.tsx` i18n consumption layer.

## Resolved Issues

_Chronological close log — appended as items ship._

- **2026-06-19 — No-video lesson fallback to marketing clip.** The lesson
  player (`dashboard/lesson/content.tsx`) now plays the public SaaS marketing
  "story" video (`asset("/media/story.mp4")`) when a lesson has no videos
  (`availableVideos.length === 0`), instead of a disabled play button + empty
  player. Gated by `isFallbackVideo` so it never records watch-progress or
  auto-completes the lesson, and never replaces a paywalled (paid+unpurchased)
  video's locked UX. tsc clean.

- **2026-06-14 — Optimization pass.** Removed ~1,870 lines of dead code (incl.
  the only `@tiptap` importer, plus `@dnd-kit`/canvas/util dead files),
  parallelized serial DB waterfalls across 7 fetchers/actions, collapsed
  `getTeacherStats` counts → `groupBy` and `getSchoolEnrollments` → `_count`,
  fixed a broken `bulkEnrollStudents` `revalidatePath`, killed ~4Hz video-player
  listener churn (stable `actions` + ref-mirrors + media-session throttle),
  demoted the home page + 5 sub-sections to Server Components, lazy-loaded the
  lottie animation, and added 3 composite indexes (deploy-pending). tsc clean,
  250/250 stream unit tests green. See `ISSUES.md` → "Optimization Pass".

## Enhancements (Post-MVP)

_Deferred to next quarter+._
