---
epic: 05
sprint: Q3-2026
title: Lumos (LMS)
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 93
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/lms
last_audited: 2026-08-15
---

# Lumos (LMS) — Production Readiness Tracker

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

- [x] **Every lesson video and material was world-readable — closed 2026-08-14.**
      `hogwarts-databayt` carries a blanket `PublicReadGetObject` allow, and the
      lesson page emitted the raw storage URL, so ~2.6 GB of school video under
      `stream/` was fetchable by anyone holding a URL — no session, no expiry,
      no revocation. Verified with an unauthenticated `curl`: HTTP 206,
      `video/mp4`. The client-side deterrents (context-menu block, `nodownload`)
      never touched this; the URL itself was the leak.
      **Fix:** self-hosted videos now emit `/api/lumos/video/<id>`, which
      re-runs the visibility/purchase gate per request and 302s to a
      2-hour presigned URL (`video/media-access.ts` is the single source of
      truth for that gate; `lib/storage-key.ts` parses our own object URLs).
      Materials/attachments get the same lane at `/api/lumos/file/<kind>/<id>`.
      **The S3 side is NOT closed yet** — see `scripts/s3-lock-private-prefixes.sh`,
      which must run after this deploys.

- [x] **`getVideoUrl` produced guaranteed-403 URLs — fixed 2026-08-14.**
      `CLOUDFRONT_DOMAIN` is `cdn.databayt.org`, whose only distribution
      (E3PHDXTDSBCQSJ) fronts the **`databayt-cdn`** bucket, not the upload
      bucket. `toCloudFrontUrl` rewrote every S3 video URL onto that domain, so
      every self-hosted read 403'd. Nobody noticed because prod holds exactly
      one lesson video and it is a YouTube row. The rewrite is now guarded on
      `CLOUDFRONT_ORIGIN_BUCKET` matching `AWS_S3_BUCKET`, and the presign
      route stores the canonical S3 URL instead of the CloudFront one.

- [x] **The watermark had never rendered — fixed 2026-08-14.** `VideoWatermark`
      returns `null` unless given a `userId`/`userEmail`, and neither lesson
      page ever passed one. It also drew at 6% opacity, which video compression
      erases. Both pages now pass the viewer, and it renders as a roaming mark
      plus an uncroppable fixed diagonal. Related: PiP and remote playback are
      disabled on protected content — both render the bare `<video>` without
      the overlay, which was a clean watermark-free capture path.

- [x] **Ungated content listings — fixed 2026-08-14.** Three surfaces returned
      contributed content with no approval/visibility gate at all:
      `conference/queries.ts` `getLessonReferenceContent` (no gate whatsoever,
      rendered as live `<a href>`), the subjects `materials/page.tsx` (filtered
      on `status` only, so other schools' SCHOOL/PRIVATE materials listed), and
      the mobile catalog route (bare `{ schoolId }` arm — the same PRIVATE leak
      already closed in `get-lesson-with-progress.ts`). All three now apply the
      canonical gate. `catalog/setup.ts` `getRankedVideos` (dead code) computed
      `hasPurchased` and then returned the URL regardless — a latent paywall
      bypass, now returning `null` for unowned PAID.

### P1 — High

- [ ] **Mobile cannot follow a protected video reference.** `/api/lumos/video/<id>`
      authenticates with the session cookie (`auth()`); the mobile lane
      authenticates with a Bearer JWT (`verifyToken`). `api/mobile/catalog/
subjects/[slug]` now emits the protected reference, which a mobile client
      cannot use — it needs a JWT-authenticated mint under `/api/mobile/`.
      No practical regression today (self-hosted mobile playback was already
      broken by the CloudFront-domain 403, and prod holds zero self-hosted
      rows), but it blocks self-hosted video on mobile.

- [ ] **Seek-preview thumbnails are disabled on self-hosted video.**
      `use-video-protection` no longer forces `crossorigin="anonymous"`, so
      playback works on every root domain — but the canvas in
      `use-thumbnail-seek` is now tainted and `toDataURL` throws, which the
      hook swallows into `null`. Deliberate: robust playback beats seek
      previews. To restore them, add the `balqalam.com` origins to the bucket
      CORS rule (it currently allows only `*.databayt.org` + localhost) and
      put `crossorigin` back.

- [ ] **`messaging/` and `payment-proof/` are still world-readable.** Same
      blanket `PublicReadGetObject` on `hogwarts-databayt`; not this block's
      code, but the same hole. Locking them needs those blocks' read paths to
      mint signed URLs first — the prefixes are listed, commented out, in
      `scripts/s3-lock-private-prefixes.sh`.

- [x] **`get-course-sidebar-data.ts` takes `schoolId` from its caller** —
      FIXED 2026-08-14 (close log): resolves the tenant itself. Original: — same
      shape as the `get-all-courses.ts` hole closed on 2026-07-17: the module is
      `"use server"`, so `getCatalogCourseSidebarData(slug, schoolId)` is a POST
      endpoint that trusts a caller-supplied tenant id and does no `auth()` /
      `getTenantContext()`. Only `lumos/dashboard/[slug]/page.tsx` (a server
      component) calls it today, so nothing client-side exercises the hole — but
      the endpoint is reachable regardless. Fix = resolve the tenant inside, as
      `get-all-courses.ts` now does. These two were the only `data/catalog`
      fetchers with `"use server"` and no tenant/auth check.
- [ ] **~31 hardcoded-English / raw-enum i18n gaps across the block** (audited
      2026-07-17). `lumos-en.json` and `lumos-ar.json` are in exact 534/534 key
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
  6. ~~`settings/instructor-settings.tsx:90` — receives `dictionary` but never
     uses it; `toast.error(... || "Failed to update preference")`.~~ **CLOSED
     2026-08-15** by the instructor-roster rewrite: every string now comes from
     `lumos.instructors.*` (27 keys, both dictionaries) and the actions return
     `ACTION_ERRORS` codes resolved through `resolveActionError`.
  7. `courses/[slug]/content.tsx:629` — `{lesson.duration} min` despite
     `lumos.lesson.min` ("دقيقة") existing and being used correctly nearby.
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
      lumos client surface now overlays dict-first toasts (success + common
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

### P0 — before any school sees the Lumos home page

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

- [x] **Every absolute lumos URL was built from `env.NEXT_PUBLIC_APP_URL` (the
      MAIN host), so on tenant subdomains all email links and Stripe redirects
      dead-ended on a 404** — a paying student was redirected to a not-found
      page immediately after checkout (webhook still activated access
      server-side, so UX-broken, not access-lost). **FIXED 2026-08-11** — see
      close log: new `shared/tenant-url.ts` (`lumosTenantUrl`), all 6 call
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
      were never queried by any lumos fetcher. **FIXED 2026-08-11** (close
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
      the lumos lesson quiz DOES persist via `upsertGradebookResult`
      (`quiz-actions.ts:165`).

### P1 — authoring asymmetries (school-authored content lanes)

- [x] **The only lane for school-authored LESSON quiz questions is
      platform-review-gated, while the qbank lane self-approves but cannot
      lesson-attach.** — the qbank half is FIXED 2026-08-14 (close log): the
      form carries a chapter → lesson picker and both write paths set
      `catalogLessonId`. The moderation asymmetry itself is left as recorded.
      Original: `submitQuestion`
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
- [x] **`submitQuestion` defaults `visibility: "PUBLIC"`** — FIXED 2026-08-14,
      now SCHOOL (close log). Original:
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

## Navigation rebrand + merge (2026-08-11)

The block is **Lumos** in the UI and at `/lumos`. Renamed from `/lumos`, which
had no navigation entry to its settings surface at all: `LumosHeader` carried
an admin-gated Settings link but was dead code with zero importers, so settings
was reachable only via three tab-specific quick-action buttons, the
`teach/videos` redirect, or by typing the URL. The `/lumos` hero's second
button also read "My Learning" while sending admins to a stats dashboard.

What changed:

- Route `/lumos/*` → `/lumos/*`; UI strings, sidebar (`platform.sidebar.Lumos`)
  and breadcrumb (`platform.breadcrumb.lumos`) keys rebranded in both languages.
- One `PageHeadingSetter` + `PageNav` strip (`components/lumos/nav.tsx`),
  rendered by the `dashboard/` and `settings/` layouts only.
- Settings tabs promoted to top-level routes — `/lumos/{enrollments,`
  `instructors,review,videos}`, no `/settings` segment; they share the
  `lumos/(app)/` route-group layout. The inner `Tabs` component
  (`settings/content.tsx`) and `header.tsx` were deleted. `/lumos/settings` and
  `/lumos/settings/[tab]` remain as redirects, because `Notification.url` rows
  written earlier still carry the old shapes.
- Hero second button reads "Dashboard" for every role — `/lumos/dashboard` is
  already role-unique (admin stats / teach overview / children's progress /
  enrolled courses).

### Videos surface adopted the listing chrome (2026-08-11)

`/lumos/videos` was a hand-rolled `<Table>` in a Card with its own `<h1>`, a
status `Tabs` strip and no search. It now uses `PlatformToolbar` + `DataTable`
with `teach/videos-columns.tsx`, matching `/students`. The status tabs became a
faceted Status filter (plus a new Visibility one) and the page-level `<h1>` went
away — the section heading already names the surface. One behaviour change: the
reviewer-feedback row that rejected videos used to render as an extra
full-width `<TableRow>` now sits under the title cell, since a `DataTable`
can't express a spanning sub-row.

### Enrollments surface adopted the listing chrome (2026-08-15)

`/lumos/enrollments` was the last hand-rolled `<Table>` in a Card, carrying its
own `<h1>` + description and no search. It now uses `PlatformToolbar` +
`DataTable` with a new `settings/enrollments/columns.tsx`, matching
`/lumos/videos` and `/students`. The page-level heading, description and the
"N total" badge all went with the Card — the section heading already names the
surface, and the listings toolbar has no slot for a count. One toolbar search
box filters student name, email and subject together (all three are nullable on
the row, so the `filterFn` guards before lowercasing). The Enrolled date moved
from a fixed `date-fns` `"MMM d, yyyy"` to the memoized-per-lang
`Intl.DateTimeFormat` used by the videos table, so Arabic readers now get
Arabic months. Status badges are unchanged — still the raw enum.

### Upload language replaced proposal language (2026-08-12)

The contributor flow read as a submission for permission — "Propose a Video",
"Video submitted for review. You'll be notified when it's approved.", statuses
Approved / Pending / Rejected. It now reads as a direct upload that publishes:
"Upload Video", "Video uploaded. It'll appear on the lesson shortly.", statuses
**Live / Publishing / Needs changes**, in both languages. The catalog approval
step is unchanged — only the words are. Reviewer-facing copy (Review queue,
admin notification, `approveVideo.*`) deliberately still says review; see the
Danger Zones note in CLAUDE.md before editing either side.

The same "submitted for review" toast survives on the subjects/catalog block's
**other** contribution types (materials, questions, assignments, subject
proposals). Only the video path was restyled — worth aligning if that flow gets
the same treatment.

### P2 — mirror-pattern gap — CLOSED 2026-08-14

Routes live at `(school-dashboard)/lumos/` and components now live at
`src/components/lumos/`. The mirror pattern holds. See the close log.

### P2 — stacked titles on the settings surfaces

The section heading now sits above each surface's own inner title, so
`/lumos/dashboard` reads "Lumos" → "Lumos Admin Dashboard". Not wrong, but the
inner `<h2>`s in `settings/overview.tsx`, `teach/overview-content.tsx` and
`dashboard/parent/content.tsx` could be dropped now that the section owns the
heading. `/lumos/instructors` shed its own (hardcoded English) `<h1>` +
description on 2026-08-15.

### Resolved by the merge

- `/lumos/dashboard` and the old `settings?tab=overview` rendered the **same**
  `LumosAdminDashboardContent`. Promoting the tabs to routes collapsed them.
- `adminDashboard.manageEnrollments` / `.instructorSettings` / `.browseCatalog`
  / `.manageVideos` / `.view` were referenced by `settings/overview.tsx` but
  present in **neither** dictionary, so the admin dashboard rendered five
  English strings on `/ar`. Added to both.

## Instructor governance — roster replaces the per-subject picker (2026-08-15)

`/lumos/instructors` was a per-**subject** picker whose only power was to
re-sort a lesson's candidate videos. A school could prefer a source; it could
not exclude one. The surface is now a roster of **people** — every instructor
whose approved videos reach the school's adopted subjects — with three
controls: allow/disable per instructor, a school-wide default, and a lock.

**Precedence, implemented once in `lib/instructor-policy.ts` and imported by
every read path:**

1. drop every video whose instructor the school disabled (hard filter)
2. if locked and any surviving video matches → keep only those; otherwise keep
   the survivors (**soft fallback** — a locked-but-uncovered lesson must not go
   video-less, because the placeholder clip records no progress and would dent
   course completion)
3. order: per-subject `InstructorPreference` → school `defaultKey` → the
   query's own `[isFeatured desc, viewCount desc]`

`InstructorPreference` is untouched and still read — the roster simply no
longer edits it.

**Gotcha worth keeping:** the matcher is `videoMatchesKey`, deliberately NOT
`instructorKeyOf(v) === key`. The roster keys a school-attributed video by its
person (`teacher:<userId>`), so comparing keys would make a `school:<id>` lock
match nothing and degrade silently to "open" — applied-looking and inert. Each
key type matches on its own attribute instead.

Enforced in: `data/catalog/get-lesson-with-progress.ts` (default + switcher
pills), `api/mobile/catalog/subjects/[slug]` (grouped per lesson, since the
lock is a per-lesson decision), and `data/catalog/get-course.ts` (cosmetic —
a course card must not advertise a disabled instructor). While unifying the
visibility gate, the roster's old `OR: [{schoolId}, PUBLIC]` was replaced by
the shared `videoVisibilityWhere`, which also fixed PAID partner instructors
never appearing in the roster despite being visible to students.

### PRE-deploy — PROD DDL OWED

Two new tables, applied to local Postgres only (`prisma db push`). **Prod has
neither; the deploy needs them first.** Both are additive `CREATE TABLE`s — no
alters, no drops:

- `school_instructor_policies` — `id`, `schoolId` (unique), `lockedKey`,
  `defaultKey`, `createdAt`, `updatedAt`
- `school_instructor_blocks` — `id`, `schoolId`, `instructorKey`, `createdAt`,
  unique `(schoolId, instructorKey)`, index on `schoolId`

Both columns speak one key vocabulary: `platform` | `teacher:<userId>` |
`school:<schoolId>`. A single keyed string rather than a nullable
userId/schoolId pair because Postgres treats NULLs as distinct in a composite
unique, and because platform content has neither a stable userId nor a
schoolId to key on.

## Courses search + Explore (2026-08-16)

`/lumos/courses` had one search affordance — type, press enter, reload the
whole page — and an Explore dropdown holding six text pills. Both now read the
catalog directly.

**One JSON endpoint behind every client-side read.** `GET
/api/lumos/course-search?q=&page=&perPage=&grade=&locale=` wraps
`getAllCatalogCourses` (which still resolves `schoolId` from tenant context,
so the route cannot widen the tenant scope). It serves the typeahead, the
Explore shelf, and the grid's "See More" — the last of which was calling the
fetcher as a **server action** from the browser, so appending twelve cards
shipped a full RSC re-render of the route. The same page now costs ~6.7KB.

With no client caller left, `data/catalog/get-all-courses.ts` dropped
`"use server"` for `import "server-only"` — one less POST RPC stub, and the
module lines up with the fetcher convention in this block's CLAUDE.md. (No
`cache()`: its sole argument is an object literal, which React's
identity-keyed cache can never dedupe.)

**Search bar** (`search-bar.tsx`): the box is seeded from `?search=` so a
shared link or the back button shows the term that produced the results, and
clearing it now drops the param instead of leaving stale results under an
empty input. Typing ≥2 characters opens a debounced (250ms), per-term-cached,
AbortController-guarded typeahead — six rows with CDN thumbnails, ArrowUp/Down

- Enter to open one, "See all results" to fall through to the full grid.

**Explore** shows six real courses with thumbnails above the popular pills.
Scoped to the grade the grid is showing, fetched on first open only, and
deduped by title — the catalog carries one row per subject per grade, so an
un-deduped shelf read "Arabic, English, Arabic, English". For the same reason
every card and suggestion row carries a **grade** in its meta line: a query
for "math" returns six courses all titled "Mathematics", and the grade is the
only thing telling them apart.

**Gotchas worth keeping:**

- The grade must be **passed into `SearchBar` as a prop**, never read off
  `?level=`: `list-params.ts` DEFAULTS `level` to `"1"`, so the param is
  absent on the very page whose grid is filtered to grade 1 — reading the URL
  showed an all-grades shelf beside a grade-1 grid.
- `buildBilingualNameMatch` scanned **every translation the school owns** on
  every keystroke (`translatedText contains`, unindexed). It is now scoped to
  `targetLanguage: displayLang` — a term typed in the language on screen can
  only match rows translated INTO that language, so the predicate is free.
- The dropdown locks `document.body.overflow`; navigating to a suggestion
  unmounts the bar mid-lock, so the cleanup effect restores it. Without that,
  the destination page loads unscrollable.

Covered by `src/tests/school-dashboard/lumos/data/catalog/get-all-courses.test.ts`
(tenant scope, the three search predicates, grade-spanning search, pagination).

## Known Issues (added 2026-08-13 — upload-dialog trace)

Found while tracing the upload path end to end; the five functional bugs from
the same pass are fixed (see the close log). These four are not, and each is a
larger edit than the fixes were.

### P1 — data integrity

- [x] **`revalidatePath` on dynamic segments without `"page"` is a silent
      no-op.** Fixed 2026-08-13 across all 13 lumos call sites — see the close
      log. Still open OUTSIDE this block: `finance/receipt/actions.ts` (5),
      `finance/banking/actions/bank.actions.ts` (2), `school/bulk/actions.ts`.
      **Cross-block, worth someone's attention:** `conferenceRevalidatePath()`
      passes `"page"` correctly, but when called WITH a session id it produces
      the blended form (`/[lang]/s/[subdomain]/conference/<uuid>`) that matches
      no cache tag — so the per-session half of those calls is still a no-op.
      Not fixed here; not this block. `video/video-actions.ts:234,237,238` — the admin course page,
      `/lumos/review`, and `/[lang]/catalog/approvals` are all revalidated with
      a bare path containing `[lang]`/`[subdomain]`, so **the reviewer queue
      never refreshes when a submission lands**. Same bug class the conference
      pass fixed on its own sites (`conference/actions/sessions.ts` passes
      `, "page"` throughout); 26 dynamic-segment calls repo-wide still lack it,
      so this is worth a sweep rather than a one-file patch.
- [x] **`uploadVideo` accepts an unvalidated `storageKey`.** Fixed 2026-08-13
      — see the close log. The DELETE half of
      `api/blob/presign/route.ts:224` enforces the caller's own
      `stream/<schoolId>/video/` prefix; `uploadVideo` stores whatever the
      client sends. A teacher can name another school's key — `getObjectSize`
      then charges that object's bytes to their own quota, and `deleteOwnVideo`
      will CDN-invalidate the other school's object. Not destructive (nothing
      deletes S3 bytes — see below), but the fix is a one-line assert mirroring
      the DELETE route's prefix check.
- [ ] **Deleting a video never deletes the S3 object.** `deleteOwnVideo`
      decrements the quota counter and calls `invalidateCache`, but never
      `deleteObject` — the bytes stay in the bucket forever while the counter
      reports them freed. Quota drifts from the real bill in the school's
      favour, and every deleted upload is permanent storage spend. Pairs
      naturally with the browser-crash-orphan sweep already listed under
      engineering debt (an S3 lifecycle rule on `stream/*/video/*` vs
      `Video.storageKey` would catch both).

### P2 — capability gap

- [ ] **Duration is never captured by the dialog, though the block already
      knows how.** The propose dialog never sends `durationSeconds`, so every
      video created through it is `null` — and `get-lesson-with-progress.ts:469`
      surfaces exactly that as `videoDuration`. The platform-side
      `video/video-input.tsx` (used by `saas-dashboard/catalog/video-manager`)
      extracts duration **and** a poster frame via `loadedmetadata` + a canvas
      grab at 25%, and passes them as `VideoInputMetadata`. Two uploaders, one
      of which captures metadata — lift that step into the dialog's
      `handleFileSelected` (the `<video>` probe runs on the local `File` before
      the PUT, so it costs nothing extra) rather than reimplementing it.

### Polish (same trace, not scheduled)

- 5GB single PUT: no multipart, no resume, no `xhr.timeout` — one blip at 99%
  starts over. Multipart is the real fix; a retry of the failed part is the
  cheap one.
- Quota is described in prose ("counts toward your school's quota") but never
  shown. `getSchoolVideoUsage` exists, so remaining space could appear before a
  file is chosen instead of arriving as a 413 afterwards.
- Progress sits at "Uploading… 100%" while S3 finalises; the status text has no
  `aria-live`, so a screen reader never hears the upload finish.
- Currency defaults to USD from a hardcoded list of five — a Sudanese or Saudi
  school should default to its own.
- No `<form>` wrapper, so Enter never advances a step or submits.

**Not a bug — deliberate:** the toast ("It'll appear on the lesson shortly")
reading softer than the button ("Submit for Review") and the rights box
("Admin review is required") is the contributor/reviewer copy asymmetry
recorded in CLAUDE.md's Danger Zones. Don't "fix" it in either direction.

## Resolved Issues

_Chronological close log — appended as items ship._

- **2026-08-15 — lumos dashboard: de-duplicated the admin header/quick-actions
  and moved the course lists onto a shared carousel.** Abdout's read of
  `/en/lumos/dashboard` was that the page repeated itself: the "Lumos Admin
  Dashboard" h2 + "Manage your courses…" lead restated the page's own `Lumos`
  heading (set by `PageHeadingSetter` in `nav.tsx`), and three of the four
  quick-action buttons — View All Courses, Manage Enrollments, Instructor
  Settings — restated the tab strip `getTabsForRole` renders directly above
  them. The **Video Library** button went in a follow-up pass the same day, so
  the quick-action row is gone entirely — every one of its four destinations is
  a tab. All the removals are in `settings/overview.tsx`. The dictionary keys
  (`adminDashboard.title/description/viewAllCourses/manageVideos/…`) are
  deliberately NOT pruned — they are one edit away from being needed again, and
  `mostRecentlyCreated`/`viewAllCourses` still label the equivalent slots on
  the student carousels.
  **Recent Courses** stopped being a stacked list of bordered rows and became
  a card carousel with real catalog artwork. The images were not available:
  `getCatalogAdminStats` (in the dashboard `page.tsx`) selected only
  `id/name/slug/status/totalChapters/totalLessons/createdAt`, so `thumbnail`
  and `color` were added to the select and mapped through
  `getCatalogImageUrl(thumbnail, "original")` — the same helper
  `get-dashboard-data.ts` already used for the student cards, so no second
  URL-building path exists. The colour is the no-image fallback, matching
  `home/hot-releases-section.tsx`.
  The carousel itself is new and shared: **`shared/course-carousel.tsx`**
  (`CourseCarousel` + `CourseSlide` + `COURSE_SLIDE_BASIS`), wrapping the
  hitherto-unused `ui/carousel` primitive. The thing a naive drop-in gets
  wrong: **embla needs `direction: "rtl"` passed in `opts`** — CSS logical
  properties flip the layout but not the scroll axis, verified in the browser
  where the RTL track translates `+343px` for the same click that translates
  `-344px` in LTR.
  **The strip carries no prev/next buttons** (Abdout, follow-up pass): it is
  dragged with mouse or touch. The primitive's defaults would have overhung the
  dashboard column anyway (`-start-12` / `-end-12`), and the heading row is now
  the title alone — Recent Courses lost both its description and its "View All
  Courses" link in the same pass. `COURSE_SLIDE_BASIS` went 3-up → **4-up**
  (`basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4`), with each card's
  `sizes` hint widened to match, so four subjects are visible at once.
  The title uses `typographyVariants.cardTitle` from `@/lib/typography`, not an
  ad-hoc `font-bold`: **a bare `<h2>` computes to 16px/400 in this app** —
  there is no global element rule, only the inline-utility system — so a
  section heading that isn't given a variant renders at body weight.
  The same carousel now carries **My Courses** and **Available Courses** in
  `dashboard/content.tsx` (the empty-state card is untouched and still renders
  as a plain section) — leaving those as grids one screen below a carousel
  read as unfinished. Every string still comes from the existing
  `adminDashboard.*` / `studentDashboard.*` keys; no new dictionary entries.
  **Role gating**: the page's `role === "ADMIN" || role === "DEVELOPER"` was
  replaced with `isRoleIn(role, LUMOS_ADMIN_ROLES)` from `permissions.ts`, the
  same predicate the tab strip uses, so the dashboard body and the tabs cannot
  drift apart. The other branches (GUARDIAN → `ParentProgressContent`,
  TEACHER → `TeachOverviewContent`) are unchanged, and STAFF / ACCOUNTANT /
  USER still fall through to the student view — that is deliberate, not a gap.
  tsc clean for lumos (one pre-existing `subMonths` error in
  `school-dashboard/finance/dashboard/actions.ts` belongs to another session's
  in-flight edit); lumos 346/346; browser-verified on demo.localhost at
  `/en/lumos/dashboard` and `/ar/lumos/dashboard`.

- **2026-08-15 — restored the "So many reasons to start" section on the lumos
  home page.** It sat directly below the "Come teach with us" teaching hero
  until `349d781d0` (2026-07-19) dropped it along with `ai-fluency-section` and
  `skills-section` in the home restructure; Abdout asked for the section under
  the teaching hero back. Restored as `home/reasons-section.tsx` (typed on
  `LumosContentProps`, `lang` dropped — it renders no links), rendered between
  `TeachingHeroSection` and `HowToBeginSection`, with the `reasons.*` keys
  re-added to `lumos-en.json` / `lumos-ar.json` under the `lumos` root.
  Its three illustrations (`teach.jpg`, `inspire.jpg`, `reward.jpg`) were
  verified live on the CDN first — `public/lumos/*.jpg` alone would not have
  resolved (`asset()` has no fallback; a missing key is 403). **The copy is
  Udemy-derived marketing text**, same caveat the teaching hero carries: replace
  it before this page is shown to a real tenant. `how-to-begin` deliberately
  went the other way in that same restructure and now describes our own
  propose → review → live flow — that rewrite is intentional and was NOT undone.
  `ai-fluency-section` and `skills-section` (both above `HotReleasesSection`)
  stay deleted — not part of the ask. tsc clean for lumos; verified in the
  browser on demo.localhost at `/en/lumos` and `/ar/lumos` (RTL order correct,
  all three images `naturalWidth` 120).

- **2026-08-14 (second pass) — quiz/qbank/catalog integration + completion &
  certificate polish.** tsc 0, lumos 343/343 (15 new), lumos+exams+grades
  644/644. NOT yet deployed. Traced: school video upload → lesson quiz →
  qbank/catalog authoring → completion → certificate.
  1. **The lesson quiz graded a DIFFERENT question set than it rendered.**
     `getLessonContent` took 10 questions with a visibility gate, an `orderBy`
     and the per-school `hideQuiz` check; `submitLessonQuiz` took 20 with
     **none of them**. A student answered the 10 they saw and was scored out of
     up to 20 — and the missing visibility gate pulled other schools'
     SCHOOL/PRIVATE questions into the denominator. That score reaches the
     unified gradebook and report cards. Both sides now import
     **`lumos/lib/lesson-quiz.ts`**, which owns the gates, the order (with an
     `id` tiebreaker — bulk-seeded questions share a `createdAt`), the cap, and
     the grading. Same discipline as `shared/url-validators.ts`.
  2. **The answer key shipped to the browser.** `options` went to the client
     raw: `isCorrect` per choice, `acceptedAnswers` for FILL_BLANK, plus
     `sampleAnswer` — all before the student answered. Any devtools user scored
     100% on a gradebook-bound quiz. The client now receives choice LABELS
     only, in grading order, and answers with an index; correctness, the
     correct index/answers, and the explanation come back in the graded
     response (`LessonQuizVerdict`). The client's dual-shape `text ?? label`
     hack moved server-side with it.
  3. **A client-supplied `subjectId` chose the gradebook row's subject.**
     `submitLessonQuiz` is a POST endpoint; the subject is now derived from the
     lesson (`lesson.chapter.subjectId`).
  4. **Every lesson quiz in a subject collapsed into ONE gradebook row.**
     `upsertGradebookResult` matches on `(subject, title)` when there is no
     exam/assignment FK, and the title was the constant `"LMS quiz"` — so
     lesson B's quiz overwrote lesson A's, forever. The title is now the LESSON
     NAME, bare — it is the identity key, so it has to be stable (nothing that
     varies per attempt) AND readable in the right language (an English
     `"Quiz — "` prefix would render as-is on an Arabic report card; a
     translated prefix would orphan every row the day the school's language
     changed). The lesson name is both for free, and what kind of row it is
     lives in `description`, which is not matched on. **Migration note:**
     existing rows titled `"LMS quiz"` are orphaned by this, not rewritten.
     **Known edge:** two lessons with identical names under one subject still
     collapse to one row — fixing that needs a lesson FK on `Result`, i.e. a
     schema change.
  5. **Unlimited retakes rewrote the report card.** New `onlyIfAbsent` option
     on `upsertGradebookResult` (default off, so exams are untouched) makes the
     lesson quiz record only the FIRST attempt. Later attempts still score and
     reveal answers; the response's `recorded` flag says which happened and the
     UI states it (`lesson.quizRecorded` / `lesson.quizPractice`).
  6. **FILL_BLANK was gradeable but unanswerable.** The server graded it; the
     UI rendered a bare stem with no input, so any lesson carrying one capped
     every student's score. The quiz now renders a text input for it — and
     SHORT_ANSWER/ESSAY/MATCHING are excluded at the QUERY rather than rendered
     dead: they had no input and were silently dropped by the grader.
  7. **qbank questions could never reach a lesson quiz.** `createQuestion`
     self-approves into the catalog but only ever set `catalogSubjectId`, while
     the lesson quiz reads `catalogLessonId` — so the one lane that could
     publish instantly could not target a lesson, and the one that could
     (`submitQuestion`) is platform-review-gated. The qbank form now carries a
     **chapter → lesson picker** (`qbank/lesson-attach-field.tsx`) that reuses
     the SAME two route handlers as the Lumos upload dialog
     (`/api/lumos/proposable-chapters`, `/api/lumos/proposable-lessons`), so
     scope, tenant gating, hidden-content subtraction and name translation stay
     defined once. The server re-derives the lesson and refuses one that is not
     under the chosen subject. No schema change — `Question.catalogLessonId`,
     `QuestionBank.catalogLessonId` and the exact composite index already
     existed. `updateQuestion` keeps the catalog row's link in step (empty =
     explicit detach).
  8. **FILL_BLANK could not be saved from the qbank at all.** `createQuestion`
     /`updateQuestion` spread the validated union straight into Prisma, and its
     FILL_BLANK arm carries `acceptedAnswers`/`caseSensitive`, which are not
     columns — "Unknown argument", every time. Both now map columns explicitly
     (`questionBankColumns`) and store the answer key in `options` as
     `{ acceptedAnswers, caseSensitive }`, which is the shape the edit form
     reads back AND the shape the Lumos grader expects.
  9. **`submitQuestion` defaulted `visibility: "PUBLIC"`** — school-authored
     questions went globally visible once a platform reviewer approved them.
     Now `SCHOOL`; contributing globally is still available, it just has to be
     asked for.
  10. **`get-course-sidebar-data.ts` trusted a caller-supplied `schoolId`** —
      the last `"use server"` fetcher in `data/catalog` with that shape (same
      hole as `get-all-courses.ts`, closed 2026-07-17). Resolves the tenant
      itself now; the one caller was updated.
  11. **The upload button vanished with no explanation.** Both entry points
      gate on `getProposableCatalog()`, which is empty for a school with no
      active `SubjectSelection` — i.e. every freshly-onboarded school. The
      admin saw an empty video library and no control, with nothing said. Both
      surfaces now render the existing `proposeVideo.empty` string as a link to
      `/subjects`. (The teacher overview was worse: it rendered the dialog
      unconditionally, so the picker simply opened empty.)
  12. **A finished certificate was unreachable from inside the app** — the
      completion email's link was the only route to it. The course page's
      progress bar now links to it at 100%.
  13. **Certificate surface polish**: print affordance (`window.print()` +
      `print:` utilities — the browser's own dialog already offers Save as PDF
      on every supported platform, keeps the RTL layout, and costs no renderer
      dependency), semantic headings replacing the hardcoded `text-*`/`font-*`
      classes, and `subjectTitle` — a snapshot in the catalog's storage
      language taken at issuance — now translated for the reader via one cached
      `getLabels` lookup.

  **New dict keys** (en+ar, parity verified 584/584 lumos, 10883/10883 school):
  `lumos.lesson.{quizAnswerPlaceholder,quizRecorded,quizPractice}`,
  `school.exams.qbankUi.form.attach*` (7).

  **Browser-verified** on demo.localhost (en + ar/RTL, admin session), after
  the code was written — and it caught a real regression the unit tests could
  not: the verified SD curriculum stores FILL_BLANK questions with
  `options: null`, i.e. **no accepted answers at all**. Counting those toward
  the denominator would have capped the sd-g12-commerce "Consolidation" lesson
  at 70% for every student forever, and my new UI would have demanded text in
  three blanks that can never be right. `fetchLessonQuizQuestions` now drops
  any row with no usable answer key (including a choice question with nothing
  flagged `isCorrect`) and over-fetches 3× so the quiz still fills. Verified
  after the fix: 10 answerable questions render, a deliberate wrong answer
  scores 90% (9/10) with the picked option red and the correct one green,
  explanations reveal, the Arabic side reads `اختبار` / `إرسال الإجابات` /
  `محاولة تدريبية…` under `dir=rtl`, and the RSC flight payload carries
  `choices` with **no `isCorrect` and no `acceptedAnswers`** — checked against
  the wire, not just the type. The qbank picker was driven end to end: choosing
  a subject populates 4 real chapters and 43 lessons from the Lumos routes,
  names translated to the reader's locale.

  **Follow-up, same day:** the tier ABOVE the new lesson picker was itself a
  coin flip — qbank's Subject select rendered 123 rows in which **26 names are
  duplicated across grades** (the catalog seeds one Subject per grade and keeps
  the grade out of `Subject.name`), so choosing the subject that scopes the
  lesson picker was guesswork. `getSchoolSubjectOptions` now carries the grade
  and `subjectOptionLabel()` renders it zero-padded, derived from
  `gradeNumber` and never from `AcademicGrade.name` — the same rule this
  block's picker follows. Additive, so the other six subject pickers sharing
  that helper can adopt it in one line each.

  **Deliberately NOT done** — needs a product decision, not a patch:
  certificates still gate on watching, never on assessment (ISSUE.md files this
  under "design gaps to decide"; wiring quiz scores into issuance would make
  certificates unreachable for every quiz-less subject, which is most of the
  verified SD curriculum today). Also untouched: the `submitQuestion` PENDING
  vs `createQuestion` self-approve moderation asymmetry (both lanes now WORK,
  they just moderate differently), and the S3 hard-delete on video removal
  (destructive, needs explicit approval).

- **2026-08-14 — `stream` → `lumos` everywhere the name was ours to change.**
  tsc 0, production build green (both moved API routes resolve), 6012/6013
  tests (the one failure is the pre-existing `bilingualField` ratchet in
  school-marketing/template, untouched here). NOT yet deployed. Rollback tag
  `pre-lumos-rename`.

  **Renamed.** Three directories via `git mv` — `src/components/stream` →
  `lumos` (88 files), `src/tests/school-dashboard/stream` → `lumos` (20),
  `src/app/api/stream` → `api/lumos` — then 112 `@/components/stream` import
  sites, 74 distinct `Stream*`/`stream*` identifiers, the dictionary namespace
  (`dictionary.stream.*` → `.lumos.*`, root key and all 64 consumers), the
  rate-limit buckets (`STREAM_UPLOAD` → `LUMOS_UPLOAD`, `"stream-upload"` →
  `"lumos-upload"`, …), the sidebar and command-menu keys, `public/stream` →
  `public/lumos`, `docs/stream-structure.tsx` → `lumos-structure.tsx`,
  `.claude/blocks.json`, 32 doc pages, and the cross-block `../stream/` links
  in catalog / finance / school-dashboard / community / subjects that had been
  pointing at a directory that no longer exists.

  **Deliberately NOT renamed** — each is a different `stream`:
  1. **The Prisma models.** `StreamCourse`, `StreamCategory`, `StreamChapter`,
     `StreamLesson`, `StreamAttachment`, `StreamEnrollment`,
     `StreamLessonProgress`, `StreamCertificate` in `prisma/models/stream.prisma`,
     and the `db.streamEnrollment` / `tx.streamCategory` accessors. Renaming a
     Prisma model renames the table — a migration, not a refactor — and
     `verifyPaymentAndActivateEnrollment` still queries `streamEnrollment` on
     the live payment-success path. (The blanket pass DID catch
     `streamEnrollment` and `tx.lumosCategory`; both were reverted, and tsc is
     what caught the second one.)
  2. **Academic streams.** `AcademicStream`, `academicStreamId`, `StreamType`,
     `preferredStream`, `streamId` on subject selections, the `stream` column
     on fee structures, `"stream-sci"` / `"stream-arts"`, and the `"stream"`
     keys in `school-{en,ar}.json`. This is a school's Science/Arts/Commerce
     track — a different domain that happens to share the word.
  3. **The S3 object prefix `stream/<schoolId>/video/`.** Every video ever
     uploaded lives under it, and both the presign route and `uploadVideo`'s
     new ownership assert match on it. Renaming it orphans existing objects and
     breaks the guard against already-stored keys.
  4. **Genuine streams.** `ReadableStream`/`TransformStream`, the SSE endpoint
     at `api/banking/transactions/stream`, `MediaStream` in the message
     recorder, `streamdown`/`streamDelay` in the AI response atom, and the
     English word in "streamlined"/"streaming".

  **Bonus fix found on the way.** `next.config.ts` carried seven
  `/:lang/stream/*` redirects whose destinations were ALSO `/:lang/stream/*` —
  every one landed on a route that stopped existing at the rebrand. They now
  target `/lumos/*`, and a catch-all `/:lang/stream/:path*` →
  `/:lang/lumos/:path*` (ordered last, since Next matches in order) rescues
  every other old bookmark and pre-rebrand `Notification.url` row.

- **2026-08-13 (second pass) — revalidation, storage-key scope, and a success
  surface for the upload dialog.** tsc 0, i18n + lumos + catalog 596/597 (the
  one failure is the pre-existing `bilingualField` ratchet, drifted in
  school-marketing/template — untouched here). NOT yet deployed.
  1. **Every dynamic `revalidatePath` in the block now passes `"page"`** — 13
     call sites across `video-actions.ts`, `video-owner-actions.ts`,
     `video-review-actions.ts`, `enrollments/actions.ts` and
     `dashboard/lesson/catalog-actions.ts`. Next's reference is explicit: with
     a dynamic segment in the path, `type` is **required**, so all 13 were
     no-ops. The reviewer queue did not refresh when a submission landed, and
     the uploader's own list did not show the new row until a manual reload.
     **Severity correction (2026-08-14):** the original entry claimed the
     reviewer queue "never refreshed" and the uploader's list needed a manual
     reload. That was read off the Next docs, not observed. `pnpm build`
     reports **691 of 692 routes as `ƒ` (dynamic)** — they re-render per
     request, so there was no cached entry to bust and the staleness almost
     certainly never manifested. The calls were still dead and several named
     routes that do not exist; the fix is correct, the symptom was not.
     It becomes load-bearing the moment any of these routes adopt
     `'use cache'` / Cache Components.

     A second rule surfaced while verifying the first, from
     `next/dist/server/lib/implicit-tags.js`: `revalidatePath` emits the tag
     `_N_T_<path>/<type>`, and a page registers only its **route pattern** or
     its **concrete URL** — so a path that blends the two (a real slug inside a
     bracketed path) matches nothing at all. Five sites here were that shape
     and are now full patterns (`.../courses/[slug]`,
     `.../dashboard/[slug]/[lessonId]`): coarser invalidation, but it runs.
     `uploadVideo` also revalidated `/lumos/admin/courses/<slug>` — **a path no
     route has ever served**; the lesson lives at `dashboard/[slug]/[lessonId]`
     (staff) and `courses/[slug]/[lessonId]` (learner), and both are now
     revalidated along with `/lumos/videos`. The enrollment test asserted the
     old bare call and was updated: it had been encoding the bug.

  2. **`uploadVideo` asserts the storage key's prefix**, mirroring
     `DELETE /api/blob/presign`. A key outside `stream/<schoolId>/video/` is
     refused, so a teacher can no longer name another school's object — which
     `getObjectSize` would have billed to their own quota and `deleteOwnVideo`
     would later have CloudFront-invalidated.
  3. **Submitting now ends on a success surface, not a vanished dialog.**
     Modelled on `onboarding/success-completion-modal.tsx`: one centered
     column, animation on top, a muted lead line, and the destination itself as
     the single prominent link (the lesson, client-navigated). The step dots
     and header are hidden (`sr-only` — Radix still requires the title), and
     the footer becomes "Upload another" / "Done". The success toast and its
     `proposeVideo.toast.success` key are gone: the surface says it better and
     the two together were double feedback.
  4. **New atom `atom/anthropic-animation.tsx`** — the Anthropic Lottie set
     (`api`/`hero`/`claude-for-excel`), packaged once instead of a fourth
     hand-rolled fetch. Sibling to `celebration-animation.tsx` and built to the
     same discipline (per-asset module cache, lottie-web behind a dynamic
     import, aria-hidden, reduced-motion, sized wrapper so nothing shifts).
     Two deliberate differences: **no eager warm** (these files are 1–2.6MB, so
     callers call `prefetchAnthropicAnimation()` at the step before the moment
     — the dialog does it on reaching confirm), and **dark mode is a recolor**
     — the art ships as clay over near-black linework that vanishes on a dark
     dialog, so the near-black is remapped on a cloned copy of the cached JSON.
     The clay accent is left alone; it is the point of the art.
  5. **New dict keys** `proposeVideo.success.{title,lead,note,another,done}`
     (en+ar), `toast` removed.

- **2026-08-13 — upload dialog: five functional fixes from an end-to-end trace
  of `propose-video-dialog.tsx` → `/api/blob/presign` → `uploadVideo` →
  `lib/quota.ts` → `video-owner-actions.ts`.** tsc 0, lumos + catalog suites
  319/319. NOT yet deployed. Four more findings from the same trace stayed
  open — see the Known Issues section dated the same day.
  1. **The Upload tab could proceed with no file, submitting a URL pasted on
     the other tab.** `urlOk` tested `!!videoUrl`, and the tab handler only
     cleared state in the `upload → url` direction. Paste a link, switch to
     Upload, and Review enabled over an empty drop zone; the row was then
     created from the pasted URL while step 3 labelled it "Source". The test is
     now the finished upload (`uploadStatus === "done" && uploadedMeta`), and
     the handler clears `videoUrl` in **both** directions.
  2. **Switching tabs mid-upload did not abort the PUT, and the XHR clobbered
     the user's typed URL.** The guard keyed on `uploadedMeta`, which is null
     until the PUT resolves — so an in-flight upload survived the switch and
     landed `setVideoUrl(presign.finalUrl)` on top of whatever had been typed
     on the URL tab. Submitting from there wrote a SELF_HOSTED row with no
     `storageKey`/`fileSize`: **no quota charged and no CDN invalidation
     path**. The guard is now `uploadStatus !== "idle" || uploadedMeta`, which
     restores the tab-switch cleanup CLAUDE.md already claimed.
  3. **Every specific presign refusal was discarded.** The route returns 413
     "Storage quota exceeded", 500 "S3 not configured", 403 "Insufficient
     permissions"; the client packed `body.error` into an `Error` and the catch
     replaced all of it with "Upload failed. Please try again." — telling a
     teacher who is over quota to retry, forever. The thrown message now
     carries the **status** (`presign-status-<n>`, prose logged to the console),
     which the catch maps to a translated reason. New dict keys (en+ar):
     `fields.uploadQuotaExceeded`, `uploadForbidden`, `uploadUnavailable`.
     The reason is also rendered inside the drop zone, so it outlives the toast
     — the error state used to render the identical idle zone with no message.
  4. **An outside click aborted an in-flight upload with no confirmation.**
     `DialogContent` had no dismissal guard, so a stray backdrop click ran
     `resetForm` → `clearUpload` → `xhr.abort()` + the cleanup DELETE, losing
     hours of transfer on a multi-GB file. `onInteractOutside` and
     `onEscapeKeyDown` now refuse while `uploadStatus === "uploading"` and say
     why (`fields.uploadBusyClose`). **The same check repeats in
     `onOpenChange`** — Radix's corner X calls that directly and reaches
     neither handler, so without it the one control that looks like "close"
     stayed the one that destroyed the upload. The explicit Cancel control on
     the progress card is the way out. A `beforeunload` listener (with
     `returnValue` set, which older Chrome still requires), registered only
     while bytes move, covers closing the tab.
  5. **The truncation notice counted the wrong list.** `search.truncated`
     interpolated `filteredResults.length`, so typing a query that narrowed the
     page to 3 read "Showing the first 3 — pick a chapter or search to narrow
     it down." Now `results.length` — the server page, which is what the
     sentence is about.

- **2026-08-12 (third pass) — step 1 became a two-pane drill-down mirroring
  /lumos/courses.** tsc 0, picker suite 36/36, lumos + catalog 505/505,
  browser-verified en + ar/RTL. NOT yet deployed.
  1. **Pane one = numbered grade pills + that grade's subjects** (Abdout,
     pointing at `/lumos/courses`). Same control as
     `courses/content.tsx` — `rounded-full px-3 py-1`, active
     `bg-primary text-primary-foreground` — carrying the zero-padded number
     only (`01`…`12`); the spelled "Grade 01" survives where a word is needed
     (breadcrumb, step-2 chip, confirm). Subjects list below with their lesson
     counts and a chevron. **Grade is now always concrete** (defaults to the
     first) — the "All grades / All subjects" selects are gone.
  2. **Pane two = chapter select + search inside the chosen subject**, with a
     Back button and a `Grade 01 · Mathematics` breadcrumb. Picking a lesson
     still auto-advances to step 2.
  3. **Search moved to the client, and that fixed a real bug.** The server
     matched `contains` against SOURCE text while the list displayed
     TRANSLATED text — typing "seven" against a visible "the number seven"
     returned nothing (reproduced in the browser). Since a pane-two page now
     holds one whole subject, typing filters the fetched page on the text the
     user can actually see. `query` is deleted from `searchProposableLessons`
     and its route; `MAX_PROPOSABLE_RESULTS` 50 → **200** so a subject
     (~30-60 lessons) always fits, which is what makes client filtering
     complete. Bonus: no round-trip per keystroke — one fetch per
     (subject, chapter). **If cross-subject search ever returns, it must use
     the cache-backed bilingual `search()` in `translation/search.ts`, never a
     raw `contains`.** This supersedes the P3 note in the second-pass entry.
  4. **New dict key** `proposeVideo.search.lessonCount` (en+ar, parity
     573/573). GOTCHA re-confirmed: **a new dictionary key renders the English
     fallback until the dev server restarts** — `getDictionary` caches at boot,
     and Turbopack's hot reload does NOT refresh it. "31 lessons" persisted in
     Arabic through hard reloads and only became "31 درس" after `pnpm dev`
     was restarted.

- **2026-08-12 (second pass) — upload dialog UX polish + LMS-hide fidelity +
  translated picker.** tsc 0, `get-proposable-lessons` suite 37/37, lumos +
  catalog 506/506, **browser-verified locally on demo.localhost (en + ar/RTL,
  screenshots in `.claude/screenshots/propose-*.png`, local session artifacts, not committed)**. NOT yet deployed.
  1. **The picker is bridge-minus-hidden now (Abdout's rule).** The bridge
     (`SubjectSelection.isActive`) was honored but `ContentOverride` was not —
     a teacher could propose a video for a lesson their school hides from
     Lumos. All three fetchers now exclude `isHidden` chapters/lessons (same
     rows `get-course.ts` filters by): hidden chapters never reach counts or
     search, hidden lessons subtract inside the relation count
     (`_count.lessons.where.id.notIn`), and a hidden chapter named directly by
     id yields nothing (the id conditions ride in `chapter.AND`, never merged
     as object keys). Verified end-to-end with a real override row on the demo
     school: the lesson vanished from the live API while its 22 same-named
     siblings stayed.
  2. **Picker names translate (Abdout's ask).** Grade/subject/chapter/lesson
     names go through one batched `getLabels` per response — string-keyed
     cache, so "الرياضيات" costs one translation for all 12 grades carrying
     it; misses fall back to source text and never block. `lang` flows page →
     dialog prop → `locale=` on both routes. Verified live both directions
     ("Protein Synthesis" → "تكوين البروتينات" on /ar; Arabic lessons in
     English on /en). Platform scope (DEVELOPER) deliberately stays raw — that
     audience manages the source content and the cache is school-scoped.
  3. **Smoothness pass, all browser-verified:** flicker-free search (stale
     results stay dimmed with a corner spinner while in flight; retyping after
     a failure resets the error), auto-advance on lesson pick (Back and the
     step dots recover; the pick is pinned in step 1 and echoed as a context
     chip on step 2), completed step dots are buttons back, dialog is a capped
     flex frame (`max-h-[85vh]`) whose body scrolls under a pinned
     header/dots/footer and scrolls to top per step, search input autofocuses,
     title autofocuses on step 2 and prefills from an uploaded file name,
     drag-and-drop on the dropzone, bad URLs die at step 2 with an inline
     destructive hint (client mirrors the server's `isValidVideoUrl` — the
     shared pure module, so they cannot drift), audience is three compact icon
     cards + one dynamic helper line (was three stacked helper paragraphs),
     pricing matches, `has-[[data-state=checked]]` styling per the
     card-payment-method precedent with sr-only radios (keyboard reachable via
     `has-[:focus-visible]` ring).
  4. **Grade labels are numbered, not named** (Abdout). `ProposableGrade`
     dropped its `name` — the tree carries `gradeNumber` and the dialog renders
     zero-padded `Grade 01`…`Grade 12` / `الصف 01`…`الصف 12`. School grade
     names are prose that translates inconsistently and sorts badly; the number
     is the same fact in both locales, and dropping the field also dropped a
     translation call per response. Verified in both locales.
  5. **New dict keys** `proposeVideo.fields.urlInvalid` + `uploadDragHint`
     (en+ar, parity 572/572).
  6. ~~Known limitation (P3): the search term matches SOURCE text only.~~
     **RESOLVED by the third pass** — it bit immediately once names were
     translated, and search moved client-side onto the displayed text.
  7. **Prod smoke still owed on next deploy** (`/watch`): dev now covers the
     full behavior matrix locally, so the deploy check is the routine one —
     dialog opens, search 200s, names translate.

- **2026-08-12 — the propose dialog's lesson picker became the catalog's own
  hierarchy.** tsc 0, `get-proposable-lessons` suite 31/31 (was 12), lumos +
  catalog 500/500. NOT yet deployed.
  1. **The long list is gone; step 1 is grade → subject → chapter → lesson.**
     It rendered every proposable lesson as one flat scroll box (`take: 500`,
     grouped by subject) — impractical the moment a school selects a handful of
     curricula, and silently truncated past 500 with no way to reach lesson 501. It is now three cascading selects (each resets the tiers below it)
     over a cmdk search of lesson / chapter / subject name, one bounded page of
     ≤50 at a time, with the pick pinned above the list so it survives a new
     search.
  2. **Grade had to be the first tier — a subject list alone is unusable.**
     The catalog seeds ONE Subject per grade and leaves the grade out of
     `Subject.name`, so a K-12 school's ~120 selections show "الرياضيات" a
     dozen times over. `SubjectSelection.gradeId → AcademicGrade` already
     carried the answer; the scope resolver now reads it, and every subject
     rendered outside a chosen grade carries its grade in the label. The school
     `customName` wins over the catalog name, and the per-lumos duplicate rows
     are deduped.
  3. **The catalog no longer ships to the browser.** The two pages fed the
     dialog up to 500 lesson rows in the RSC payload on every load, whether or
     not anyone opened it. They now send `getProposableCatalog()` — the grade →
     subject tree, subjects not lessons — and chapters (`GET
/api/lumos/proposable-chapters`) and lessons load as the user walks down.
  4. **Search is a route handler, not a server action.** `auth()` rotates the
     session cookie inside action requests, so an action-backed search would
     have shipped a full RSC page re-render per keystroke (the notifications
     bell finding, 2026-08-11). New `GET /api/lumos/proposable-lessons`
     (`q` / `subjectId` / `take`, `take` clamped server-side, term capped at
     100 chars, `Cache-Control: no-store`); `get-proposable-lessons.ts` dropped
     its `"use server"` directive so the search can't be reached as a POST stub
     either. The client debounces 250ms and races through an `AbortController`.
  5. **`subjectIds` are AND-ed with the caller's scope, never merged into it.**
     Caught while writing the test: `{ ...subjectWhere, id: subjectId }`
     overwrites `id: { in: selectedSubjectIds }`, which would have let a
     teacher browse any published subject in the global catalog by id. Both the
     permission probe and the lesson query now use `AND: [scope, { id: { in } }]`,
     and a test asserts the shape. `chapterId` rides inside the same `chapter`
     clause as the subject scope, so it needs no probe of its own.
  6. **The upload-button gate got stricter, not looser.** It used to be
     "≥1 lesson in the payload"; it is now "≥1 grade holding a subject that
     actually has lessons" — `getProposableCatalog()` drops zero-lesson
     subjects and the grades left empty by that, so the button can no longer
     open a dialog with nothing to pick.
  7. **The fetch effect keys on a query string, not a scope object.** An
     object identity there re-fires the effect on every render, and
     `d.search ?? {}` guarantees a fresh identity whenever a caller passes a
     dictionary without that subtree — an infinite fetch loop waiting for the
     first partial dictionary. Same reason `gradeLabel` depends on primitives.
  8. **i18n + dark mode.** New `lumos.proposeVideo.search.*` (11 keys, en+ar,
     parity held at 570/570). The old sticky subject header was `bg-white` —
     a light-mode-only bar that came out of the markup with it.

  Known edge, DEVELOPER only: browsing a _platform_ grade holding more than
  `MAX_PROPOSABLE_SUBJECT_IDS` (100) subjects sends every id and the server
  slices to the first 100, so the tail is silently out of scope for that
  search. School grades hold ~10 subjects, so no school role can reach it; the
  fix, if it ever matters, is a grade filter on the server rather than an id
  list from the client.

  ~~Browser verification owed.~~ **Superseded by the second pass above**: the
  "no catalog tables locally" diagnosis was wrong (the tables are `@@map`-ed —
  `catalog_subjects`, not `"Subject"`), and the full matrix was then verified
  live on demo.localhost: 12 grades populate, subjects narrow per grade,
  chapters load per subject, search pages at 50 with the truncation hint, the
  pick survives and auto-advances, and the whole step mirrors correctly on
  /ar.

- **2026-08-11 — tenant URLs + lesson-level materials + override-aware
  completion (the trace's fix round, scoped by Abdout's governance note).**
  tsc 0, lumos suite 283/283 (19 files; +6 new cases). NOT yet deployed.
  1. **Tenant-aware URLs everywhere lumos leaves the app.** New
     `shared/tenant-url.ts` → `lumosTenantUrl(path, lang?)`: builds the
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
  refunds, real home-page data.** tsc 0, 347/347 (lumos + webhooks). All browser-
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
     `lumos.certificate.*` keys; locale-aware dates (`ar-SD`). New fetcher
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
  4. **`cancel_url` 404 fixed** — pointed at `/lumos/browse`, which doesn't
     exist; now `/lumos/courses`.
  5. **Home "new releases" shows real courses.** Was 4 invented courses
     ("PyTorch for Deep Learning") with fabricated 4.7–4.9 ratings, artwork
     hotlinked from Coursera's CDN, every card linking to the generic catalog.
     Now driven by this school's own `SubjectSelection` via `getAllCatalogCourses`,
     links to each real course, renders a rating only when one exists, and hides
     itself when the school has no selections. Fake learner counts removed from
     `skills-section.tsx`. **The rest of the borrowed home-page content is NOT
     fixed — see P0 above.**

- **2026-07-17 — `/lumos/courses` pass: hero art, level i18n, See More, tenant
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
     every Arabic card read "Elementary". Added `lumos.courseLevels`
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
  tsc 0, lumos suite 278/278 (6 new cases):
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
     fully keyed (`lumos.videoReview.*`, `lumos.videoSettings.*`, en+ar),
     locale-aware dates, dict-first toasts, logical (RTL-safe) icon margins.
  6. **Search-bar de-fabricated + localized** — removed the hardcoded
     "Recently viewed"/"Recommended" placeholder courses (external Coursera
     images, fake ratings) and the category grid that linked to non-existent
     departments; the Explore dropdown is now popular-search chips (from
     `lumos.search.terms`, en+ar) + a browse-all link, all keyed.

- **2026-07-11 — Upload → catalog → ownership loop closed (production pass).**
  Six fixes shipped in one pass; tsc 0, lumos suite 272/272 green:
  1. **Direct-to-S3 upload wired** — the propose dialog's Upload tab now does
     presign (`/api/blob/presign`) → XHR PUT with progress → submits
     `finalUrl` + `fileSize`/`storageKey`/`storageProvider` (provider
     SELF_HOSTED). `uploadVideo` persists the storage fields, so
     delete/revoke/replace CDN invalidation works for uploads. Was a
     "coming soon" stub while the presign route sat unused.
  2. **Admins can upload** — `/lumos/settings?tab=videos` (the tab teach/\*
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
  250/250 lumos unit tests green. See `ISSUES.md` → "Optimization Pass".

## Enhancements (Post-MVP)

_Deferred to next quarter+._
