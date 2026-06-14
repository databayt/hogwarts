# Stream (LMS) Module - Issues & Roadmap

**Last Updated:** 2026-05-29
**Status:** Production-hardening pass complete for P0/P1 + critical tests + perf + P2 video hardening. Some P2/schema/i18n items deferred (see "Production-Readiness Pass" below).

> Earlier revisions of this file claimed "100% production-ready". A multi-agent
> audit (2026-05-29) did not support that: it found two reproducible P0s (a
> cosmetic PAID-video paywall and an untested payment→unlock webhook branch)
> plus a P1 cluster. Those are now fixed and regression-tested. This file now
> tracks the real remaining state.

---

## Production-Readiness Pass — 2026-05-29

**Fixed + tested this pass (committed on `fix/stream-production-ready`):**

- **P0 — paywall bypass:** `data/catalog/get-lesson-with-progress.ts` emitted an
  unsigned, directly-playable URL for every PAID video. Now: unowned PAID →
  `videoUrl: null`; purchased → signed URL; free → unsigned. (9 regression tests)
- **P0 — untested money path:** the Stripe webhook `video_purchase` branch (the
  only point that flips `VideoPurchase`→SUCCESS) had no test and its model was
  absent from the webhook db mock. Now covered (4 tests).
- **P1 — webhook money-loss:** `video_purchase` + `catalog_enrollment` branches
  ack-then-failed with 200 (money taken, access never granted). Now release the
  dedupe row + return 5xx so Stripe retries.
- **P1 — cross-tenant write:** `settings/enrollments/actions.ts` `bulkEnrollStudents`
  now validates school membership + Zod (drops foreign userIds). (+3 tests)
- **P1 — rate limiting:** wired the `STREAM_*` Upstash buckets onto
  `purchaseVideo`/`enrollInSubject`/`uploadVideo`; throttled `updateLessonProgress`.
- **P1 — lesson-player i18n:** fixed the `.stream.stream` double-nesting so ~45
  player strings render Arabic instead of English fallbacks.
- **P1 — progress save:** repaired the periodic-save interval (was torn down
  ~4×/sec by a `currentTime` dep) + immediate flush on pause/tab-hide.
- **Perf:** parallelized the lesson hot path (~8 serial → ~3 + React `cache()`);
  killed the parent-dashboard N+1; `cache()` on hot catalog fetchers; pagination
  caps on two unbounded list queries.
- **P2 hardening:** server-side video-URL validation, PUBLISHED-lesson check, and
  wired the storage-quota service on upload/delete.
- **Cleanup:** deleted ~1,800 lines of dead legacy code (`queries.ts`,
  legacy `dashboard/lesson/actions.ts`, `explore.tsx`, `search.tsx`, legacy
  enrollment `button.tsx`, `/api/stream/courses/[courseId]`) and 3 stale
  "Marshal LMS" docs.

**Deferred (documented, not yet applied):**

- **Schema (needs coordinated apply — DB shared by concurrent sessions):**
  `Video.price`/`VideoPurchase.amount` Float→`Decimal` (ripples into every
  price/amount read + client serialization — must convert with `Number()` and
  re-test before flipping the column); composite indexes
  `@@index([userId, isCompleted, updatedAt])` on `LessonProgress` and
  `@@index([schoolId, isActive])` on `Enrollment`.
- **i18n (consumption layer) — partially done:** the lesson player (~45 strings,
  Phase 1) and the teacher `teach/videos-content.tsx` dashboard (2026-05-29) are
  now translated. **Still deferred:** ~86 server-action returns use hardcoded
  English `message` strings rendered verbatim in toasts (convert to error/message
  codes + `ErrorHelper` per `.claude/rules/translation.md` — a stream-isolated but
  large all-or-nothing sweep across 8 action files + every toast site, best done
  as its own PR); and `search-bar.tsx` (needs `search`/`explore` subtrees added to
  the ROOT dictionary, not the stream subtree — high collision risk while the
  i18n worktree is active; it degrades to English fallbacks today, not broken).
- **`setInstructorPreference`** foreign-ID validation (lives in the catalog
  block; an active catalog worktree owns that file).
- **Legacy `enrollInCourseAction`** is now dead (its only caller `button.tsx`
  was deleted) but left in `courses/enrollment/actions.ts` because the live
  `verifyPaymentAndActivateEnrollment` shares the file. Extract the live fn and
  delete the rest when the legacy payment-success path is migrated.
  **(2026-06-14: DONE — both dead functions + their now-unused imports removed.)**

---

## Optimization Pass — 2026-06-14

A 6-dimension multi-agent audit (db-queries, server-actions, react-perf,
bundle, schema-indexes, dead-code) + adversarial verification produced 67
confirmed findings. The high-value, low-risk subset was implemented. tsc clean
(stream), 250/250 stream unit tests green.

**Dead code removed (10 files, ~1,600 lines):**

- `shared/rich-text-editor.tsx` (the **only** `@tiptap` importer in the repo —
  `@tiptap/*` is now removable from `package.json`), `shared/sortable-list.tsx`
  (`@dnd-kit`), `shared/file-upload.tsx`, `dashboard/certificate-card.tsx`
  (canvas), `data/catalog/get-certificates.ts`, `shared/duration-utils.ts`,
  `shared/slug-utils.ts`, `shared/video-player/video-controls.tsx` — all had
  **zero importers** (triple-verified by repo-wide grep). Tests for the two
  deleted utils were removed with them.
- Deleted the dead legacy `enrollInCourseAction` + `checkEnrollmentStatus`
  (~270 lines) from `courses/enrollment/actions.ts` + their now-unused imports.
- Removed the dead duplicate `CatalogCourseType`/`CatalogIndividualCourseType`
  interfaces from `types.ts` (the live types are the inferred return types of
  the data fetchers), an unused `BookOpen` import, the dead `chapters` alias +
  double `mapChapter` in `get-course-sidebar-data.ts`, and a dead
  `isAdmin/isAuthenticated` duplicate JSX branch on the home page.

**Query / waterfall (fewer Neon round-trips):**

- Parallelized independent serial awaits: `get-dashboard-data` (selections ∥
  enrollments), `admin-get-lesson` (videos ∥ attachments), `admin-get-course`
  (subject ∥ overrides), settings `getSubjectsWithInstructors` (videos ∥
  preferences), admin dashboard `getCatalogAdminStats` (folded selections into
  the Promise.all), `verifyPaymentAndActivateEnrollment` (user ∥ school),
  `markLessonComplete` (upsert ∥ lesson list).
- `getTeacherStats`: 3 `count()` → 1 `groupBy` (4 queries → 2).
- `getSchoolEnrollments`: pulled completed-progress rows just to `.length` them
  → filtered `_count` projection (SQL COUNT).
- `markLessonComplete`: removed a redundant duplicate enrollment lookup.
- `get-course-sidebar-data`: narrowed a bare chapter `include` to a `select`
  (drops `@db.Text description` + ~10 unused columns off the wire).
- **Fixed** `bulkEnrollStudents` `revalidatePath` (`/stream/admin/enrollments`
  matched no route → list never refreshed; now the settings route).

**React render perf (video player hot path):**

- `useVideoPlayer` now returns a `useMemo`-stable `actions` object — previously
  a fresh object every render tore down + re-attached the player's event
  listeners ~4×/sec during playback. Same root cause fixed for the
  `beforeunload` handler (now ref-based, deps `[lessonId]`), the media-session
  position effect (throttled to ~1Hz), the watermark timestamp (captured once
  at mount), and the player's `onSaveProgress` adapter (now a `useCallback`).
- `propose-video-dialog` memoized the `lessonsBySubject` grouping;
  `videos-content` builds one `Intl.DateTimeFormat` per render instead of per
  row; `CourseCard` is now `memo()`'d (courses-grid hover no longer re-renders
  all N cards).

**Bundle / code-split (home page):**

- `home/content.tsx` + 5 static sub-sections (`ai-fluency`, `curriculum`,
  `teaching-hero`, `reasons`, `hot-releases`) demoted from `"use client"` to
  Server Components — they had no hooks/handlers, so they no longer ship JS.
- `EducationAnimation` lazy-loads `lottie-react` via `next/dynamic` (defers the
  large lottie-web parse off the home page's initial bundle).

**Schema indexes added (deploy-pending — materialize via `prisma db push`):**

- `LessonProgress @@index([userId, isCompleted, updatedAt])` — Continue Watching.
- `Question @@index([catalogLessonId, approvalStatus, visibility])` — lesson quiz.
- `Enrollment @@index([catalogSubjectId, isActive])` — course-detail enroll count.

**Discovered + FIXED (2026-06-14, follow-up):**

- ✅ **The admin "Review" tab was unwired — now re-wired.** `settings/page.tsx`
  had stopped passing `reviewContent` (a merge regression), so
  `settings/video-review-content.tsx` + `settings/video-review-actions.ts`
  (`getPendingVideos`/`reviewVideo`) had zero importers and the Review tab
  rendered an empty panel — the files were kept, not deleted. Fix: `settings/page.tsx`
  now calls `getPendingVideos()` (admin-gated, folded into the existing
  `Promise.all`) and passes `reviewContent={<VideoReviewContent .../>}` +
  `pendingReviewCount`. The two optimizations that were gated on this being live
  were also applied: `reviewVideo` is now a single tenant-scoped `updateMany`
  (`schoolId` on the write, `count === 0` ⇒ 404) revalidating both the settings
  and stream routes, and `Video @@index([schoolId, approvalStatus])` was added
  (deploy-pending). Tests updated (`findFirst+update` → `updateMany` assertions).

**Deferred (documented, lower value / higher risk):**

- `Video.price`/`VideoPurchase.amount` Float→Decimal (full-table rewrite on a
  shared Neon DB — needs a Neon branch + atomic patch of ~13 read sites).
- `framer-motion`→CSS for the courses-grid hover, and `next/image` for the
  static home thumbnails (the Coursera CDN URLs are already resized/compressed,
  so next/image would double-proxy — `loading="lazy"` is the only real win).

---

## Control-Flow Verification & Fixes — 2026-06-14

A 4-flow end-to-end trace (video request → review → surface; public/private +
free/paid; instructor preference + multi-instructor switching; hiding
lessons/instructors/quizzes) + adversarial verification. All four flows were
"partial". Fixed the high-severity bugs + the missing controls. tsc clean,
259 stream unit tests green (+9 new).

**Security / correctness bugs fixed:**

- 🔴 **PRIVATE-video leak + revoke paywall-bypass** (`get-lesson-with-progress.ts`):
  the lesson video query's bare `{ schoolId }` OR-arm returned _every_ school
  video — including other teachers' PRIVATE videos — to all school members, and
  turned `revokeVideoAccess` → PRIVATE into a free-for-the-school unlock. Fixed:
  `OR: [{ userId: me }, { schoolId, visibility: { in: [SCHOOL,PUBLIC,PAID] } },
{ PUBLIC }, { PAID }]` (PRIVATE is owner-only). Regression test added.
- 🔴 **Instructor switch didn't reload the video**: `<video src>` doesn't reload
  on attribute change, so switching instructors changed nothing. Fixed by keying
  `VideoPlayer` on the active video id (remount with the new source).
- 🟡 **own-school featured mislabel**: a school's own featured video read as
  "featured" (platform) instead of "own-school". Reordered the source check.

**Controls completed (your explicit asks):**

- **Hide a specific instructor's video per school** — the backend (ContentOverride
  `lessonVideoId` + `toggleContentOverride` + `handleToggleVideo` + enforcement)
  existed but the UI never rendered because `subjects/[slug]/page.tsx` never
  fetched/passed `lesson.videos`. Now it fetches the school-visible videos +
  their per-school hidden state and passes them through
  `SchoolCatalogCustomization` → `TopicOverrides`, so the per-video eye-toggle
  renders.
- **Hide a lesson's quiz material per school** — new `ContentOverride.hideQuiz`
  flag (lesson-level, coexists with `isHidden`), `setLessonQuizHidden` action,
  enforcement in `getLessonContent` (returns no questions when hidden), and a
  per-lesson quiz toggle in `TopicOverrides`. `toggleContentOverride` keeps the
  row alive when only `hideQuiz` remains. (DB column is deploy-pending — applies
  via `prisma db push`.)
- **Free/paid control** — added `removeVideoPaywall` (PAID → free audience,
  clears price) + a "Remove paywall" panel in `VideoSettingsDialog` (PAID videos
  previously showed an empty Select with no downgrade path).
- **Request-flow tenant scope** — `getProposableLessons` now scopes to the
  school's selected subjects (a teacher could previously propose for subjects the
  school never offers); DEVELOPER still enumerates the global catalog.

**Verified working (no change needed):** propose-video wizard → `uploadVideo`
(PENDING) → admin review queue → `reviewVideo` (tenant-scoped) → APPROVED
surfaces on the lesson; the PAID paywall (null URL unowned / signed owned);
`purchaseVideo` → Stripe → webhook → SUCCESS unlock; the InstructorSwitcher
(multi-instructor pills + per-video unlock); `setInstructorPreference` default
sort; chapter/lesson hide.

**Deferred (verified, lower value):** teacher email/in-app notification on
review; ProposeVideoDialog "Upload" tab stub; bulk "hide all videos from
instructor X" (preference only re-sorts, doesn't suppress); CloudFront
unsigned-URL fallback when signing keys are unset (purchased self-hosted only);
Stripe refund/dispute handler for `video_purchase`; the redundant instructor
card panel below the switcher.

---

## Historical Issue Summary (P0–P3, pre-2026-05)

| Priority       | Open  | Closed | Total  |
| -------------- | ----- | ------ | ------ |
| 🔴 P0 Critical | 0     | 3      | 3      |
| 🟠 P1 High     | 0     | 10     | 10     |
| 🟡 P2 Medium   | 0     | 7      | 7      |
| 🟢 P3 Low      | 5     | 0      | 5      |
| **Total**      | **5** | **20** | **25** |

> Note: P3 issues are "NOT PLANNED" future features (reviews, forums, quizzes, etc.)
> The closed counts below predate the 2026-05-29 audit and describe the original feature build-out, not the audit findings above.

---

## 🔴 CRITICAL (P0) - All Resolved

### Issue #1: Video Upload Not Implemented

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Implemented in `shared/file-upload.tsx`

### Issue #2: Rich Text Editor Missing

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Implemented in `shared/rich-text-editor.tsx` using Tiptap

### Issue #3: Video Player Has No Controls

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Enterprise-grade player in `shared/video-player/` (2,052 lines)

---

## 🟠 HIGH PRIORITY (P1) - All Resolved

### Issue #4: Email Notifications Not Wired

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:**

- Wired `sendEnrollmentEmail()` in `courses/enrollment/actions.ts`
- Wired `sendCompletionEmail()` in `dashboard/lesson/actions.ts`
- Emails sent after free enrollment, paid enrollment, and course completion

### Issue #5: Course Update Form Incomplete

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:**

- Wired `editCourse()` action in `admin/courses/edit/form.tsx`
- Form now properly updates courses via server action

### Issue #6: Zero Test Coverage

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:**

- Created `__tests__/` directory with 4 test files
- 72 tests passing for utilities (duration, URL validation, slugs, types)
- Run with: `pnpm test src/components/stream/__tests__/ --run`

### Issue #7: Certificate Viewer/Download Missing

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:**

- Created `dashboard/certificate-card.tsx` with view/download/share
- Created `data/course/get-certificates.ts` for data fetching
- Certificates auto-generated on course completion (already existed)
- Download as PNG with canvas rendering

### Issue #8: Analytics Charts Not Implemented

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Already implemented in `admin/analytics/content.tsx`

- Line chart for enrollment trends (7 days)
- Bar chart for revenue by month (6 months)
- Top 5 courses list with revenue
- 4 stat cards with icons

### Issue #9: No Drag-and-Drop Reordering

**Status:** ✅ CLOSED
**Resolution:** Implemented in `shared/sortable-list.tsx`

### Issue #10: Missing Auto-Slug Generation

**Status:** ✅ CLOSED
**Resolution:** Implemented in `shared/slug-utils.ts`

### Issue #11: No Course Level Field

**Status:** ✅ CLOSED
**Resolution:** Schema updated with level enum

### Issue #12: No Course Status Workflow

**Status:** ✅ CLOSED
**Resolution:** Using `isPublished` boolean (simplified, works for MVP)

### Issue #13: Missing Enrollment Status Workflow

**Status:** ✅ CLOSED
**Resolution:** Using `isActive` boolean (simplified, works for MVP)

---

## 🟡 MEDIUM PRIORITY (P2) - All Resolved

### Issue #14: Dictionary Type is `any`

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:**

- Created comprehensive `StreamDictionary` interface in `types.ts`
- 200+ typed dictionary keys for full i18n support
- `StreamContentProps` now uses typed dictionary

### Issue #15: Search Not Connected to Backend

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Already implemented correctly

- Search routes via URL params (`?search=...`)
- Client-side filtering in `courses/content.tsx`
- Debounced search input in `search-bar.tsx`

### Issue #16: Course Duration Not Aggregated

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:**

- Created `shared/duration-utils.ts` with:
  - `calculateTotalDuration()` - Sum lesson durations
  - `formatDuration()` - Human-readable format (e.g., "2h 30m")
  - `formatVideoDuration()` - Video context format
  - `formatSeconds()` - MM:SS or HH:MM:SS format
- Full i18n support (English + Arabic)

### Issue #17: No Upload Progress Tracking

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Already implemented in file upload system

- `file/upload/upload-progress.tsx` for individual progress
- `file/upload/aggregate-progress.tsx` for multi-file progress

### Issue #18: No Progress Saving (Resume Playback)

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Already implemented

- `updateLessonProgress()` saves `watchedSeconds` and `totalSeconds`
- `initialPosition` passed to VideoPlayer from `lesson.progress?.watchedSeconds`
- Progress saved every 10 seconds via debounced callback

### Issue #19: No File Type Validation

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:**

- Created `shared/url-validators.ts` with:
  - `isValidVideoUrl()` - MP4, WebM, YouTube, Vimeo, etc.
  - `isValidImageUrl()` - JPG, PNG, WebP, SVG, etc.
  - `isValidDocumentUrl()` - PDF, DOC, DOCX, PPT, etc.
  - `validateMediaUrl()` - Type-specific validation
  - `getVideoEmbedUrl()` - Convert to embed URLs

### Issue #20: Missing Loading States

**Status:** ✅ CLOSED
**Closed:** January 2026
**Resolution:** Already implemented across 11 components

- Enrollment button: Loader2 spinner
- Course cards: Skeleton loaders
- Analytics: Skeleton placeholders
- Forms: isPending states with disabled buttons
- Video player: Loading overlays

---

## 🟢 LOW PRIORITY (P3) - Not Planned

These are future features, not production blockers.

### Issue #21: Course Reviews & Ratings

**Status:** 🟢 NOT PLANNED
**Priority:** P3
**Effort:** 20-30 hours

**Future Consideration:**

- 5-star rating system
- Text reviews
- Review moderation
- Average rating display

### Issue #22: Discussion Forums

**Status:** 🟢 NOT PLANNED
**Priority:** P3
**Effort:** 40+ hours

**Future Consideration:**

- Per-course discussion boards
- Threaded comments
- Instructor responses
- Q&A format

### Issue #23: Quizzes & Assessments

**Status:** 🟢 NOT PLANNED
**Priority:** P3
**Effort:** 80+ hours

**Future Consideration:**

- Multiple choice quizzes
- Pass/fail thresholds
- Retake limits
- Grade tracking

### Issue #24: Refund Management

**Status:** 🟢 NOT PLANNED
**Priority:** P3
**Effort:** 12-16 hours

**Future Consideration:**

- Admin refund UI
- Automatic enrollment cancellation
- Partial refunds
- Refund reason tracking

### Issue #25: Confetti Celebrations

**Status:** 🟢 NOT PLANNED
**Priority:** P3
**Effort:** 2-3 hours

**Future Consideration:**

- Confetti on course completion
- Confetti on certificate download
- Animation on lesson completion

---

## 🐛 Known Bugs - All Fixed

| Bug                                    | Status   | Fixed            |
| -------------------------------------- | -------- | ---------------- |
| Enrollment Redirect URL Issues         | ✅ FIXED | Commit `25bec20` |
| Navigation Links Include /s/subdomain/ | ✅ FIXED | January 2026     |
| Admin Functions Missing schoolId       | ✅ FIXED | January 2026     |
| Seed Script Duplicate Errors           | ✅ FIXED | Commit `0790c53` |

---

## 📈 Technical Debt - Resolved

| Debt                        | Status   | Resolution                          |
| --------------------------- | -------- | ----------------------------------- |
| No Unit Tests               | ✅ FIXED | 72 tests in `__tests__/`            |
| Dictionary Types are `any`  | ✅ FIXED | Full `StreamDictionary` interface   |
| Inconsistent Error Handling | ✅ OK    | Using `{ status, message }` pattern |
| No Error Boundaries         | ✅ OK    | Platform-level boundaries exist     |

---

## 🎉 Production Readiness Checklist

- [x] Core CRUD operations working
- [x] Stripe payment integration
- [x] Email notifications wired
- [x] Certificate generation and viewing
- [x] Analytics with charts
- [x] Search functionality
- [x] Video player with all controls
- [x] Progress tracking with resume
- [x] File upload with progress
- [x] Loading states throughout
- [x] Multi-tenant isolation
- [x] Type-safe dictionary
- [x] Test coverage for utilities
- [x] No P0/P1/P2 issues remaining
- [x] Catalog-based architecture migration (replaces legacy stream\_ tables)
- [x] Instructor preference system (platform/school/teacher sources)
- [x] Teacher video proposal and admin review workflow
- [x] Parent view of child progress

---

## 📝 Contributing

### For Future Features (P3)

1. Create a new branch
2. Implement feature
3. Add tests
4. Update this file
5. Submit PR

### Adding Tests

```bash
# Add tests file
src/components/stream/__tests__/[name].tests.ts

# Run tests
pnpm tests src/components/stream/__tests__/ --run
```

---

**Last Updated:** January 2026
**Maintainers:** Hogwarts Development Team
