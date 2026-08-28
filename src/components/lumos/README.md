---
epic: 05
sprint: Q3-2026
title: Lumos (LMS)
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 93
tracker: https://github.com/databayt/hogwarts/issues/323
docs: https://ed.databayt.org/en/docs/lms
last_audited: 2026-08-15
---

## Lumos — Learning Management System (LMS)

### Overview

Full-featured LMS module for the Hogwarts platform supporting catalog-based course enrollment (free and Stripe-paid), video lessons with instructor preferences, progress tracking, certificates, analytics, parent views, and email notifications. Built with the mirror pattern linking routes under `(school-dashboard)/lumos/` to components here.

The lumos block uses a catalog-based architecture where courses map to subjects from the school catalog. Schools configure instructor preferences (platform, school, or teacher content) per subject.

### Capabilities by Role

- **DEVELOPER / ADMIN**: Full access -- manage settings, enrollments, instructor preferences, video review queue
- **TEACHER**: Upload videos, propose content for lessons, manage own videos
- **STUDENT**: Browse courses, enroll, watch lessons, track progress, earn certificates
- **GUARDIAN**: View child's enrollment progress and certificates
- **STAFF / ACCOUNTANT**: Read-only access

### Routes

| Route                                                      | Page                                                                                   | Status |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------ |
| `/{lang}/s/{subdomain}/lumos`                              | Home / landing page (no nav chrome)                                                    | Ready  |
| `/{lang}/s/{subdomain}/lumos/courses`                      | Course catalog                                                                         | Ready  |
| `/{lang}/s/{subdomain}/lumos/courses/[slug]`               | Course detail                                                                          | Ready  |
| `/{lang}/s/{subdomain}/lumos/courses/[slug]/[lessonId]`    | Lesson viewer                                                                          | Ready  |
| `/{lang}/s/{subdomain}/lumos/dashboard`                    | Role dashboard (admin stats / teach overview / children's progress / enrolled courses) | Ready  |
| `/{lang}/s/{subdomain}/lumos/dashboard/[slug]`             | Course progress                                                                        | Ready  |
| `/{lang}/s/{subdomain}/lumos/dashboard/[slug]/[lessonId]`  | Lesson player                                                                          | Ready  |
| `/{lang}/s/{subdomain}/lumos/enrollments`                  | Enrollments (ADMIN)                                                                    | Ready  |
| `/{lang}/s/{subdomain}/lumos/instructors`                  | Instructor roster — allow/disable, default, lock (ADMIN)                               | Ready  |
| `/{lang}/s/{subdomain}/lumos/review`                       | Video review queue (ADMIN)                                                             | Ready  |
| `/{lang}/s/{subdomain}/lumos/videos`                       | Video library (ADMIN + TEACHER)                                                        | Ready  |
| `/{lang}/s/{subdomain}/lumos/settings`, `…/settings/[tab]` | Legacy → redirect to the routes above                                                  | Ready  |
| `/{lang}/s/{subdomain}/lumos/teach/videos`                 | Redirects to `/lumos/videos`                                                           | Ready  |
| `/{lang}/s/{subdomain}/lumos/payment/success`              | Stripe payment success                                                                 | Ready  |
| `/{lang}/s/{subdomain}/lumos/payment/cancel`               | Stripe payment cancel                                                                  | Ready  |

### Navigation

The block is branded **Lumos** in the UI and served from `/lumos`. The section
heading + tab strip (`components/lumos/nav.tsx` → `PageHeadingSetter` +
`PageNav`) is rendered by the `lumos/(app)/` route-group layout — a group, so
the five managed surfaces sit at `/lumos/<name>` with no extra URL segment. The
`/lumos` landing page and `/lumos/courses` sit outside the group: the landing
page keeps its own hero, and the catalog is reached from its primary button. Tabs come from `getTabsForRole` in
`components/lumos/permissions.ts`:

| Role             | Tabs                                                    |
| ---------------- | ------------------------------------------------------- |
| ADMIN, DEVELOPER | Dashboard · Enrollments · Instructors · Review · Videos |
| TEACHER          | Dashboard · Videos                                      |
| everyone else    | none (no strip rendered)                                |

`/lumos/videos` uses the house listing chrome — `PlatformToolbar` +
`DataTable` (`teach/videos-columns.tsx`), same as `/students`: search, faceted
Status/Visibility filters, column-visibility toggle, sortable headers, and the
Propose-a-Video action in `additionalActions`. Filtering and sorting are
client-side (`enableClientFiltering`/`enableClientSorting`) because
`getMyVideos()` already returns the full set; the view toggle is hidden — there
is no grid card design for videos.

There is no second, inner tab
strip and no `/settings` segment: the old `settings?tab=` surfaces are
top-level routes. `/lumos/settings` and `/lumos/settings/[tab]` survive only as
redirects for links written before the move.

### File Structure

```
src/components/lumos/
├── types.ts                        # LumosDictionary, LumosContentProps, CatalogCourseType
├── authorization.ts                # RBAC (DEVELOPER > ADMIN > TEACHER > STUDENT)
├── list-params.ts                  # URL state utilities
├── header.tsx                      # Lumos navigation header
├── loading.tsx                     # Loading skeletons
├── search-bar.tsx                  # Search bar: typeahead (debounced, cached,
│                                   # abortable) + Explore shelf of real course
│                                   # thumbnails, both off /api/lumos/course-search
├── lib/
│   ├── course-search-client.ts     # fetchCatalogCourses — the browser's ONLY
│                                   # course read (typeahead, Explore, See More)
│   ├── quota.ts                    # Per-school video storage quota (wired on upload/delete)
│   ├── instructor-policy.ts        # THE school instructor policy — key vocabulary,
│                                   # block filter, lock (soft fallback) and ordering,
│                                   # shared by the lesson fetcher, the mobile lane
│                                   # and the admin roster so they cannot drift
│   └── lesson-quiz.ts              # THE lesson-quiz question set — gates, order,
│                                   # cap and grading, shared by the fetcher and
│                                   # the submit action so they cannot drift
├── home/
│   ├── content.tsx                 # Landing page orchestrator
│   ├── teaching-hero-section.tsx   # Hero banner
│   ├── reasons-section.tsx         # "So many reasons to start" — the three
│   │                               # reasons under the teaching hero (dropped
│   │                               # 2026-07-19, restored 2026-08-15)
│   ├── how-to-begin-section.tsx    # Getting started section
│   ├── hot-releases-section.tsx    # Featured courses
│   ├── curriculum-section.tsx      # Curriculum overview
│   ├── continue-watching-section.tsx # Resume watching
│   └── education-animation.tsx     # Animated education graphic
├── courses/
│   ├── content.tsx                 # Course catalog list
│   ├── course-card.tsx             # Course card component
│   ├── [slug]/
│   │   ├── content.tsx             # Course detail page
│   │   ├── course-progress-bar.tsx # Progress indicator (+ certificate link at 100%)
│   │   └── certificate/
│   │       ├── content.tsx         # Certificate of completion (print-ready)
│   │       └── print-button.tsx    # window.print() — browser handles Save as PDF
│   └── enrollment/
│       ├── actions.ts              # Stripe enrollment actions
│       ├── button.tsx              # Enrollment button
│       ├── catalog-actions.ts      # Catalog-based enrollment
│       └── catalog-enrollment-button.tsx
├── dashboard/
│   ├── content.tsx                 # Student dashboard main
│   ├── lesson/
│   │   ├── content.tsx             # Lesson viewer
│   │   ├── actions.ts              # Lesson progress actions
│   │   └── catalog-actions.ts      # Catalog-based lesson actions
│   └── parent/
│       ├── content.tsx             # Parent view of child progress
│       └── actions.ts              # Parent-specific queries
├── settings/
│   ├── content.tsx                 # Settings tab layout (overview, enrollments, instructors, videos)
│   ├── overview.tsx                # Admin dashboard overview
│   ├── queries.ts                  # getInstructorRoster — instructors + coverage + policy
│   ├── instructor-settings.tsx     # Instructor roster: allow/disable, default, lock
│   ├── video-review-actions.ts     # Approve/reject pending videos
│   ├── video-review-content.tsx    # Video review queue UI
│   └── enrollments/
│       ├── actions.ts              # School enrollment queries
│       └── content.tsx             # Enrollments management UI
├── teach/
│   ├── actions.ts                  # Teacher stats + video list queries
│   ├── overview-content.tsx        # Teacher dashboard overview
│   ├── videos-content.tsx          # Teacher video management UI
│   ├── propose-video-dialog.tsx    # Multi-step video proposal wizard
│   ├── video-settings-dialog.tsx   # Video settings/visibility dialog
│   └── get-proposable-lessons.ts   # Grade→subject tree, chapters, lesson search
├── video/
│   ├── video-input.tsx             # Video URL input component
│   ├── video-actions.ts            # Upload video server action
│   └── video-owner-actions.ts      # Owner actions (visibility, delete, replace, revoke)
├── payment/
│   ├── success-content.tsx         # Payment success page
│   └── cancel-content.tsx          # Payment cancel page
├── emails/
│   ├── completion-email.tsx        # Course completion email template
│   └── enrollment-email.tsx        # Enrollment confirmation email template
├── shared/
│   ├── course-carousel.tsx        # CourseCarousel/CourseSlide — shared course strip (RTL-aware embla)
│   ├── url-validators.ts          # URL validation (video, image, document)
│   ├── email-service.ts           # Resend email integration
│   ├── tenant-url.ts              # lumosTenantUrl — tenant-aware absolute URLs (emails, Stripe redirects)
│   └── video-player/              # Enterprise video player (~1,800 lines)
│       ├── video-player.tsx        # Main player component (inline controls)
│       ├── video-progress-bar.tsx  # Seek bar
│       ├── video-overlay.tsx       # Loading/pause overlay
│       ├── video-up-next.tsx       # Auto-play next lesson
│       ├── video-watermark.tsx     # Forensic per-viewer watermark (traceability, not DRM)
│       └── hooks/                  # Player hooks (progress save, auto-hide, media session)
├── data/catalog/                   # Data fetchers with React cache()
│   ├── get-all-courses.ts          # Published courses, paginated + bilingual search
│                                   # (server-only; the browser goes via the API route)
│   ├── get-course.ts               # Single course by slug
│   ├── get-course-progress.ts      # Course completion percentage
│   ├── get-course-sidebar-data.ts  # Sidebar navigation data
│   ├── get-lesson-content.ts       # Lesson content + attachments
│   ├── get-lesson-with-progress.ts # Lesson + user progress
│   ├── get-continue-watching.ts    # Resume watching list
│   ├── get-dashboard-data.ts       # Dashboard aggregate data
│   ├── check-enrollment.ts         # Enrollment status check
│   ├── admin-get-course.ts         # Admin course detail
│   └── admin-get-lesson.ts         # Admin lesson detail
├── not-admin/
│   └── content.tsx                 # Access denied fallback
└── __tests__/                      # utility + action + data-fetcher tests
```

> Tests: ~280 lumos unit tests + the Stripe webhook suite (incl. the
> `video_purchase` branch). The legacy `StreamCourse`-based query layer and its
> tests were removed in the 2026-05-29 cleanup.

### Status

**Catalog runtime path: production-hardened (2026-05-29) + optimized
(2026-06-14) + upload/ownership loop closed (2026-07-11).** P0 paywall +
payment webhook, the P1 integrity cluster, critical-path tests, the lesson
hot-path perf work, and P2 video hardening are done and tested. The 2026-06-14
optimization pass removed ~1,870 lines of dead code, parallelized serial DB
waterfalls, and killed ~4Hz video-player listener churn. The 2026-07-11 pass
wired direct-to-S3 upload into the propose dialog (presign → PUT → storageKey),
gave ADMIN/DEVELOPER an upload entry on the settings Videos tab, fixed the
single-paid-video purchase dead end (hero Unlock pill + purchasable chips),
added a broken-source → story.mp4 fallback (`onSourceError`), gated PUBLIC/PAID
approval to the platform catalog lane (school lane approves SCHOOL/PRIVATE;
owner widening APPROVED→PUBLIC resubmits for review), and added contributor
notifications to the school review lane. A same-day second pass closed every
open P2/P3: reviewer notifications on new submissions, presign quota
pre-check, HeadObject-authoritative quota accounting (new `src/lib/s3.ts`),
abandoned-upload cleanup (guarded `DELETE /api/blob/presign` + dialog hook),
full i18n for the review/manage dialogs, and a de-fabricated, localized
search-bar. **At final review/test** — remaining items are post-release
engineering debt only (Float→Decimal, action error-code migration,
browser-crash orphan sweep, legacy `streamEnrollment` on the payment-success
path); see `ISSUE.md`. QA guide:
[hogwarts#377](https://github.com/databayt/hogwarts/issues/377).

The 2026-08-11 trace + fix round: **governance decision recorded** (schools
are governed by the unified catalog hierarchy — hide/activate + lesson-level
contributions only; the chapter/lesson proposal actions stay deliberately
unwired), tenant-aware absolute URLs via `shared/tenant-url.ts` (emails +
Stripe redirects no longer point at the main host), lesson `Material` rows now
render in the lesson player's Resources section, and the completion/
certificate denominator respects `ContentOverride` hides — all student-facing
progress denominators now agree. See `ISSUE.md` → 2026-08-11 close log.

The 2026-08-16 upload-dialog UX pass: the wizard now **resizes instead of
snapping** — a measured shell springs the dialog's height between steps (and
mid-step, when the price field opens or an upload error appears), with a
directional, RTL-aware fade-slide on every screen change (steps AND the three
panes inside step 1), the header line, and the Next/Submit swap. The finish-up
step was refactored from two stacked radio groups (audience, then pricing) into
**one row of the four real answers** — public/free, public/paid, private/free,
private/paid — with the price field opening underneath only for the two paid
ones; the now-redundant "Switch to Free" link is gone. The success screen plays
the shared `CelebrationAnimation` — the same confetti the school-onboarding
success dialog uses — so both "you made it" surfaces read alike. All motion
collapses to instant swaps under `prefers-reduced-motion`. No new dictionary
keys: the four labels compose from the existing `audience.*` / `pricing.*`
entries — and they are icon-free, one line, one weight (`Public/Free`), since
the two halves of the choice carry equal meaning.

The price control that opens for the two paid choices was rebuilt as a
start-aligned row: field → its own up/down steppers (native spinner suppressed,
whole-unit steps, clamped at zero) → the school's currency in muted, sourced
from `School.currency` through the new `teach/school-currency.ts` and wired at
BOTH call sites (`videos-content` and `overview-content` — the dialog's default
"USD" was reaching a school that prices in SDG). Beside it, a **similar-pricing
chip** seeds the field with what comparable videos already charge:
`getSuggestedPrice(subjectId, currency)` averages only APPROVED, positive-priced
videos in the SAME currency on the SAME course, behind the module's shared
`resolveProposableScope`, served by `GET /api/lumos/suggested-price` (a route
handler, not an action — the bell rule). Subject-scoped with no wider fallback:
a course with no paid videos yet has no comparable, so the chip simply does not
render. 9 tests cover the guards, the currency normalization, the where clause,
the 2dp rounding, and the empty case.

### Data Architecture

The lumos block uses a **catalog-based architecture**. Legacy `stream.prisma` models (prefixed `stream_`) are deprecated. Active models:

- `Enrollment` (from `enrollment.prisma`) -- user enrolls in a Subject, with Stripe payment fields
- `LessonProgress` (from `enrollment.prisma`) -- tracks video completion (watchedSeconds, totalSeconds, watchCount)
- `Video` (from `video.prisma`) -- user-contributed lesson videos with approval workflow (PENDING/APPROVED/REJECTED)
- `InstructorPreference` -- per-subject source preference (platform/school/teacher); still read at playback, no longer edited from the Instructors surface
- `SchoolInstructorPolicy` -- school-wide instructor lock + default (one row per school)
- `InstructorBlock` -- instructors a school has disabled; their videos are served on no surface

Governance precedence, defined once in `lib/instructor-policy.ts`: **blocked
filtered out → lock (falling back where it has no coverage) → per-subject
preference → school default → `[isFeatured, viewCount]`.**

### Integration Points

- **Routes**: `src/app/[lang]/s/[subdomain]/(school-dashboard)/lumos/`
- **Stripe**: Checkout in `enrollment/actions.ts`, webhook at `api/webhook/stripe/route.ts`
- **Email**: Resend integration via `shared/email-service.ts`
- **Storage**: AWS S3/Tigris for video/image, CloudFront CDN for delivery
- **Rate Limiting**: Arcjet for API protection
- **Prisma Models**: `prisma/models/enrollment.prisma`, `prisma/models/video.prisma`
- **Dictionary**: `src/components/internationalization/lumos-{en,ar}.json`

### Agents & Skills

- `agent:nextjs` — App Router + streaming
- `agent:react` — lesson + chapter UI
- `agent:performance` — CDN asset migration + Core Web Vitals
- `skill:/performance` — perf audit
- `skill:/skeleton` — loading-state sweep
