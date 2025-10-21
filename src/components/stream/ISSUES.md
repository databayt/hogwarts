# Stream (LMS) Module - Issues & Roadmap

**Last Updated:** January 2025
**Version:** 2.0.0
**Reference:** Marshal-LMS (D:\repo\LMS)

---

## 📊 Implementation Status Overview

### Feature Coverage

- **✅ Fully Implemented**: 29 features (51%)
- **⚠️ Partially Implemented**: 14 features (25%)
- **❌ Not Implemented**: 14 features (25%)
- **🏆 Better Than Reference**: 5 features (9%)

### Priority Breakdown

- **🔴 Critical (P0)**: 3 items - Blocking production use
- **🟠 High (P1)**: 8 items - Important for user experience
- **🟡 Medium (P2)**: 10 items - Nice to have
- **🟢 Low (P3)**: 7 items - Future considerations

---

## 🔴 CRITICAL ISSUES (P0)

### 1. Video Upload Not Implemented
**Status:** ❌ Not Implemented
**Impact:** Critical - Cannot add course content
**Blocks:** Course creation, lesson publishing

**Current State:**
- Schema has `videoUrl` fields
- No upload UI exists
- No S3 integration

**Required Implementation:**
```typescript
// 1. API Route: /api/s3/upload
POST /api/s3/upload
Body: { fileName, fileType, schoolId }
Response: { presignedUrl, key }

// 2. FileUploader Component
<FileUploader
  accept="video/mp4,video/webm"
  maxSize={5GB}
  onProgress={(percent) => ...}
  onComplete={(url) => ...}
/>

// 3. Admin Form Integration
<LessonForm>
  <FileUploader
    onComplete={(url) => form.setValue('videoUrl', url)}
  />
</LessonForm>
```

**Dependencies:**
- AWS S3 or Tigris storage setup
- S3 bucket with proper permissions
- CORS configuration
- Environment variables:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_ENDPOINT_URL_S3`
  - `NEXT_PUBLIC_S3_BUCKET_NAME_VIDEOS`

**Files to Create:**
- `app/api/s3/upload/route.ts`
- `app/api/s3/delete/route.ts`
- `components/stream/file-uploader/video-uploader.tsx`
- `components/stream/file-uploader/image-uploader.tsx`
- `lib/s3.ts` (S3 client utilities)

**Estimated Effort:** 16-24 hours
**Priority:** 🔴 P0

---

### 2. Rich Text Editor Missing
**Status:** ❌ Not Implemented
**Impact:** Critical - Course descriptions are plain text only
**Blocks:** Professional course content creation

**Current State:**
- Using `<textarea>` for descriptions
- No formatting options
- No embedded images/videos

**Required Implementation:**
```tsx
// Install Tiptap
pnpm install @tiptap/react @tiptap/starter-kit @tiptap/extension-text-align

// Create Editor Component
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';

export function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  return (
    <div>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
```

**Features Needed:**
- Bold, italic, strikethrough
- Headings (H1-H6)
- Lists (ordered, unordered)
- Links
- Block quotes
- Code blocks
- Text alignment
- Image embeds (future)

**Files to Create:**
- `components/stream/rich-text-editor/editor.tsx`
- `components/stream/rich-text-editor/toolbar.tsx`
- `components/stream/rich-text-editor/render-description.tsx`

**Dependencies:**
- `@tiptap/react`
- `@tiptap/starter-kit`
- `@tiptap/extension-text-align`

**Estimated Effort:** 12-16 hours
**Priority:** 🔴 P0

---

### 3. Video Player Has No Controls
**Status:** ⚠️ Basic Implementation
**Impact:** High - Poor user experience
**Affects:** Lesson viewing, student satisfaction

**Current State:**
```tsx
// Current implementation
<video src={lesson.videoUrl} />
// No controls, no fullscreen, no speed control
```

**Required Implementation:**
```tsx
<video
  className="w-full aspect-video bg-black rounded-lg"
  controls
  controlsList="nodownload" // Optional: prevent downloads
  poster={lesson.thumbnailUrl}
  onPlay={() => trackPlayEvent()}
  onPause={() => saveProgress()}
  onEnded={() => markComplete()}
>
  <source src={lesson.videoUrl} type="video/mp4" />
  <source src={lesson.videoUrl.replace('.mp4', '.webm')} type="video/webm" />
  <track
    kind="subtitles"
    src={lesson.subtitleUrl}
    srcLang="en"
    label="English"
  />
  Your browser doesn't support HTML5 video.
</video>
```

**Features Needed:**
- ✅ Play/pause
- ✅ Volume control
- ✅ Fullscreen
- ✅ Progress bar
- ⚠️ Playback speed (0.5x, 1x, 1.25x, 1.5x, 2x)
- ⚠️ Keyboard shortcuts (Space, Arrow keys, F for fullscreen)
- ⚠️ Picture-in-picture
- ❌ Quality selection (360p, 720p, 1080p) - requires video processing
- ❌ Subtitle toggle
- ❌ Progress saving (resume from last position)

**Files to Update:**
- `components/stream/dashboard/lesson/content.tsx`

**Optional Enhancement (Custom Player):**
- Use `react-player` or build custom controls
- Better mobile experience
- Analytics integration

**Estimated Effort:** 8-12 hours
**Priority:** 🔴 P0

---

## 🟠 HIGH PRIORITY (P1)

### 4. No Drag-and-Drop Reordering
**Status:** ❌ Not Implemented
**Impact:** High - Poor admin UX
**Reference:** Marshal-LMS uses `@dnd-kit/core`

**Current State:**
- Chapters/lessons have `position` field
- Manual position entry required
- No visual reordering

**Required Implementation:**
```tsx
// Install dnd-kit
pnpm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

// Chapter Reorder Component
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';

export function ChapterList({ chapters, onReorder }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = chapters.findIndex(c => c.id === active.id);
      const newIndex = chapters.findIndex(c => c.id === over.id);
      const reordered = arrayMove(chapters, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={chapters}>
        {chapters.map((chapter) => (
          <SortableChapter key={chapter.id} chapter={chapter} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**Server Action:**
```typescript
export async function reorderChapters(courseId: string, chapterIds: string[]) {
  await db.$transaction(
    chapterIds.map((id, index) =>
      db.streamChapter.update({
        where: { id },
        data: { position: index },
      })
    )
  );
  revalidatePath(`/stream/admin/courses/${courseId}/edit`);
}
```

**Files to Create:**
- `components/stream/admin/courses/edit/chapter-reorder.tsx`
- `components/stream/admin/courses/edit/lesson-reorder.tsx`
- `components/stream/admin/courses/edit/actions.ts` (reorder actions)

**Dependencies:**
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

**Estimated Effort:** 16-20 hours
**Priority:** 🟠 P1

---

### 5. Missing Auto-Slug Generation
**Status:** ⚠️ Manual Entry Only
**Impact:** Medium-High - Extra work for admins
**Reference:** Marshal-LMS auto-generates from title

**Current State:**
- Slug field is required input
- No auto-generation button
- Risk of duplicate slugs

**Required Implementation:**
```tsx
import slugify from 'slugify';

export function CourseForm() {
  const generateSlug = () => {
    const title = form.getValues('title');
    const slug = slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    });
    form.setValue('slug', slug);
  };

  return (
    <div className="flex gap-2">
      <Input {...form.register('slug')} />
      <Button
        type="button"
        variant="outline"
        onClick={generateSlug}
      >
        Generate from Title
      </Button>
    </div>
  );
}
```

**Validation:**
```typescript
// Check uniqueness within school
const existingCourse = await db.streamCourse.findFirst({
  where: { slug, schoolId, id: { not: courseId } },
});

if (existingCourse) {
  // Append number: 'course-title-2'
  slug = `${slug}-${Date.now().toString().slice(-4)}`;
}
```

**Dependencies:**
- `slugify` package

**Files to Update:**
- `components/stream/admin/courses/create/form.tsx`
- `components/stream/admin/courses/edit/form.tsx`
- `components/stream/admin/courses/create/actions.ts`

**Estimated Effort:** 4-6 hours
**Priority:** 🟠 P1

---

### 6. No Course Level (Beginner/Intermediate/Advanced)
**Status:** ❌ Not Implemented
**Impact:** Medium - Missing filtering/sorting capability
**Reference:** Marshal-LMS has `level` enum

**Database Change Needed:**
```prisma
enum StreamCourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model StreamCourse {
  // ... existing fields
  level StreamCourseLevel @default(BEGINNER)
}
```

**Migration:**
```bash
pnpm prisma migrate dev --name add_course_level
```

**UI Changes:**
```tsx
// Course Form
<Select name="level">
  <SelectItem value="BEGINNER">Beginner</SelectItem>
  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
  <SelectItem value="ADVANCED">Advanced</SelectItem>
</Select>

// Course Card Badge
<Badge variant={
  level === 'BEGINNER' ? 'success' :
  level === 'INTERMEDIATE' ? 'warning' :
  'destructive'
}>
  {level}
</Badge>
```

**Files to Update:**
- `prisma/models/stream.prisma`
- `components/stream/admin/courses/create/form.tsx`
- `components/stream/admin/courses/create/validation.ts`
- `components/stream/courses/course-card.tsx`
- `components/stream/courses/[slug]/content.tsx`

**Estimated Effort:** 6-8 hours
**Priority:** 🟠 P1

---

### 7. No Course Status Workflow
**Status:** ⚠️ Simplified (isPublished boolean)
**Impact:** Medium - Limited course lifecycle management
**Reference:** Marshal-LMS has Draft → Published → Archived

**Current State:**
```prisma
isPublished Boolean @default(false)
// Only two states: draft or published
```

**Proposed Enhancement:**
```prisma
enum StreamCourseStatus {
  DRAFT       // Not visible to students
  PUBLISHED   // Live and enrollable
  ARCHIVED    // Historical, read-only, not enrollable
}

model StreamCourse {
  status StreamCourseStatus @default(DRAFT)
}
```

**Benefits:**
- Archive old courses without deletion
- Prevent new enrollments while keeping content accessible
- Better course lifecycle management

**UI Changes:**
```tsx
// Admin Course List - Filter by Status
<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="DRAFT">Drafts</TabsTrigger>
    <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
    <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
  </TabsList>
</Tabs>

// Status Badge
<Badge variant={
  status === 'DRAFT' ? 'secondary' :
  status === 'PUBLISHED' ? 'success' :
  'outline'
}>
  {status}
</Badge>
```

**Migration Strategy:**
```sql
-- Migrate existing data
UPDATE stream_course
SET status = CASE
  WHEN isPublished = true THEN 'PUBLISHED'
  ELSE 'DRAFT'
END;

-- Then remove isPublished column
ALTER TABLE stream_course DROP COLUMN isPublished;
```

**Files to Update:**
- `prisma/models/stream.prisma`
- All course queries (filter by status instead of isPublished)
- Admin UI components

**Estimated Effort:** 8-10 hours
**Priority:** 🟠 P1

---

### 8. Missing Enrollment Status Workflow
**Status:** ⚠️ Simplified (isActive boolean)
**Impact:** Medium - Limited payment tracking
**Reference:** Marshal-LMS has Pending → Active → Cancelled

**Current State:**
```prisma
isActive Boolean @default(true)
```

**Proposed Enhancement:**
```prisma
enum StreamEnrollmentStatus {
  PENDING    // Checkout session created, payment not complete
  ACTIVE     // Payment successful, full access
  CANCELLED  // Manually cancelled or refunded
  EXPIRED    // Checkout session expired before payment
}

model StreamEnrollment {
  status StreamEnrollmentStatus @default(PENDING)
}
```

**Workflow:**
1. User clicks "Enroll" → `PENDING` enrollment created
2. Stripe checkout completed → Webhook updates to `ACTIVE`
3. Checkout session expires → Webhook updates to `EXPIRED`
4. Admin/student cancels → Manual update to `CANCELLED`

**Benefits:**
- Track abandoned checkouts
- Handle refunds properly
- Analytics on conversion rates

**Webhook Update:**
```typescript
// api/webhook/stripe/route.ts
case 'checkout.session.completed':
  await db.streamEnrollment.update({
    where: { stripeCheckoutSessionId: session.id },
    data: { status: 'ACTIVE' },
  });

case 'checkout.session.expired':
  await db.streamEnrollment.update({
    where: { stripeCheckoutSessionId: session.id },
    data: { status: 'EXPIRED' },
  });
```

**Files to Update:**
- `prisma/models/stream.prisma`
- `components/stream/courses/enrollment/actions.ts`
- `app/api/webhook/stripe/route.ts` (if exists)
- All enrollment queries

**Estimated Effort:** 6-8 hours
**Priority:** 🟠 P1

---

### 9. No Rate Limiting
**Status:** ❌ Not Implemented
**Impact:** Medium - Vulnerable to abuse
**Reference:** Marshal-LMS uses Arcjet (5 req/min)

**Current State:**
- No rate limiting on enrollments
- No protection against bot attacks
- Potential Stripe abuse

**Required Implementation:**
```typescript
// Install Arcjet
pnpm install @arcjet/next

// lib/arcjet.ts
import arcjet, { fixedWindow } from '@arcjet/next';

export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    fixedWindow({
      mode: 'LIVE',
      window: '60s',
      max: 5, // 5 requests per minute
    }),
  ],
});

// middleware.ts or server action
import { aj } from '@/lib/arcjet';

export async function enrollInCourseAction(courseId: string) {
  const decision = await aj.protect(request);

  if (decision.isDenied()) {
    throw new Error('Too many requests. Please try again later.');
  }

  // ... enrollment logic
}
```

**Rate Limits to Add:**
- Enrollment: 5/min per user
- Course creation: 10/hour per user
- File upload: 20/hour per user
- API endpoints: 60/min per IP

**Dependencies:**
- `@arcjet/next`
- `ARCJET_KEY` environment variable

**Files to Create/Update:**
- `lib/arcjet.ts`
- `middleware.ts` (add Arcjet middleware)
- All server actions (wrap with rate limiting)

**Estimated Effort:** 8-12 hours
**Priority:** 🟠 P1

---

### 10. No Admin Analytics Dashboard
**Status:** ❌ Not Implemented (basic stats only)
**Impact:** Medium - Limited business insights
**Reference:** Marshal-LMS has enrollment trends chart

**Current State:**
- Basic count statistics
- No charts or visualizations
- No historical data

**Required Implementation:**
```tsx
// Install recharts
pnpm install recharts

// Admin Dashboard
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function EnrollmentTrendChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <LineChart width={600} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="enrollments" stroke="#8884d8" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
```

**Metrics to Add:**
- Total revenue (by day/week/month)
- Enrollment count over time
- Popular courses (by enrollment)
- Completion rates
- Average watch time
- Student engagement

**Data Query:**
```typescript
export async function getEnrollmentTrends(schoolId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const enrollments = await db.streamEnrollment.groupBy({
    by: ['createdAt'],
    where: {
      schoolId,
      createdAt: { gte: startDate },
    },
    _count: true,
  });

  return enrollments.map(e => ({
    date: e.createdAt.toLocaleDateString(),
    count: e._count,
  }));
}
```

**Dependencies:**
- `recharts`

**Files to Create:**
- `components/stream/admin/charts/enrollment-trends.tsx`
- `components/stream/admin/charts/revenue-chart.tsx`
- `components/stream/admin/charts/popular-courses.tsx`
- `components/stream/data/admin/admin-get-analytics.ts`

**Estimated Effort:** 12-16 hours
**Priority:** 🟠 P1

---

### 11. Certificate Generation Not Implemented
**Status:** ⚠️ Schema Exists, No Generation
**Impact:** Medium - Missing completion incentive
**Reference:** Marshal-LMS has placeholder (not implemented)

**Current State:**
```prisma
model StreamCertificate {
  // Schema exists but no generation logic
}
```

**Required Implementation:**

**Step 1: Detect Completion**
```typescript
export async function checkCourseCompletion(userId: string, courseId: string) {
  const course = await db.streamCourse.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        include: {
          lessons: { select: { id: true } },
        },
      },
    },
  });

  const totalLessons = course.chapters.flatMap(c => c.lessons).length;

  const completedLessons = await db.streamLessonProgress.count({
    where: {
      userId,
      lessonId: { in: course.chapters.flatMap(c => c.lessons.map(l => l.id)) },
      isCompleted: true,
    },
  });

  return completedLessons === totalLessons;
}
```

**Step 2: Generate Certificate**
```typescript
import { createCanvas } from 'canvas';

export async function generateCertificate(userId: string, courseId: string, schoolId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  const course = await db.streamCourse.findUnique({ where: { id: courseId } });

  // Generate unique certificate number
  const certificateNumber = `CERT-${Date.now()}-${userId.slice(0, 8).toUpperCase()}`;

  // Create certificate (PDF or image)
  const canvas = createCanvas(1200, 800);
  const ctx = canvas.getContext('2d');

  // Draw certificate
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1200, 800);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate of Completion', 600, 200);
  ctx.font = '32px Arial';
  ctx.fillText(user.name, 600, 300);
  ctx.font = '24px Arial';
  ctx.fillText(`Successfully completed: ${course.title}`, 600, 400);
  ctx.font = '18px Arial';
  ctx.fillText(`Certificate Number: ${certificateNumber}`, 600, 500);
  ctx.fillText(`Issued: ${new Date().toLocaleDateString()}`, 600, 550);

  // Save to S3
  const buffer = canvas.toBuffer('image/png');
  const certificateUrl = await uploadToS3(buffer, `certificates/${certificateNumber}.png`);

  // Create database record
  await db.streamCertificate.create({
    data: {
      userId,
      courseId,
      schoolId,
      courseTitle: course.title,
      certificateNumber,
      completedAt: new Date(),
    },
  });

  return { certificateNumber, certificateUrl };
}
```

**Step 3: Download UI**
```tsx
// Student Dashboard
{certificate && (
  <Button asChild>
    <a href={certificate.url} download>
      <Download className="mr-2" />
      Download Certificate
    </a>
  </Button>
)}
```

**Dependencies:**
- `canvas` (for PDF generation) OR
- `@react-pdf/renderer` (alternative)

**Files to Create:**
- `lib/stream/certificate-generator.ts`
- `components/stream/dashboard/certificate-download.tsx`
- `app/api/stream/certificate/[id]/route.ts` (serve PDF)

**Estimated Effort:** 16-24 hours
**Priority:** 🟡 P2 (Nice to have, not critical)

---

## 🟡 MEDIUM PRIORITY (P2)

### 12. No Upload Progress Tracking
**Status:** ❌ Not Implemented
**Impact:** Low-Medium - Poor UX for large files

**Required:** XHR-based upload with progress events

**Estimated Effort:** 4-6 hours
**Priority:** 🟡 P2

---

### 13. No Optimistic UI Updates
**Status:** ❌ Not Implemented
**Impact:** Low-Medium - Slower perceived performance

**Reference:** Marshal-LMS updates UI before server confirms, rolls back on error

**Estimated Effort:** 8-12 hours
**Priority:** 🟡 P2

---

### 14. Missing Course Duration Aggregation
**Status:** ⚠️ Stored on lessons only
**Impact:** Low - Cannot show total course length

**Fix:** Calculate total duration from all lessons and cache on course

**Estimated Effort:** 3-4 hours
**Priority:** 🟡 P2

---

### 15. No Email Notifications
**Status:** ❌ Not Implemented
**Impact:** Low-Medium - Students miss enrollment confirmations

**Required:**
- Enrollment confirmation
- Course completion
- New course published (for enrolled students)

**Dependencies:** Resend or existing Hogwarts email system

**Estimated Effort:** 8-12 hours
**Priority:** 🟡 P2

---

### 16. No Subtitle Support
**Status:** ❌ Not Implemented
**Impact:** Low - Accessibility issue

**Required:** VTT file upload and `<track>` element

**Estimated Effort:** 4-6 hours
**Priority:** 🟡 P2

---

### 17. No Quality Selection (360p, 720p, 1080p)
**Status:** ❌ Not Implemented
**Impact:** Low - Bandwidth optimization

**Requires:** Video processing pipeline (transcoding)

**Estimated Effort:** 40+ hours (with video processing)
**Priority:** 🟢 P3 (Future enhancement)

---

### 18. No Progress Saving (Resume Playback)
**Status:** ❌ Not Implemented
**Impact:** Medium - Students restart videos

**Required:** Track playback position in database

**Estimated Effort:** 6-8 hours
**Priority:** 🟡 P2

---

### 19. No Confetti Celebrations
**Status:** ❌ Not Implemented
**Impact:** Very Low - UX polish

**Reference:** Marshal-LMS uses `canvas-confetti` on course creation, enrollment, lesson completion

**Dependencies:** `canvas-confetti`

**Estimated Effort:** 2-3 hours
**Priority:** 🟢 P3 (Polish)

---

### 20. No File Type Validation
**Status:** ⚠️ Any URL accepted
**Impact:** Low-Medium - Potential errors

**Required:** Validate video formats (MP4, WebM, Ogg)

**Estimated Effort:** 2-3 hours
**Priority:** 🟡 P2

---

## 🟢 LOW PRIORITY (P3)

### 21. Course Reviews & Ratings
**Status:** ❌ Not Implemented
**Impact:** Low - Social proof missing

**Not in reference LMS** - Future consideration

**Estimated Effort:** 20-30 hours
**Priority:** 🟢 P3

---

### 22. Discussion Forums
**Status:** ❌ Not Implemented
**Impact:** Low - Community engagement

**Not in reference LMS** - Future consideration

**Estimated Effort:** 40+ hours
**Priority:** 🟢 P3

---

### 23. Quizzes & Assessments
**Status:** ❌ Not Implemented
**Impact:** Medium - Learning validation

**Not in reference LMS** - Major feature

**Estimated Effort:** 80+ hours
**Priority:** 🟢 P3 (Future major feature)

---

### 24. Refund Management
**Status:** ❌ Not Implemented
**Impact:** Low - Manual process required

**Reference LMS:** Basic status tracking only

**Estimated Effort:** 12-16 hours
**Priority:** 🟢 P3

---

### 25. Bulk Course Import
**Status:** ❌ Not Implemented
**Impact:** Very Low - One-time use case

**Estimated Effort:** 16-24 hours
**Priority:** 🟢 P3

---

### 26. Live Streaming
**Status:** ❌ Not Implemented
**Impact:** Low - Different use case

**Not in reference LMS**

**Estimated Effort:** 100+ hours
**Priority:** 🟢 P3 (Future major feature)

---

### 27. Mobile App Support
**Status:** ❌ Not Web-only
**Impact:** Low - Responsive web works

**Estimated Effort:** 200+ hours (React Native)
**Priority:** 🟢 P3 (Future)

---

## 🐛 Known Bugs

### Bug #1: Enrollment Redirect URL Includes /s/subdomain/
**Status:** ✅ **FIXED** (January 2025)
**Impact:** Critical - 404 errors on enrollment

**Fix Applied:**
- Changed enrollment redirect from `/${locale}/s/${subdomain}/stream/dashboard/${slug}`
- To: `/${locale}/stream/dashboard/${slug}`
- Middleware handles subdomain mapping

**Commit:** `25bec20` - "fix(stream): Fix enrollment redirect URLs"

---

### Bug #2: Navigation Links Include /s/subdomain/
**Status:** ✅ **FIXED** (January 2025)
**Impact:** Critical - 404 errors on navigation

**Fix Applied:**
- Updated `home/content.tsx` "Explore Courses" link
- Updated `dashboard/content.tsx` "Browse Courses" link
- Removed hardcoded `/s/${subdomain}/` from all navigation

**Commit:** Various navigation fixes

---

### Bug #3: Admin Functions Missing schoolId Filtering
**Status:** ✅ **FIXED** (January 2025)
**Impact:** Critical - Security vulnerability

**Fix Applied:**
- `adminGetCourse` now uses `findFirst` with `schoolId` filter
- `adminGetLesson` includes `schoolId` through course relationship
- `deleteCourse` verifies ownership before deletion

**Security Impact:** Prevented cross-school data access

---

### Bug #4: Seed Script Duplicate Errors
**Status:** ✅ **FIXED** (January 2025)
**Impact:** Medium - Seed fails on re-run

**Fix Applied:**
- Payment creation uses `upsert` with `paymentNumber` unique key
- ExamResult creation uses `upsert` with composite key `examId_studentId`
- Stream course creation includes `userId` (not `teacher.id`)

**Commit:** `0790c53` - "fix(seed): Fix stream course userId foreign key"

---

## 📈 Technical Debt

### Debt #1: No TypeScript Strict Mode for Stream
**Impact:** Medium - Type safety could be better
**Recommendation:** Enable strict mode, fix type errors

### Debt #2: No Unit Tests
**Impact:** High - Risk of regressions
**Recommendation:** Add Vitest tests for:
- Data fetchers
- Server actions
- Components

### Debt #3: No Error Boundaries
**Impact:** Medium - Poor error UX
**Recommendation:** Add React error boundaries for graceful failure

### Debt #4: Inconsistent Error Handling
**Impact:** Low-Medium - Some actions throw, others return error objects
**Recommendation:** Standardize on `{ success: boolean, error?: string }` pattern

### Debt #5: No Logging/Monitoring
**Impact:** High - Hard to debug production issues
**Recommendation:** Add Sentry or similar for error tracking

---

## 🗺️ Development Roadmap

### Phase 1: Critical Features (Q1 2025)
**Goal:** Make Stream production-ready

- [ ] S3 file upload implementation (P0, 16-24h)
- [ ] Rich text editor (Tiptap) (P0, 12-16h)
- [ ] Enhanced video player (P0, 8-12h)
- [ ] Auto-slug generation (P1, 4-6h)
- [ ] Course level field (P1, 6-8h)

**Total Estimated Effort:** 46-66 hours (~2 weeks)

---

### Phase 2: Enhanced UX (Q2 2025)
**Goal:** Improve admin and student experience

- [ ] Drag-and-drop reordering (P1, 16-20h)
- [ ] Course status workflow (P1, 8-10h)
- [ ] Enrollment status workflow (P1, 6-8h)
- [ ] Rate limiting (Arcjet) (P1, 8-12h)
- [ ] Admin analytics dashboard (P1, 12-16h)

**Total Estimated Effort:** 50-66 hours (~2-3 weeks)

---

### Phase 3: Advanced Features (Q3 2025)
**Goal:** Add premium features

- [ ] Certificate generation (P2, 16-24h)
- [ ] Email notifications (P2, 8-12h)
- [ ] Upload progress tracking (P2, 4-6h)
- [ ] Progress saving (resume playback) (P2, 6-8h)
- [ ] Optimistic UI updates (P2, 8-12h)

**Total Estimated Effort:** 42-62 hours (~2 weeks)

---

### Phase 4: Future Enhancements (Q4 2025+)
**Goal:** Major feature additions

- [ ] Course reviews & ratings (P3, 20-30h)
- [ ] Quizzes & assessments (P3, 80+h)
- [ ] Discussion forums (P3, 40+h)
- [ ] Video processing pipeline (P3, 40+h)
- [ ] Refund management (P3, 12-16h)

**Total Estimated Effort:** 192+ hours (~1-2 months)

---

## 📝 Notes

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Create course in School A
- [ ] Verify invisible in School B
- [ ] Enroll as student
- [ ] Complete payment
- [ ] Watch lesson
- [ ] Mark complete
- [ ] Delete course
- [ ] Verify cascade deletes

**Automated Testing (Planned):**
- [ ] Unit tests for data fetchers
- [ ] Integration tests for enrollment flow
- [ ] E2E tests with Playwright

---

### Migration Strategy

When implementing breaking changes:

1. **Database Changes:**
   - Always use Prisma migrations
   - Test migrations on staging first
   - Provide data migration scripts for enum changes

2. **Code Changes:**
   - Update types first
   - Fix TypeScript errors
   - Update all consuming components

3. **Deployment:**
   - Deploy schema changes separately
   - Deploy code changes after schema is live
   - Monitor for errors

---

### Contributing

When adding features:

1. Check this ISSUES.md for existing tracking
2. Update status when starting work
3. Estimated effort → Actual effort tracking
4. Update README.md with new features
5. Write tests for new functionality
6. Update integration docs if needed

---

**Last Updated:** January 2025
**Maintainers:** Hogwarts Development Team
**Questions?** Check README.md or contact team lead
