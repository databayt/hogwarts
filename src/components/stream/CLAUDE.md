---
epic: 05
sprint: Q3-2026
title: Stream (LMS)
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/us-curriculum
last_audited: 2026-07-11
---

# Stream (LMS) Block

## Context

Stream (LMS) — Q3 2026 sprint epic 05, maturity `Built+Polish`, ~80% complete. See [README](README.md) for routes + file structure and [ISSUE](ISSUE.md) for the live work list. Tracker: [323](https://github.com/databayt/hogwarts/issues/323).

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
  Upload tab POSTs `/api/blob/presign` (5GB cap, video MIME allowlist), PUTs
  via XHR for progress, then `uploadVideo` persists `fileSize`/`storageKey`/
  `storageProvider` (provider SELF_HOSTED) — storageKey powers CloudFront
  invalidation on delete/revoke/replace and the quota counter. Upload entry
  points: teacher dashboard overview AND the settings Videos tab
  (ADMIN/DEVELOPER/TEACHER, fed by `getProposableLessons()`).
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

## Danger Zones

- **The legacy `streamEnrollment`/`streamCourse` models still exist** and
  `verifyPaymentAndActivateEnrollment` (the live payment-success path) still
  queries them — don't delete those models until that path migrates to
  `Enrollment`. (The dead `enrollInCourseAction`/`checkEnrollmentStatus` were
  removed 2026-06-14.)
- **The admin "Review" tab is wired via a `reviewContent` prop** that
  `settings/page.tsx` builds from `getPendingVideos()` and passes to
  `StreamSettingsContent` (re-wired 2026-06-14 after a merge regression had
  dropped it). If you refactor the settings page, keep that prop wired or the
  Review tab silently renders empty again. `reviewVideo` writes via tenant-scoped
  `updateMany` (schoolId on the write) — don't revert it to `findFirst+update`.
- **Video-player hooks run ~4Hz during playback** (every `timeupdate`). Any
  effect/listener whose deps include `currentTime`/`duration` will churn — use
  the ref-mirror pattern (`currentTimeRef`/`durationRef`) and keep `actions`
  referentially stable (it's `useMemo`'d in `use-video-player.ts`).
- **`revalidatePath` in stream uses the internal file-system path**
  `/[lang]/s/[subdomain]/stream/...` (with `/s/`), NOT a clean URL — the one
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
