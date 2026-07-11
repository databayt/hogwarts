---
epic: 05
sprint: Q3-2026
title: Stream (LMS)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-07-11
---

# Stream (LMS) — Production Readiness Tracker

**Status:** BUILT
**Completion:** 90%
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

### Engineering debt (post-release, non-blocking)

- [ ] `Video.price`/`VideoPurchase.amount` Float→Decimal migration (deferred —
      shared-DB table rewrite + ~13 read-site `Number()` conversions; money
      math is correct today via `Number()` at read sites).
- [ ] Server actions still return English `message` strings at source; every
      stream client surface now overlays dict-first toasts (success + common
      failure paths), so this is an error-code-migration cleanup, not a
      user-visible gap.
- [ ] Browser-crash orphans: the in-dialog cleanup (guarded DELETE) covers
      remove/tab-switch/dialog-close, but a hard browser kill after upload and
      before submit still strands the object. Residual candidate: S3 lifecycle
      rule on `stream/*/video/*` vs `Video.storageKey` sweep.
- [ ] Legacy `streamEnrollment` is still queried by
      `verifyPaymentAndActivateEnrollment` (payment-success path) — don't
      delete the legacy models until that path migrates to `Enrollment`.

## Resolved Issues

_Chronological close log — appended as items ship._

- **2026-07-11 (second pass) — Final-review sweep: every open P2/P3 closed.**
  tsc 0, stream suite 278/278 (6 new cases):
  1. **Reviewer notifications on new submissions** — `uploadVideo` now
     notifies every school ADMIN (uploader excluded) off the response path
     when a video lands PENDING; failure never fails the upload.
  2. **Presign quota pre-check** — `/api/blob/presign` refuses (413) before
     any bytes move when the school's storage quota can't fit the file.
  3. **Authoritative quota accounting** — `uploadVideo` HEADs the uploaded
     object (`getObjectSize`, new `src/lib/s3.ts`) and uses the real
     ContentLength over the client-claimed size; falls back to the claim when
     S3 is unreachable.
  4. **Abandoned-upload cleanup** — new guarded `DELETE /api/blob/presign`
     (role + own-prefix + refuses keys referenced by a Video row) and the
     propose dialog fires it on remove/tab-switch/close-without-submit; the
     submit success path hands ownership to the Video row instead.
  5. **Dialog i18n** — `video-review-content.tsx` + `video-settings-dialog.tsx`
     fully keyed (`stream.videoReview.*`, `stream.videoSettings.*`, en+ar),
     locale-aware dates, dict-first toasts, logical (RTL-safe) icon margins.
  6. **Search-bar de-fabricated + localized** — removed the hardcoded
     "Recently viewed"/"Recommended" placeholder courses (external Coursera
     images, fake ratings) and the category grid that linked to non-existent
     departments; the Explore dropdown is now popular-search chips (from
     `stream.search.terms`, en+ar) + a browse-all link, all keyed.

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
