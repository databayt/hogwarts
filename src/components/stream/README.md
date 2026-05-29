## Stream — Learning Management System (LMS)

### Overview

Full-featured LMS module for the Hogwarts platform supporting catalog-based course enrollment (free and Stripe-paid), video lessons with instructor preferences, progress tracking, certificates, analytics, parent views, and email notifications. Built with the mirror pattern linking routes under `(school-dashboard)/stream/` to components here.

The stream block uses a catalog-based architecture where courses map to subjects from the school catalog. Schools configure instructor preferences (platform, school, or teacher content) per subject.

### Capabilities by Role

- **DEVELOPER / ADMIN**: Full access -- manage settings, enrollments, instructor preferences, video review queue
- **TEACHER**: Upload videos, propose content for lessons, manage own videos
- **STUDENT**: Browse courses, enroll, watch lessons, track progress, earn certificates
- **GUARDIAN**: View child's enrollment progress and certificates
- **STAFF / ACCOUNTANT**: Read-only access

### Routes

| Route                                                      | Page                     | Status |
| ---------------------------------------------------------- | ------------------------ | ------ |
| `/{lang}/s/{subdomain}/stream`                             | Home / landing page      | Ready  |
| `/{lang}/s/{subdomain}/stream/courses`                     | Course catalog           | Ready  |
| `/{lang}/s/{subdomain}/stream/courses/[slug]`              | Course detail            | Ready  |
| `/{lang}/s/{subdomain}/stream/courses/[slug]/[lessonId]`   | Lesson viewer            | Ready  |
| `/{lang}/s/{subdomain}/stream/dashboard`                   | Student enrolled courses | Ready  |
| `/{lang}/s/{subdomain}/stream/dashboard/[slug]`            | Course progress          | Ready  |
| `/{lang}/s/{subdomain}/stream/dashboard/[slug]/[lessonId]` | Lesson player            | Ready  |
| `/{lang}/s/{subdomain}/stream/settings`                    | Admin settings (4 tabs)  | Ready  |
| `/{lang}/s/{subdomain}/stream/teach/videos`                | Teacher video management | Ready  |
| `/{lang}/s/{subdomain}/stream/payment/success`             | Stripe payment success   | Ready  |
| `/{lang}/s/{subdomain}/stream/payment/cancel`              | Stripe payment cancel    | Ready  |

### File Structure

```
src/components/stream/
├── types.ts                        # StreamDictionary, StreamContentProps, CatalogCourseType
├── authorization.ts                # RBAC (DEVELOPER > ADMIN > TEACHER > STUDENT)
├── list-params.ts                  # URL state utilities
├── header.tsx                      # Stream navigation header
├── loading.tsx                     # Loading skeletons
├── search-bar.tsx                  # Debounced search bar (live)
├── lib/quota.ts                    # Per-school video storage quota (wired on upload/delete)
├── home/
│   ├── content.tsx                 # Landing page orchestrator
│   ├── teaching-hero-section.tsx   # Hero banner
│   ├── reasons-section.tsx         # Why learn here
│   ├── ai-fluency-section.tsx      # AI fluency section
│   ├── how-to-begin-section.tsx    # Getting started section
│   ├── skills-section.tsx          # Skills showcase
│   ├── hot-releases-section.tsx    # Featured courses
│   ├── curriculum-section.tsx      # Curriculum overview
│   ├── continue-watching-section.tsx # Resume watching
│   └── education-animation.tsx     # Animated education graphic
├── courses/
│   ├── content.tsx                 # Course catalog list
│   ├── course-card.tsx             # Course card component
│   ├── [slug]/
│   │   ├── content.tsx             # Course detail page
│   │   └── course-progress-bar.tsx # Progress indicator
│   └── enrollment/
│       ├── actions.ts              # Stripe enrollment actions
│       ├── button.tsx              # Enrollment button
│       ├── catalog-actions.ts      # Catalog-based enrollment
│       └── catalog-enrollment-button.tsx
├── dashboard/
│   ├── content.tsx                 # Student dashboard main
│   ├── certificate-card.tsx        # Certificate view/download/share
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
│   ├── instructor-settings.tsx     # Instructor preference per subject (platform/school/teacher)
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
│   └── get-proposable-lessons.ts   # Fetch lessons available for video submission
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
│   ├── rich-text-editor.tsx        # Tiptap WYSIWYG editor
│   ├── sortable-list.tsx           # DND Kit drag-and-drop
│   ├── file-upload.tsx             # File upload with progress
│   ├── slug-utils.ts              # Auto-slug generation
│   ├── duration-utils.ts          # Duration formatting (i18n)
│   ├── url-validators.ts          # URL validation (video, image, document)
│   ├── email-service.ts           # Resend email integration
│   └── video-player/              # Enterprise video player (2,000+ lines)
│       ├── video-player.tsx        # Main player component
│       ├── video-controls.tsx      # Playback controls
│       ├── video-progress-bar.tsx  # Seek bar
│       ├── video-overlay.tsx       # Loading/pause overlay
│       ├── video-up-next.tsx       # Auto-play next lesson
│       ├── video-watermark.tsx     # DRM watermark overlay
│       └── hooks/                  # Player hooks (progress save, auto-hide, media session)
├── data/catalog/                   # Data fetchers with React cache()
│   ├── get-all-courses.ts          # Fetch all published courses
│   ├── get-course.ts               # Single course by slug
│   ├── get-course-progress.ts      # Course completion percentage
│   ├── get-course-sidebar-data.ts  # Sidebar navigation data
│   ├── get-lesson-content.ts       # Lesson content + attachments
│   ├── get-lesson-with-progress.ts # Lesson + user progress
│   ├── get-continue-watching.ts    # Resume watching list
│   ├── get-certificates.ts         # User certificates
│   ├── get-dashboard-data.ts       # Dashboard aggregate data
│   ├── check-enrollment.ts         # Enrollment status check
│   ├── admin-get-course.ts         # Admin course detail
│   └── admin-get-lesson.ts         # Admin lesson detail
├── not-admin/
│   └── content.tsx                 # Access denied fallback
└── __tests__/                      # utility + action + data-fetcher tests
```

> Tests: ~280 stream unit tests + the Stripe webhook suite (incl. the
> `video_purchase` branch). The legacy `StreamCourse`-based query layer and its
> tests were removed in the 2026-05-29 cleanup.

### Status

**Catalog runtime path: production-hardened (2026-05-29).** P0 paywall + payment
webhook, the P1 integrity cluster, critical-path tests, the lesson hot-path perf
work, and P2 video hardening are done and tested (see `ISSUES.md` →
"Production-Readiness Pass"). Deferred: a Float→Decimal money-type migration +
two composite indexes (schema), and the server-action / teacher-dashboard /
search-bar i18n consumption layer. Do **not** assume "100%" — check `ISSUES.md`.

### Data Architecture

The stream block uses a **catalog-based architecture**. Legacy `stream.prisma` models (prefixed `stream_`) are deprecated. Active models:

- `Enrollment` (from `enrollment.prisma`) -- user enrolls in a Subject, with Stripe payment fields
- `LessonProgress` (from `enrollment.prisma`) -- tracks video completion (watchedSeconds, totalSeconds, watchCount)
- `Video` (from `video.prisma`) -- user-contributed lesson videos with approval workflow (PENDING/APPROVED/REJECTED)
- `InstructorPreference` -- per-subject source preference (platform/school/teacher)

### Integration Points

- **Routes**: `src/app/[lang]/s/[subdomain]/(school-dashboard)/stream/`
- **Stripe**: Checkout in `enrollment/actions.ts`, webhook at `api/webhook/stripe/route.ts`
- **Email**: Resend integration via `shared/email-service.ts`
- **Storage**: AWS S3/Tigris for video/image, CloudFront CDN for delivery
- **Rate Limiting**: Arcjet for API protection
- **Prisma Models**: `prisma/models/enrollment.prisma`, `prisma/models/video.prisma`
- **Dictionary**: `src/components/internationalization/stream-{en,ar}.json`
