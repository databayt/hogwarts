---
epic: 05
sprint: Q3-2026
title: Stream (LMS)
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/lms
last_audited: 2026-07-17
---

# Lumos (LMS) Block

> URL-facing name is **Lumos** (`/lumos`); the component directory is still
> `src/components/stream/` — a deliberate, recorded gap in the mirror pattern
> (see ISSUE.md P2).

## Context

Stream (LMS) — Q3 2026 sprint epic 05, maturity `Built+Polish`, ~90% complete and **at final review/test** (remaining items are post-release engineering debt — see ISSUE.md). See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [323](https://github.com/databayt/hogwarts/issues/323) · QA guide: [377](https://github.com/databayt/hogwarts/issues/377).

## Before You Start

1. Read `README.md` here for routes, props, and integration points
2. Read `ISSUE.md` here for the P0/P1/P2 priorities + MVP checklist
3. Skim the [Q3 Sprint Plan](https://kun.databayt.org/en/docs/sprint) for the epic's owner + bet
4. Check the [tracker](https://github.com/databayt/hogwarts/issues/323) for cross-feature dependencies

## Key Decisions

- **Data fetchers in `data/catalog/` are NOT `"use server"`.** They are
  server-only modules imported by server components, wrapped in React `cache()`
  for per-request dedupe. `cache()` and `"use server"` are incompatible —
  `"use server"` compiles every export into a POST RPC stub, which can't be
  deduped by `cache()` and needlessly widens the attack surface. New fetcher →
  follow `get-course.ts` (no directive + `cache()`), not the action files. (Some
  single-call fetchers like `check-enrollment`/`get-course-progress` still carry
  `"use server"` for historical reasons — harmless, but don't add `cache()` to
  them without first removing the directive.)
- **A `"use server"` fetcher must resolve `schoolId` itself, never accept it.**
  `"use server"` turns every export into a POST endpoint, so a `schoolId`
  parameter is attacker-controlled: `getAllCatalogCourses` took one until
  2026-07-17 and was reachable with any tenant id (and reached
  `ensureSubjectSelections`, which _writes_). Call `getTenantContext()` inside
  the action instead. `get-course-sidebar-data.ts` still has the old shape (P1 in
  ISSUE.md). Plain server-only fetchers (no directive + `cache()`, per the note
  above) may keep taking `schoolId` — they aren't reachable from the browser.
- **`asset()` always rewrites to `cdn.databayt.org/hogwarts/<basename>`** — it
  drops the source subdir, so `asset("/illustrations/x.svg")` and
  `asset("/icons/x.svg")` are the same URL, and **putting a file in `public/`
  does not make it resolve**; the object has to exist on the CDN. A missing key
  returns **403, not 404**. Assets fine-grouped into their own namespace
  (`anthropic/`, …) are referenced by full CDN URL passed through `asset()`
  (which returns absolute URLs untouched) — see `home/content.tsx` and the
  courses hero. The 2026-07-12 CDN migration rewrote at least one real path to an
  invented `illustrations/` filename; if art is missing, check the CDN before
  trusting the call site.
- **The real paywall is the `null` videoUrl from the server** (see
  `get-lesson-with-progress.ts`), not client lock UI. Never emit a playable URL
  for an unowned PAID video.
- **No-video AND broken-source lessons fall back to the marketing "story"
  clip.** When a lesson has zero videos (`lesson.availableVideos.length === 0`)
  — or the selected video's source fails to load (`VideoPlayer.onSourceError`
  → `sourceFailed`) — the lesson player (`dashboard/lesson/content.tsx`) plays
  `asset("/media/story.mp4")` — the same clip on the public SaaS marketing
  page — so the surface is never empty. `playingFallback`
  (= `isFallbackVideo || sourceFailed`) gates `onProgress`/`onComplete` so the
  placeholder clip NEVER writes lesson watch-progress or auto-completes a
  lesson (the manual "Mark as Complete" button still works). Critically, the
  fallback is keyed on _no videos_ or _source error_, NOT on a `null` URL — a
  paywalled (paid + unpurchased) video keeps its locked/purchase UX and must
  never be replaced by the clip. The `sourceFailed` swap is part of the
  VideoPlayer `key` (a `<video>` needs a remount, not just a new `src`).
- **PUBLIC/PAID approval belongs to the platform lane.** The school Review tab
  (`reviewVideo`) approves only SCHOOL/PRIVATE-surface videos and refuses
  APPROVE for PUBLIC/PAID (reject stays allowed) — those flow through
  /catalog/approvals (DEVELOPER, `approveContent` with override). Owner-side
  mirror: `updateVideoVisibility` widening an APPROVED video to PUBLIC resets
  `approvalStatus` to PENDING (DEVELOPER exempt; narrowing always free). Both
  lanes notify the contributor (`db.notification.create`, failure-tolerant).
- **Direct upload = presign → S3 PUT → storage fields.** The propose dialog's
  Upload tab POSTs `/api/blob/presign` (5GB cap, video MIME allowlist, quota
  pre-check → 413), PUTs via XHR for progress, then `uploadVideo` persists
  `fileSize`/`storageKey`/`storageProvider` (provider SELF_HOSTED) — storageKey
  powers CloudFront invalidation on delete/revoke/replace and the quota
  counter. Quota bytes are AUTHORITATIVE: `uploadVideo` HEADs the object
  (`getObjectSize` in `src/lib/s3.ts`) and overrides the client-claimed size.
  Abandoned uploads self-clean: the dialog fires the guarded
  `DELETE /api/blob/presign` (own-prefix only; refuses keys a Video row
  references) on remove/tab-switch/close-without-submit. Upload entry points:
  teacher dashboard overview AND the settings Videos tab
  (ADMIN/DEVELOPER/TEACHER, fed by `getProposableCatalog()`). New PENDING
  submissions notify the school's other ADMINs (off-response-path,
  failure-tolerant).
- **The lesson picker walks grade → subject → chapter → lesson; it never
  enumerates.** **Grade is the first tier and is not optional decoration**: the
  catalog seeds **one Subject row per grade** (`grades: [n]`, `gradeRange`) and
  leaves the grade OUT of `Subject.name`, so a school teaching 12 grades holds
  ~120 selections in which "الرياضيات" appears a dozen times, mutually
  indistinguishable. `SubjectSelection.gradeId → AcademicGrade` is where the
  grade lives, which is why `resolveProposableScope()` selects the grade
  relation and `getProposableCatalog()` returns a grade → subject tree (the
  school's `customName` wins over the catalog name; one row per academic stream
  is deduped). Any list of subjects rendered without their grade is a bug.
  **Grade LABELS are derived from `gradeNumber`, never from
  `AcademicGrade.name`** (Abdout, 2026-08-12): the tree carries the number
  only and the dialog renders zero-padded "Grade 01"/"الصف 01". School grade
  names are prose ("الصف الحادي عشر"), translate inconsistently, and don't sort
  visually — so don't reintroduce `name` here, and don't spend a translation
  call on it.
  Below that, tiers load on demand: chapters from
  **`GET /api/stream/proposable-chapters?subjectId=`**, lessons from
  **`GET /api/stream/proposable-lessons`** (`q` / `subjectIds` / `chapterId`).
  Route handlers, NOT server actions: `auth()` rotates the session cookie
  inside action requests, so an action would ship a full RSC re-render of the
  page on every keystroke (the notifications-bell finding, 2026-08-11).
  `get-proposable-lessons.ts` therefore carries **no `"use server"` directive**
  — one would compile the search into a browser-reachable POST stub and buy
  back that cost. Every entry point funnels through `resolveProposableScope()`
  (proposer roles → the school's active `SubjectSelection`s; DEVELOPER gets the
  global catalog bucketed by `Subject.grades`). Caller-supplied `subjectIds`
  are **AND-ed** with that scope, never spread over it: `{ ...scope, id }`
  overwrites `id: { in: selectedIds }` and hands the caller any published
  subject they name. `chapterId` needs no probe — it rides inside the same
  `chapter` clause as the subject scope. Pages cap at 50 + a `hasMore` flag;
  the dialog says "narrow it down", it does not paginate. The client's fetch
  effect keys on a **query string**, not a scope object — an object identity
  there re-fires on every render, and `d.search ?? {}` makes that happen
  whenever a caller passes a dictionary without the subtree.
  **The picker is bridge-minus-hidden (Abdout, 2026-08-12):** the scope also
  loads the school's `ContentOverride` `isHidden` rows (the same rows
  `get-course.ts` filters the student catalog by) and every tier excludes
  them — nobody proposes a video for content the school's own LMS never
  shows. Hidden-lesson subtraction happens inside the relation count
  (`_count.lessons.where.id.notIn`), and id-vs-notIn conditions ride in `AND`
  arrays, never merged as object keys. Picker names are **translated** through
  one batched school-scoped `getLabels` per response (`lang` flows page →
  dialog prop → `locale=` on the routes); platform scope stays raw on purpose.
  **Because names are translated, the lesson list has NO server-side text
  search** — a database `contains` matches source text the reader cannot see
  ("seven" missed a lesson displayed as "the number seven"). A page holds one
  whole subject (`MAX_PROPOSABLE_RESULTS` 200) and the dialog filters it
  client-side on the displayed text. Anyone restoring cross-subject search
  must use the cache-backed bilingual `search()` in `translation/search.ts`.
  The dialog's URL field mirrors the server's `isValidVideoUrl` from the
  shared pure module `shared/url-validators.ts` — keep both sides importing
  that one module so they cannot drift.
- **Stream client i18n is dict-key-with-English-fallback everywhere** —
  `stream.videoReview.*`, `stream.videoSettings.*`, `stream.search.*`,
  `stream.proposeVideo.fields.upload*`, `stream.lesson.unlock/purchaseFailed`
  all exist in BOTH `stream-en.json` and `stream-ar.json`. The search-bar's
  Explore dropdown is deliberately minimal (popular chips + browse-all) — the
  old "recently viewed / recommended / category" cards were fabricated
  placeholder content (external Coursera images, departments that don't
  exist); don't reintroduce them without real data.
- **Money fields are `Float`** (`Video.price`, `VideoPurchase.amount`); go
  through `Number()` before arithmetic. Float→Decimal is deferred (ripples into
  ~13 read sites + a shared-DB table rewrite).
- **Catalog `Subject`/`Lesson`/`Chapter`/`Question` are platform-global** (no
  `schoolId`); stream tenant scoping comes from `SubjectSelection`,
  `Enrollment.schoolId`, `Video.schoolId`, and `ContentOverride` (per-school
  hide of a chapter / lesson / specific video, plus `hideQuiz` to hide a
  lesson's practice quiz).
- **Video visibility semantics** (`ContentVisibility`: PRIVATE | SCHOOL | PUBLIC
  | PAID): PRIVATE = owner-only; SCHOOL = the owner's school members; PUBLIC =
  everyone; PAID = everyone but gated on a `VideoPurchase` (SUCCESS). The lesson
  video query MUST keep its `OR: [{ userId: me }, { schoolId, visibility in
[SCHOOL,PUBLIC,PAID] }, { PUBLIC }, { PAID }]` shape — a bare `{ schoolId }`
  arm leaks PRIVATE videos to the whole school and lets `revokeVideoAccess`
  (→ PRIVATE) bypass the paywall. Owners change visibility via
  `updateVideoVisibility`; remove a paywall via `removeVideoPaywall` (PAID →
  free audience, clears price) — the generic toggle deliberately refuses PAID.
- **Governance: the hierarchy is platform-owned (Abdout, 2026-08-11).**
  Subject → Chapter → Lesson structure comes from the catalog; schools only
  hide/activate (`ContentOverride`) and contribute at LESSON level (videos,
  materials, quiz questions). `submitChapterProposal`/`submitLessonProposal`
  are deliberately unwired — do not add UI for them (subject proposals stay
  live). Corollary: every student-facing completion/progress denominator must
  be published-minus-hidden — `markLessonComplete`, `getCourseProgress`, and
  `get-course.ts` all agree on this now; keep new surfaces consistent.
- **Absolute URLs that leave the app go through `shared/tenant-url.ts`**
  (`streamTenantUrl(path, lang?)`) — email links, Stripe success/cancel,
  anything a user follows from outside the app. Never build them from
  `env.NEXT_PUBLIC_APP_URL`: that is the MAIN host, no `/stream` route exists
  there, and every such link 404'd for tenant users (the paid-checkout
  redirect included). The helper reads `x-subdomain` + `host` and keeps the
  link on the request's own root domain (databayt.org / balqalam.com /
  localhost); in-app navigation stays relative (`/${locale}/...`) as before.
- **Lesson materials render from catalog `Material`, not `Attachment`.**
  `getLessonWithProgress` fetches the lesson's materials gated exactly like
  the lesson quiz — `approvalStatus: APPROVED`, `status: PUBLISHED`,
  `visibility: PUBLIC` or `contributedSchoolId` = viewer's school — and the
  lesson player's Resources section renders them. Keep that OR shape: a bare
  school arm would leak other schools' SCHOOL/PRIVATE materials. `Attachment`
  has no writer anywhere (P2: delete or adopt).

## Danger Zones

- **The legacy `streamEnrollment`/`streamCourse` models still exist** and
  `verifyPaymentAndActivateEnrollment` (the live payment-success path) still
  queries them — don't delete those models until that path migrates to
  `Enrollment`. (The dead `enrollInCourseAction`/`checkEnrollmentStatus` were
  removed 2026-06-14.)
- **The Review surface is a route now, and fetches its own queue.** It used to
  be a tab fed by a `reviewContent` prop that `settings/page.tsx` built from
  `getPendingVideos()` — a merge regression dropped that prop once and the tab
  silently rendered empty. `settings/review/page.tsx` calls `getPendingVideos()`
  directly so the wiring can't come undone; keep it that way. `reviewVideo`
  still writes via tenant-scoped `updateMany` (schoolId on the write) — don't
  revert it to `findFirst+update`.
- **`/lumos/settings` is redirect-only; the surfaces are top-level.** The old
  "Overview" tab rendered the same `StreamAdminDashboardContent` as
  `/lumos/dashboard`, so the two collapsed. Real surfaces are
  `lumos/(app)/<name>/page.tsx` → `/lumos/<name>`, each guarded by
  `requireSettingsAccess` from `settings/guard.ts` (ADMIN/DEVELOPER everywhere,
  TEACHER on videos only via `teacherAllowed: true`). `settings/page.tsx` and
  `settings/[tab]/page.tsx` exist purely to forward links written before the
  move — `Notification.url` rows carry both `/settings?tab=x` and
  `/settings/x`. Validate against `LUMOS_SURFACES` when adding a surface, or
  the legacy redirect will drop it to the dashboard.
- **The section chrome lives in the `(app)` route group, not `lumos/layout.tsx`.**
  `StreamSectionNav` (`components/stream/nav.tsx`) is rendered by
  `lumos/(app)/layout.tsx`; the group adds chrome without a URL segment. `/lumos` and
  `/lumos/courses` deliberately have none — the landing page owns its hero and
  the catalog is entered from it. Adding the nav to `lumos/layout.tsx` would
  put a page heading on top of that hero again.
- **Contributor copy says "upload"; reviewer copy says "review".** The catalog
  approval step is real, but the person uploading never sees proposal
  mechanics: the button is "Upload Video", the success toast is "Video
  uploaded. It'll appear on the lesson shortly.", and `approvalStatus` renders
  as **Live / Publishing / Needs changes** (not Approved / Pending / Rejected).
  The reviewer-facing surfaces — the Review queue, the admin notification
  ("New video pending review"), `approveVideo.*` — deliberately keep the
  literal review language, because that audience is the review step. Don't
  "fix" the asymmetry in either direction, and when adding a contributor-facing
  string, describe what the user gets, not what the system is waiting on.
  Rejection feedback still surfaces in full (labelled "What to fix") — hiding
  the mechanics must never hide actionable feedback.
- **Video-player hooks run ~4Hz during playback** (every `timeupdate`). Any
  effect/listener whose deps include `currentTime`/`duration` will churn — use
  the ref-mirror pattern (`currentTimeRef`/`durationRef`) and keep `actions`
  referentially stable (it's `useMemo`'d in `use-video-player.ts`).
- **`revalidatePath` in stream uses the internal file-system path**
  `/[lang]/s/[subdomain]/lumos/...` (with `/s/`), NOT a clean URL — the one
  place `/s/` is correct.

## Related Blocks

- **catalog** (`src/components/catalog/`) — owns `Subject`/`Chapter`/`Lesson`/
  `SubjectSelection`/`ContentOverride`/`InstructorPreference`. Stream reads them;
  `setInstructorPreference` lives there.
- **translation** (`src/components/translation/`) — `localize`/`getLabels`/
  `getText` power on-demand course/lesson translation in the data fetchers.
- **catalog video-manager** (`saas-dashboard/catalog/`) consumes
  `stream/video/video-input.tsx`.

## After You Finish

1. Update `ISSUE.md` — check completed items, add new issues found
2. Update `README.md` — if routes, files, or completion% changed; bump frontmatter `completion` and `last_audited`
3. Run `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. If you touched DB: write a migration test before merging
