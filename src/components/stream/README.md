# Stream (LMS) Module

**Version:** 2.2.0
**Last Updated:** January 2026
**Status:** 100% Production-Ready
**Total Lines:** 12,500+ TypeScript/TSX

---

## Quick Status

| Category                 | Status      | Notes                                |
| ------------------------ | ----------- | ------------------------------------ |
| **Core CRUD**            | ✅ Complete | Course/Chapter/Lesson management     |
| **Enrollment**           | ✅ Complete | Stripe + free course support         |
| **Video Player**         | ✅ Complete | Enterprise-grade, 2,052 lines        |
| **Progress Tracking**    | ✅ Complete | Per-lesson completion + resume       |
| **Rich Text Editor**     | ✅ Complete | Tiptap integration                   |
| **Drag-and-Drop**        | ✅ Complete | Sortable list component              |
| **Auto-Slug**            | ✅ Complete | Slug utilities + validation          |
| **File Upload**          | ✅ Complete | Progress tracking included           |
| **Email Notifications**  | ✅ Complete | Enrollment + completion emails wired |
| **Certificates**         | ✅ Complete | Auto-generation + viewer/download    |
| **Analytics Charts**     | ✅ Complete | Line + bar charts with Recharts      |
| **Search**               | ✅ Complete | Client-side filtering with debounce  |
| **Duration Aggregation** | ✅ Complete | Total duration utilities             |
| **URL Validation**       | ✅ Complete | Video/image/document validation      |
| **Loading States**       | ✅ Complete | Spinners + skeletons throughout      |
| **Dictionary Types**     | ✅ Complete | Full StreamDictionary interface      |
| **Test Coverage**        | ✅ 72 tests | Utility functions fully tested       |

---

## Architecture

### Mirror-Pattern Design

```
app/[lang]/s/[subdomain]/(platform)/stream/    ←→    components/stream/
│
├── (public)/                                  ←→    home/, courses/
│   ├── page.tsx                               ←→    home/content.tsx
│   └── courses/
│       ├── page.tsx                           ←→    courses/content.tsx
│       └── [slug]/page.tsx                    ←→    courses/[slug]/content.tsx
│
├── dashboard/                                 ←→    dashboard/
│   ├── page.tsx                               ←→    dashboard/content.tsx
│   └── [slug]/[lessonId]/page.tsx             ←→    dashboard/lesson/content.tsx
│
└── admin/                                     ←→    admin/
    ├── page.tsx                               ←→    admin/content.tsx
    └── courses/                               ←→    admin/courses/
        ├── create/page.tsx                    ←→    admin/courses/create/form.tsx
        ├── [courseId]/edit/page.tsx           ←→    admin/courses/edit/form.tsx
        └── [courseId]/delete/page.tsx         ←→    admin/courses/delete/form.tsx
```

### Component Structure

```
src/components/stream/
├── admin/                    # Admin panel components
│   ├── analytics/            # Charts and statistics
│   ├── courses/              # Course management
│   │   ├── create/           # Create course form
│   │   ├── edit/             # Edit course form + structure
│   │   └── delete/           # Delete confirmation
│   └── content.tsx           # Admin dashboard
│
├── courses/                  # Public course browsing
│   ├── [slug]/               # Course detail page
│   ├── enrollment/           # Enrollment actions + button
│   └── content.tsx           # Course catalog
│
├── dashboard/                # Student dashboard
│   ├── lesson/               # Lesson viewer with video player
│   ├── certificate-card.tsx  # Certificate viewer + download
│   └── content.tsx           # Enrolled courses
│
├── shared/                   # Reusable components
│   ├── video-player/         # Enterprise player (2,052 lines)
│   ├── rich-text-editor.tsx  # Tiptap editor
│   ├── sortable-list.tsx     # Drag-and-drop
│   ├── file-upload.tsx       # File uploader with progress
│   ├── slug-utils.ts         # Auto-slug generation
│   ├── duration-utils.ts     # Duration formatting
│   ├── url-validators.ts     # URL validation
│   └── email-service.ts      # Email sending (wired)
│
├── emails/                   # Email templates (triggered)
│   ├── enrollment-email.tsx  # Enrollment confirmation
│   └── completion-email.tsx  # Course completion
│
├── data/                     # Data fetchers with React cache()
│   ├── course/               # Course queries + certificates
│   └── admin/                # Admin queries
│
├── __tests__/                # Test files (72 tests)
│   ├── duration-utils.test.ts
│   ├── url-validators.test.ts
│   ├── slug-utils.test.ts
│   └── types.test.ts
│
├── home/                     # Landing page sections
├── types.ts                  # Type definitions (StreamDictionary)
└── README.md                 # This file
```

---

## Key Components

### Video Player (Enterprise-Grade)

**Location:** `shared/video-player/`
**Lines:** 2,052
**Status:** ✅ Production-Ready

Features:

- ✅ Play/pause with click and spacebar
- ✅ Volume control with mute toggle
- ✅ Fullscreen support
- ✅ Progress bar with seek
- ✅ Playback speed (0.5x - 2x)
- ✅ Keyboard shortcuts
- ✅ Auto-hide controls
- ✅ Thumbnail seek preview
- ✅ Up-next overlay
- ✅ Mobile responsive
- ✅ Resume from last position

### Email Service (Fully Wired)

**Location:** `shared/email-service.ts`
**Status:** ✅ Triggered from enrollment and completion actions

Emails sent:

- `sendEnrollmentEmail()` - After successful enrollment (free or paid)
- `sendCompletionEmail()` - After all lessons completed + certificate issued

### Certificate System

**Location:** `dashboard/certificate-card.tsx` + `data/course/get-certificates.ts`
**Status:** ✅ Complete

Features:

- ✅ Auto-generated on course completion
- ✅ Unique certificate number
- ✅ View certificate in modal
- ✅ Download as PNG
- ✅ Share via Web Share API

### Analytics Dashboard

**Location:** `admin/analytics/`
**Status:** ✅ Complete with charts

Charts implemented:

- ✅ Line chart: Enrollment trend (7 days)
- ✅ Bar chart: Revenue by month (6 months)
- ✅ Top 5 courses list with revenue
- ✅ 4 stat cards with icons

### Shared Utilities

| File                   | Purpose                         | Tests |
| ---------------------- | ------------------------------- | ----- |
| `duration-utils.ts`    | Duration calculation/formatting | 20    |
| `url-validators.ts`    | Video/image/doc URL validation  | 27    |
| `slug-utils.ts`        | Auto-slug generation            | 16    |
| `rich-text-editor.tsx` | Tiptap WYSIWYG editor           | -     |
| `sortable-list.tsx`    | Drag-and-drop reordering        | -     |
| `file-upload.tsx`      | S3 presigned URL uploads        | -     |

---

## Database Schema

All models include `schoolId` for multi-tenant support.

### Core Models

| Model                  | Purpose                 | Key Fields                                    |
| ---------------------- | ----------------------- | --------------------------------------------- |
| `StreamCourse`         | Course container        | title, slug, price, isPublished               |
| `StreamCategory`       | Course categories       | name (unique per school)                      |
| `StreamChapter`        | Course sections         | title, position, isFree                       |
| `StreamLesson`         | Individual lessons      | title, videoUrl, duration                     |
| `StreamAttachment`     | Lesson materials        | name, url                                     |
| `StreamEnrollment`     | Student enrollments     | userId, courseId, isActive                    |
| `StreamLessonProgress` | Completion tracking     | userId, lessonId, isCompleted, watchedSeconds |
| `StreamCertificate`    | Completion certificates | certificateNumber, completedAt                |

### Multi-Tenant Keys

```prisma
@@unique([slug, schoolId])      // Unique slug per school
@@unique([name, schoolId])      // Unique category per school
@@unique([userId, courseId, schoolId])  // One enrollment per user/course/school
```

---

## Integration Points

### Authentication

```typescript
const session = await auth()
const schoolId = session?.user?.schoolId

// Role-based access
if (user.role === "ADMIN" || user.role === "TEACHER") {
  // Admin access to course management
}
```

### Multi-Tenant Queries

```typescript
// ALWAYS include schoolId
const courses = await db.streamCourse.findMany({
  where: { schoolId, isPublished: true },
})
```

### Stripe Integration

- Checkout session creation in `enrollment/actions.ts`
- Webhook handling at `app/api/webhook/stripe/route.ts`
- Free courses auto-enroll without payment

### Email Integration

```typescript
// Enrollment email (fired after payment verification)
await sendEnrollmentEmail({
  to: user.email,
  studentName: user.name,
  courseTitle: course.title,
  courseUrl: `${baseUrl}/stream/dashboard/${course.slug}`,
  schoolName: school.name,
})

// Completion email (fired after certificate generation)
await sendCompletionEmail({
  to: user.email,
  studentName: user.name,
  courseTitle: course.title,
  certificateUrl: `${baseUrl}/stream/dashboard/${course.slug}/certificate`,
  schoolName: school.name,
  completionDate: new Date().toLocaleDateString(),
})
```

---

## Testing

### Current Coverage

| Category   | Tests  | Status |
| ---------- | ------ | ------ |
| Duration   | 20     | ✅     |
| URL Valid  | 27     | ✅     |
| Slug Utils | 16     | ✅     |
| Types      | 9      | ✅     |
| **Total**  | **72** | ✅     |

### Run Tests

```bash
pnpm test src/components/stream/__tests__/ --run
```

---

## Development

### Common Tasks

```bash
# Add new course category
# 1. Create via admin panel
# 2. Or seed via prisma/seed-stream.ts

# Test Stripe integration
# Use test card: 4242 4242 4242 4242

# Check multi-tenant isolation
# Access same course URL from different subdomains
```

---

## See Also

- [ISSUES.md](./ISSUES.md) - All issues resolved
- [Prisma Schema](../../../prisma/models/stream.prisma) - Database models
- [Stripe Webhook](../../../app/api/webhook/stripe/route.ts) - Payment handling

---

**Built for Hogwarts Multi-Tenant School Management Platform**
