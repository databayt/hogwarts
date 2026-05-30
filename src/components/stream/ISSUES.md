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
# Add test file
src/components/stream/__tests__/[name].test.ts

# Run tests
pnpm test src/components/stream/__tests__/ --run
```

---

**Last Updated:** January 2026
**Maintainers:** Hogwarts Development Team
