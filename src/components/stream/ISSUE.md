---
epic: 05
sprint: Q3-2026
title: Stream (LMS)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-07-11
---

# Stream (LMS) — Production Readiness Tracker

**Status:** BUILT
**Completion:** 85%
**Last Updated:** 2026-07-11
**QA guide:** [hogwarts#377](https://github.com/databayt/hogwarts/issues/377) — full flow, sub-flows & test cases (mermaid charts + walkable checklists + release gate)

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
      Now also covers `video-settings-dialog.tsx` + `video-review-content.tsx`
      (fully hardcoded English, incl. the 2026-07-11 platform-gate hints).
- [ ] Abandoned direct uploads leave orphaned S3 objects — the presigned PUT
      lands bytes before the `uploadVideo` row exists, so closing the dialog
      after upload strands the object (and it never counts against quota).
      Candidate: lifecycle rule on `stream/*/video/*` or a weekly sweep cron
      diffing keys vs `Video.storageKey`.
- [ ] `/api/blob/presign` doesn't pre-check the school storage quota — the
      quota check happens at `uploadVideo` submit, after bytes are already in
      S3. Cheap fix: call `checkSchoolVideoQuota(schoolId, size)` in the route.

### P3 — Low

- [ ] `uploadVideo.fileSize` is client-supplied — quota accounting is advisory
      (a hostile client can claim 0). Server-side `HeadObject` on
      `storageKey` would make it authoritative.
- [ ] No reviewer-side notification when a new video lands in a PENDING queue
      (school Review tab badge count + platform /catalog/approvals only).

## Resolved Issues

_Chronological close log — appended as items ship._

- **2026-07-11 — Upload → catalog → ownership loop closed (production pass).**
  Six fixes shipped in one pass; tsc 0, stream suite 272/272 green:
  1. **Direct-to-S3 upload wired** — the propose dialog's Upload tab now does
     presign (`/api/blob/presign`) → XHR PUT with progress → submits
     `finalUrl` + `fileSize`/`storageKey`/`storageProvider` (provider
     SELF_HOSTED). `uploadVideo` persists the storage fields, so
     delete/revoke/replace CDN invalidation works for uploads. Was a
     "coming soon" stub while the presign route sat unused.
  2. **Admins can upload** — `/stream/settings?tab=videos` (the tab teach/\*
     redirects to) now carries the ProposeVideoDialog (header + empty state)
     fed by `getProposableLessons()` for ADMIN/DEVELOPER/TEACHER alike.
     Previously only TEACHER had an entry point (dashboard overview), and the
     empty state pointed at a button admins don't have.
  3. **Single-paid-video dead end fixed** — a lesson whose only video is
     PAID+unpurchased had no purchase path (InstructorSwitcher needs 2+
     videos; hero Play disabled; chips dead). The hero now shows an
     Unlock-with-price pill and locked instructor chips start the Stripe
     checkout (`purchaseVideo`).
  4. **Broken-source fallback** — `VideoPlayer` gained `onSourceError`
     (`<video onError>`); the lesson player swaps a dead/undecodable source
     for the marketing story clip (same `asset("/media/story.mp4")` as the
     zero-videos fallback). `playingFallback` gates progress writes for both
     fallback causes; paywalled videos still never fall back.
  5. **Platform gate for global surfaces** — school-lane `reviewVideo` now
     refuses to APPROVE PUBLIC/PAID videos (reject still allowed); those go
     through the platform catalog lane (/catalog/approvals, DEVELOPER). The
     Review tab disables Approve with an explanatory hint. Owner-side:
     `updateVideoVisibility` widening an APPROVED video to PUBLIC resets it
     to PENDING for platform re-review (narrowing stays free; DEVELOPER
     exempt).
  6. **School-lane contributor notifications** — `reviewVideo` now notifies
     the owner on approve/reject (same notification shape as the platform
     lane); notification failure never fails the review.

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
