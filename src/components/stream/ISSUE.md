---
epic: 05
sprint: Q3-2026
title: Stream (LMS)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/lms
last_audited: 2026-07-17
---

# Stream (LMS) — Production Readiness Tracker

**Status:** BUILT
**Completion:** 90%
**Last Updated:** 2026-07-17
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

- [ ] **`get-course-sidebar-data.ts` takes `schoolId` from its caller** — same
      shape as the `get-all-courses.ts` hole closed on 2026-07-17: the module is
      `"use server"`, so `getCatalogCourseSidebarData(slug, schoolId)` is a POST
      endpoint that trusts a caller-supplied tenant id and does no `auth()` /
      `getTenantContext()`. Only `stream/dashboard/[slug]/page.tsx` (a server
      component) calls it today, so nothing client-side exercises the hole — but
      the endpoint is reachable regardless. Fix = resolve the tenant inside, as
      `get-all-courses.ts` now does. These two were the only `data/catalog`
      fetchers with `"use server"` and no tenant/auth check.
- [ ] **~31 hardcoded-English / raw-enum i18n gaps across the block** (audited
      2026-07-17). `stream-en.json` and `stream-ar.json` are in exact 534/534 key
      parity, so there are **no missing-Arabic-key bugs** — every gap is a string
      or enum that never reaches the dictionary at all. Ranked:
  1. `shared/video-player/**` — the player has no `dictionary` prop at all:
     every `aria-label` (Play/Pause/Rewind/Mute/PiP/Share/progress), the Share
     menu's visible items ("Copy Link", "AirDrop", "Messages", …), `video-up-next`
     ("Up Next", "Play Now"), and `formatDuration()`'s `"min"/"h"/"m"`.
     `video-player.tsx:493` also rebuilds the `` `C${n} L${n}` `` string that was
     already fixed in `dashboard/lesson/content.tsx` — same bug, second site.
  2. `courses/[slug]/course-progress-bar.tsx` — takes no `dictionary`; "% complete",
     "lessons", "done", "remaining", "left" all hardcoded.
  3. `video/video-input.tsx` — "Uploaded Video"/"External Video", "Extracting
     metadata...", the `Uploader`'s labels passed as English literals, alt texts.
  4. Raw enum badges: `teach/videos-content.tsx:273` and
     `settings/video-review-content.tsx:152` render `video.visibility`
     (PUBLIC/SCHOOL/PRIVATE/PAID) raw — note the sibling `approvalStatus` badge on
     the same row IS translated; `video-review-content.tsx:154` renders
     `video.provider` raw.
  5. `home/hot-releases-section.tsx` — fabricated course titles/providers
     ("Google People Management Essentials", "PyTorch…") rendered with no lookup;
     same "fabricated placeholder content" class this block's CLAUDE.md already
     flags for the old search-bar cards.
  6. `settings/instructor-settings.tsx:90` — receives `dictionary` but never uses
     it; `toast.error(... || "Failed to update preference")`.
  7. `courses/[slug]/content.tsx:629` — `{lesson.duration} min` despite
     `stream.lesson.min` ("دقيقة") existing and being used correctly nearby.
  8. `home/teaching-hero-section.tsx:26` alt, `home/skills-section.tsx:158`
     `aria-label={\`Go to slide ${i}\`}`.
  9. `not-admin/content.tsx` — references `dictionary.notAdmin`, a key that exists
     in no dictionary file; falls back to an inline `lang === "ar" ? …` ternary.
     Appears to be dead code (no importer).

- [x] **Admin "Review" tab wired up** (2026-06-14) — `settings/page.tsx` now
      fetches `getPendingVideos()` (admin-gated, in the existing `Promise.all`)
      and passes `reviewContent={<VideoReviewContent .../>}` + `pendingReviewCount`.
      Also applied the previously-deferred optimizations for this now-live path:
      `reviewVideo` is now a single tenant-scoped `updateMany` (the write carries
      `schoolId`, not just the read) and `Video @@index([schoolId, approvalStatus])`
      was added.
- [x] **Lesson quiz → gradebook bridge** — ⚠️ **this 2026-06-14 entry was FALSE
      until 2026-07-17.** The action below was real but had **zero callers**; the
      student-facing quiz was a `useState` reveal widget, so no quiz score ever
      reached the gradebook. `exams/AUTO-PLAN.md:96` correctly listed the wiring
      as an open TODO — two records in this repo contradicted each other. Wired + verified 2026-07-17 (see the close log). Original entry: `submitLessonQuiz`
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

## Known Issues (added 2026-07-17 — readiness audit)

### P0 — before any school sees the Stream home page

- [ ] **The home page still hotlinks competitors' assets and ships their copy.**
      Partly fixed 2026-07-17 (see close log): the fabricated courses and the fake
      "1.7M+/14M+/8.1M+" learner counts are gone. **Still live:**
  - `home/curriculum-section.tsx` — 4 images hotlinked from
    `images.ctfassets.net` (Coursera's Contentful host): "World-Class Content",
    "Guided Projects", "Professional Certificates", "LMS Integration". The last
    one is also nonsense here ("connect courses to your learning management
    system" — this page _is_ the school's LMS).
  - `home/how-to-begin-section.tsx` — copy lifted **verbatim** from Udemy's
    become-an-instructor page ("Marketplace Insights tool", "Trust & Safety
    team", "our global promotions drive traffic to courses") with
    `s.udemycdn.com/teaching/plan-your-curriculum-2x-v3.jpg` hotlinked.
  - `home/ai-fluency-section.tsx`, `home/reasons-section.tsx` — B2B marketplace
    positioning ("Scale AI fluency across your organization", "earn money on each
    paid enrollment") that doesn't describe a single school's LMS.
    These need a product decision, not a mechanical fix: unlike the releases
    strip there is no catalog equivalent to rebuild them from. Copyright +
    false-advertising exposure, and the hotlinks can break or be blocked at any
    time. Precedent for deletion: the fabricated search-bar cards (2026-07-11).
- [ ] **`skills-section.tsx` categories are still fabricated** — "Generative AI",
      "IT Certifications", "Data Science" link to `?category=ai|it|data-science`,
      none of which exist in a K-12 catalog. Only the fake learner counts were
      removed. Either drive this from real departments or drop it.

### P1 — data integrity

- [ ] **Two incompatible option shapes live in `catalog_questions`.** The verified
      curriculum (`seeds/catalog/sd-content.ts`) writes `[{text, isCorrect}]` —
      which is what `quiz-actions.ts`'s `ChoiceOption` declares — while the
      generated demo filler (`seeds/catalog/content.ts`) writes `[{label,
isCorrect}]`. The quiz renderer now reads `text ?? label` to survive both,
      but the seed should be fixed to honour the declared contract. Grading was
      never affected (the server reads `isCorrect` by index).
- [ ] **The demo filler generates nonsense questions** — `content.ts` emits
      TRUE_FALSE questions with four prose options ("A description of a different
      artistic movement"), and history-flavoured stems ("Examine primary sources
      related to Constructing Frequency Table") attached to a **maths** lesson.
      Fine as volume, embarrassing in a demo.
- [ ] **The SD grade-1 curriculum has no lesson quizzes.** `sd-content.ts`
      attaches its 298 verified questions to the **subject** (for exams), never
      setting `catalogLessonId` — so every `sd-g1-*` lesson (the demo school's own
      curriculum) shows no quiz at all. Only the generated `content.ts` filler is
      lesson-attached. Verified via psql on 2026-07-17.

## Resolved Issues

_Chronological close log — appended as items ship._

- **2026-07-17 (second pass) — readiness fixes: quiz→gradebook, certificate,
  refunds, real home-page data.** tsc 0, 347/347 (stream + webhooks). All browser-
  verified on `/ar` against the local DB.
  1. **Quiz → gradebook is real now.** Wired `dashboard/lesson/content.tsx` to
     `submitLessonQuiz` via a new `LessonQuiz` component: answers are collected,
     submitted together, and graded **server-side** (correctness is no longer
     revealed on click — that can't coexist with a score that reaches grades).
     Verified end-to-end: a real `Result` row (`LMS quiz | score=2.00/2.00`)
     landed in the gradebook. Also fixed two bugs that made the quiz inert
     regardless of wiring: the client tested `questionType === "MCQ"` while the
     enum is `MULTIPLE_CHOICE` (so **no multiple-choice options ever rendered**),
     and TRUE*FALSE now renders its stored options instead of the English
     `trueLabel`/`falseLabel` — the DB stores "صح"/"خطأ", so the old code showed
     English on Arabic questions. **Scoring flaw fixed in the action:** `total`
     counted only \_answered* questions, scoring "1 of 10 right, 9 skipped" as
     100%; unanswered gradeable questions now count. +4 dict keys (542/542 parity).
  2. **Certificate route built** (`courses/[slug]/certificate`) — the exact URL
     `completion-email.tsx` has always linked to, which 404'd on every course
     completion. Scoped to the owning learner (`SubjectCertificate` is unique on
     userId+catalogSubjectId); uses the pre-existing, never-rendered
     `stream.certificate.*` keys; locale-aware dates (`ar-SD`). New fetcher
     `data/catalog/get-certificate.ts` (server-only + `cache()`, no `"use server"`).
  3. **Refunds/disputes revoke access again.** Both handlers wrote to
     `streamEnrollment` — a table nothing creates — while checkout writes
     `enrollment`, so a refunded student kept the course forever, silently
     (error swallowed into `console.error`). **Deeper than a table swap:** Stripe
     does NOT copy Checkout Session metadata onto the Charge, so the guard
     `charge.metadata.enrollmentId` never passed either. New
     `revokeEnrollmentForCharge()` resolves the enrollment from metadata when
     present, else via payment_intent → checkout session →
     `Enrollment.stripeCheckoutSessionId` (covers already-sold courses); the
     checkout now also stamps `payment_intent_data.metadata` for future charges.
     Dropped the `schoolId` guard — `Enrollment.schoolId` is nullable. Expired
     catalog checkouts are now cleaned up too (the legacy branch required a
     `courseId` the catalog lane never sets).
  4. **`cancel_url` 404 fixed** — pointed at `/stream/browse`, which doesn't
     exist; now `/stream/courses`.
  5. **Home "new releases" shows real courses.** Was 4 invented courses
     ("PyTorch for Deep Learning") with fabricated 4.7–4.9 ratings, artwork
     hotlinked from Coursera's CDN, every card linking to the generic catalog.
     Now driven by this school's own `SubjectSelection` via `getAllCatalogCourses`,
     links to each real course, renders a rating only when one exists, and hides
     itself when the school has no selections. Fake learner counts removed from
     `skills-section.tsx`. **The rest of the borrowed home-page content is NOT
     fixed — see P0 above.**

- **2026-07-17 — `/stream/courses` pass: hero art, level i18n, See More, tenant
  scope.** Four fixes, all verified in a browser on `/ar` + `/en`; tsc clean for
  the block (the 13 repo-wide errors at the time were unrelated in-flight
  `payment/` + `announcements/` work).
  1. **Hero art restored.** The CDN migration (`92083d94f`) rewrote a real path,
     `/anthropic/6903d22d…-1000x1000.svg`, to `asset("/illustrations/anthropic-abstract.svg")`
     — a filename that has never existed in `public/` or on the CDN, so the hero
     rendered a broken-image icon (403) on every visit. The original asset is
     live at `cdn.databayt.org/anthropic/6903d22d…` (cream `#FAF9F5` + black
     `#141413` — the intended pairing with the `#D97757` tile); the call site now
     passes that full CDN URL through `asset()`, matching how `home/content.tsx`
     references the same fine-grouped `anthropic/` namespace. **Watch for other
     victims of that same migration commit** — `asset()` always rewrites to
     `cdn.databayt.org/hogwarts/<file>`, so a file added to `public/` does NOT
     fix a 403; the object must exist on the CDN (a 403, not a 404, is what a
     missing key looks like there).
  2. **Course level no longer leaks English to /ar.** `course-card.tsx` rendered
     `_catalog.levels[0]` — the raw `SchoolLevel` enum — title-cased in JS, so
     every Arabic card read "Elementary". Added `stream.courseLevels`
     (ELEMENTARY/MIDDLE/HIGH) to both dictionaries, reusing the canonical strings
     already in `school.subjects.navigation` (ابتدائي/متوسط/ثانوي). The card's
     `"Course"` fallback now also goes through `courseTypes.course`. The hero
     `<img>`'s hardcoded `alt="Courses"` became `alt=""` — it is decorative, the
     `<h1>` beside it already names the page.
  3. **"See More" was silently dead.** `useEffect(… , [courses, page])` reset
     `allCourses` from props, but `courses` is a new array identity on every
     server render — and a Server Action call re-renders the route, so the
     appended page was wiped the instant it arrived (clicking appended 0 cards;
     page 2 by URL was always fine, proving the data layer was healthy). Replaced
     with React's adjust-state-on-prop-change pattern keyed on
     `${activeGrade}|${page}|${totalCount}`, so a grade switch still resets while
     load-more accumulates. Verified: 2 → 4 cards, button then hides; grade 3
     resets to 2 grade-3 cards.
  4. **`getAllCatalogCourses` trusted a caller-supplied `schoolId`.** The module
     is `"use server"` and the client's `loadMore` passed the id in, so the export
     was a POST endpoint that would read — and via `ensureSubjectSelections`,
     **write** (`create`/`createMany`) — for any school id, with no `auth()` and
     no `getTenantContext()`. It now resolves the tenant itself and the parameter
     is gone from both call sites (the client no longer sends a tenant id at all).
     Sibling `get-course-sidebar-data.ts` still has this shape — logged under P1.

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
