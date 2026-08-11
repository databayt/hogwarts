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
last_audited: 2026-08-11
---

# Stream (LMS) — Production Readiness Tracker

**Status:** BUILT
**Completion:** 90%
**Last Updated:** 2026-08-11
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

## Known Issues (added 2026-08-11 — school-authored-curriculum trace)

_Full e2e trace of: new school onboards its own courses across all grades → video
lessons + materials → quizzes + exams → completion tracking → certification.
Original verdict (superseded in part — see the governance decision below): the
PLATFORM-catalog path works end-to-end; the school-authored path stops at
chapter/lesson creation, and every absolute URL the block emails/redirects to
pointed at the wrong host for tenant users (fixed same day, see close log)._

### Governance decision (Abdout, 2026-08-11) — supersedes the "empty shell" P0

The trace initially filed "schools cannot create chapters or lessons" as a P0
blocker. **Abdout's call: that is the intended model.** Schools are governed by
a unified hierarchy — Subject → Chapter → Lesson order comes from the platform
catalog. Schools can only (a) hide/activate content per school
(`ContentOverride`), and (b) contribute at LESSON level: videos, materials,
quizzes. Consequences:

- `submitChapterProposal` / `submitLessonProposal`
  (`school-dashboard/listings/subjects/catalog/proposal-actions.ts:109,145`)
  stay **deliberately unwired** — do NOT add UI for them. P2 cleanup below:
  either delete the two dead actions (plus the `CHAPTER`/`LESSON` arms of
  `approveProposal`) or leave them carrying a comment pointing here.
- The lesson-level contribution lanes must therefore actually work — the
  materials read-path and the hide-vs-certificate bug were fixed 2026-08-11
  (close log). The remaining lesson-level asymmetries (quiz lane
  PENDING-gated, qbank can't lesson-attach) stay open as P1s below.
- Subject proposals (`propose-subject.tsx`) remain live: a school may REQUEST
  a subject; the platform authors its chapter/lesson structure after approval.

### P0 — flow blockers

- [x] **Every absolute stream URL was built from `env.NEXT_PUBLIC_APP_URL` (the
      MAIN host), so on tenant subdomains all email links and Stripe redirects
      dead-ended on a 404** — a paying student was redirected to a not-found
      page immediately after checkout (webhook still activated access
      server-side, so UX-broken, not access-lost). **FIXED 2026-08-11** — see
      close log: new `shared/tenant-url.ts` (`streamTenantUrl`), all 6 call
      sites migrated.

### P1 — completion / certification integrity

- [x] **Certificates became unreachable the moment a school hid any content.**
      `markLessonComplete`'s all-complete check counted ALL PUBLISHED lessons
      and ignored `ContentOverride`, while the student course view filters
      hidden chapters/lessons out — hiding one lesson made
      `completedLessons === allLessons.length` impossible forever. **FIXED
      2026-08-11** (close log): the certificate gate now counts only
      school-visible lessons (lesson- AND chapter-level hides), matching
      `get-course.ts` semantics.
- [x] **Three different progress denominators disagreed.**
      `get-course-progress.ts` counted ALL lessons (DRAFT/ARCHIVED included, no
      overrides), `markLessonComplete` counted published-only (no overrides),
      `get-course.ts` counted published-minus-hidden. **FIXED 2026-08-11**
      (close log): all three now use published-minus-hidden. (The dashboard
      sidebar fetcher `get-course-sidebar-data.ts` remains its own surface —
      see the pre-existing P1 tenant-scope item above; align it when that hole
      is closed.)
- [x] **Materials were a double dead end in the lesson experience.** The lesson
      player rendered `lesson.attachments` (a table nothing writes) while the
      `Material` rows schools contribute (`submitMaterial`, lesson-attachable)
      were never queried by any stream fetcher. **FIXED 2026-08-11** (close
      log): `getLessonWithProgress` now returns lesson materials
      (APPROVED+PUBLISHED, PUBLIC-or-own-school) and the lesson player renders
      them in the Resources section. `Attachment` remains writer-less — P2
      cleanup: decide whether to delete the model or keep it for platform-side
      uploads.
- [ ] **Catalog practice attempts are throwaway.** `/exams/mock` + `/exams/quiz`
      read catalog `Exam` directly and students can take them
      (`exams/mock/take-actions.ts:55`), but `submitMockExam` (:133-270) never
      writes `Result`/`ExamResult` — and the Attempt History on those pages reads
      only `ExamResult`, so mock/quiz attempts never appear anywhere. Contrast:
      the stream lesson quiz DOES persist via `upsertGradebookResult`
      (`quiz-actions.ts:165`).

### P1 — authoring asymmetries (school-authored content lanes)

- [ ] **The only lane for school-authored LESSON quiz questions is
      platform-review-gated, while the qbank lane self-approves but cannot
      lesson-attach.** `submitQuestion`
      (`listings/subjects/catalog/contribution-actions.ts:97-99`) writes
      `approvalStatus: PENDING, status: DRAFT` — invisible to the school's own
      lesson quiz (`get-lesson-content.ts` requires APPROVED) until a platform
      DEVELOPER approves, even at SCHOOL visibility. The qbank wizard
      (`exams/qbank/actions/question-crud.ts:76`) self-approves instantly but
      never sets `catalogLessonId` (only duplicate copies it, :614). Videos have
      a school-side approval lane for SCHOOL/PRIVATE — questions don't.
- [ ] **`contributeExamToCatalog` self-approves into the global catalog**
      (`exams/generate/actions/catalog-contribute.ts:135` sets
      `approvalStatus: "APPROVED"` directly), bypassing the
      `saas-dashboard/catalog/exam-approval-actions.ts` PENDING queue that exists
      for exactly this. Same for qbank `createQuestion`/AI-generate (PRIVATE
      default, so blast radius is small — but the moderation model is
      inconsistent: `submitQuestion` PENDING vs everything else instant).
- [ ] **`submitQuestion` defaults `visibility: "PUBLIC"`**
      (`contribution-actions.ts:98`) — school-authored content goes
      globally-visible-by-default once approved. Default should be SCHOOL.

### P2 — design gaps to decide, not bugs

- [ ] **Dead code left by the 2026-08-11 governance decision.**
      `submitChapterProposal`/`submitLessonProposal` and the
      `CHAPTER`/`LESSON` arms of `approveProposal` are deliberately unwired —
      delete them (or annotate with a pointer to the governance note). The
      `Attachment` model is still writer-less now that materials serve the
      lesson Resources section — delete it or adopt it for platform-side file
      uploads.
- [ ] **No school-private curriculum exists.** Proposal-approved subjects land
      global (`status: PUBLISHED`, no visibility field on Subject/Chapter/Lesson,
      no contribution fields either) — every school with a matching country sees
      them. `approveProposal` also never sets `curriculum` (defaults `"SD"`
      regardless of proposer). A school "owning" its curriculum privately is
      architecturally impossible today; if that's the intent, say so in docs.
- [ ] **Multi-grade subject footgun.** `propose-subject.tsx` accepts
      comma-separated grades → ONE Subject spanning them; `get-course.ts` has no
      grade filtering, so a grade-1 enrollee sees grade-12 lessons. The SD seed
      sidesteps this (one subject per grade); nothing guides proposers to do the
      same.
- [ ] **Enrollment at scale is subject-by-subject and account-gated.**
      `bulkEnrollStudents` (`settings/enrollments/actions.ts:79`) takes one
      subject + explicit userIds — no "enroll grade N in its subjects" operation
      (12 grades × ~10 subjects = ~120 manual passes), its member filter has no
      role filter (teachers/guardians enrollable as students), and
      `Enrollment.userId → User` means students without linked User accounts are
      unreachable.
- [ ] **Certificates gate on watching, not assessment** — quiz/exam scores never
      factor into issuance, and the certificate page has no print/PDF affordance.
- [ ] **Dead models**: catalog `Quiz`/`QuizQuestion` — zero references repo-wide;
      `SchoolExam.catalogLessonId`/`catalogChapterId` are written by `adoptExam`
      but never read back (no provenance surfaced).

### Needs prod verification (cannot confirm from code)

- [ ] **SD lesson-quiz data on prod.** This file's 2026-07-17 P1 says SD g1
      lesson quizzes are empty (psql-verified then); catalog `CLAUDE.md` (same
      date) says `sd-content.ts` sets `catalogLessonId` via the slug scan
      (sd-content.ts:521 confirms the code). The ingest is LOCAL-only
      (`curriculum/` is .vercelignore'd) — whether prod lessons have quizzes
      depends on whether the ingest ever ran against prod. Verify via psql before
      trusting either record.
- [ ] `NEXT_PUBLIC_APP_URL` production value (assumed `https://ed.databayt.org`;
      local `.env` = `http://localhost:3000`, which reproduces the wrong-host bug
      locally against `demo.localhost:3000`).

## Resolved Issues

_Chronological close log — appended as items ship._

- **2026-08-11 — tenant URLs + lesson-level materials + override-aware
  completion (the trace's fix round, scoped by Abdout's governance note).**
  tsc 0, stream suite 283/283 (19 files; +6 new cases). NOT yet deployed.
  1. **Tenant-aware URLs everywhere stream leaves the app.** New
     `shared/tenant-url.ts` → `streamTenantUrl(path, lang?)`: builds the
     origin from the request's `x-subdomain` + `host` headers via
     `tenantOriginForHost` (same-root, localhost-aware; falls back to
     `NEXT_PUBLIC_APP_URL` outside a tenant request) and carries the locale
     (caller's, else `x-locale`). Migrated all 6 sites: completion-email
     `certificateUrl`, free-enrollment `courseUrl`, catalog Stripe
     `success_url`/`cancel_url`, video-purchase redirects, legacy enrollment
     `courseUrl`. The `env` import left those four files entirely.
  2. **Lesson materials reach students.** `getLessonWithProgress` fetches the
     lesson's `Material` rows (APPROVED + PUBLISHED, `visibility: PUBLIC` or
     `contributedSchoolId` = viewer's school — a foreign school's
     SCHOOL/PRIVATE material never leaks) in the existing Wave-1
     `Promise.all`; the lesson player's Resources section renders them
     (title + description, external-or-file link) alongside the legacy
     attachments, and the hero resource count includes both.
  3. **Hide/activate no longer bricks certification.** `markLessonComplete`
     filters the completion denominator by the school's `ContentOverride`
     rows (lesson-level AND chapter-level hides; `hideQuiz`-only rows
     correctly ignored; platform enrollments with `schoolId: null` skip the
     lookup). `getCourseProgress` got the same treatment plus the missing
     `status: "PUBLISHED"` filter, so all student-facing denominators now
     agree with `get-course.ts`.
  4. Tests: `contentOverride`/`material`/`headers` added to the relevant
     mocks; 4 new completion-denominator cases + 1 materials-gate case; the
     stale `list-params` baseline expectation (missing `search` key) fixed.

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
