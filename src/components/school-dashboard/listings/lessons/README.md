## Lessons — Lesson Planning and Curriculum Management

**Admin Control Center for Lesson Content and Teaching Materials**

The Lessons feature empowers teachers to create lesson plans, organize curriculum content, link to assignments and resources, and track lesson delivery with comprehensive planning tools.

### Course Management Integration

Lessons are now fully integrated with the enhanced Course Management system:

- **Lessons are linked to Class (Course Sections)** - Each lesson belongs to a specific class/section
- **Teacher & Subject auto-assigned** - Inherited from the class configuration
- **Evaluation Types supported** - Normal, GPA, CWA, and CCE grading systems
- **Course Hierarchy** - Classes can have prerequisites and dependencies
- **Batch/Section Management** - Multiple sections per course with capacity limits

### What Admins Can Do

**Core Capabilities:**

- 📚 View all lesson plans across school
- 📊 Monitor curriculum coverage
- 🔍 Search and filter lessons
- 📁 Export lesson plans
- 📈 Track lesson delivery progress

### What Teachers Can Do

- ✅ Create lesson plans for their classes
- ✅ Link lessons to timetable slots
- ✅ Attach resources and materials
- ✅ Link to assignments and assessments
- ✅ Track lesson objectives
- ✅ Share lesson plans with colleagues
- ✅ Clone lessons to other classes
- ❌ Cannot modify other teachers' lessons

### What Students Can View

- ✅ View upcoming lesson topics
- ✅ Access lesson materials
- ✅ See learning objectives
- ✅ View linked assignments
- ❌ Cannot view lesson plans

### What Parents Can View

- ✅ View what their child is learning
- ✅ See upcoming topics
- ❌ Cannot access detailed lesson plans

### Current Implementation Status

**Production-Ready MVP ✅**

**Completed:**

- ✅ CRUD operations with validation
- ✅ Class and subject assignment
- ✅ Lesson content management
- ✅ Multi-tenant isolation (schoolId scoping)

**Planned:**

- ⏸️ Resource attachments (PDFs, videos)
- ⏸️ Lesson templates
- ⏸️ Curriculum mapping
- ⏸️ Learning objectives tracking

---

## Admin Workflows

### 1. Create a Lesson Plan

1. Navigate to `/lessons`
2. Click "Create Lesson"
3. Fill in lesson details:
   - Title (e.g., "Introduction to Algebra")
   - Class and subject
   - Learning objectives
   - Content and activities
   - Materials needed
   - Duration
4. Link to timetable slot (optional)
5. Save as draft or publish

### 2. Link Lessons to Timetable

1. Open timetable view
2. Click on a period slot
3. Select "Attach Lesson Plan"
4. Choose from existing lessons or create new
5. Lesson appears in teacher and student schedules

### 3. Attach Resources

1. Open lesson detail page
2. Click "Add Resources"
3. Upload files (PDFs, presentations, videos)
4. Add web links
5. Students can access materials

### 4. Track Curriculum Coverage

1. Navigate to `/lessons/curriculum`
2. View curriculum map
3. See which topics covered
4. Identify gaps in coverage
5. Plan remaining lessons for term

---

## Integration with Other Features

### Links to Timetable

- Lessons attached to specific timetable slots
- Teachers see lesson plans in schedule
- Students view lesson topics ahead

### Links to Assignments

- Link assignments to lessons
- Students see related homework
- Curriculum alignment tracking

### Links to Classes

- Lessons created per class
- Different lessons for different sections
- Class-specific adaptations

### Links to Subjects

- Lessons organized by subject
- Subject-wise curriculum planning
- Cross-curricular connections

---

## Technical Implementation

**Files:**

- `content.tsx` - Lesson list view
- `actions.ts` - CRUD operations
- `validation.ts` - Zod schemas
- `form.tsx` - Lesson creation form

**Database Schema:**

```prisma
enum LessonStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Lesson {
  id          String       @id @default(cuid())
  schoolId    String
  classId     String       // Links to Class (Course Section)
  title       String
  description String?
  lessonDate  DateTime
  startTime   String       // HH:MM format
  endTime     String       // HH:MM format
  objectives  String?      @db.Text
  materials   String?      @db.Text
  activities  String?      @db.Text
  assessment  String?      @db.Text
  notes       String?      @db.Text
  status      LessonStatus @default(PLANNED)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  school School @relation(fields: [schoolId], references: [id])
  class  Class  @relation(fields: [classId], references: [id])

  @@index([schoolId, classId])
  @@index([lessonDate])
  @@index([status])
}

// Enhanced Class (Course Section) Model
enum EvaluationType {
  NORMAL // Percentage-based (0-100%)
  GPA    // Grade Point Average (4.0 scale)
  CWA    // Cumulative Weighted Average
  CCE    // Continuous Comprehensive Evaluation
}

model Class {
  // ... existing fields ...

  // Course Management Fields
  courseCode     String?         // e.g., "CS101"
  credits        Decimal?        @db.Decimal(3, 2)
  evaluationType EvaluationType  @default(NORMAL)
  minCapacity    Int?            @default(10)
  maxCapacity    Int?            @default(50)
  duration       Int?            // Duration in weeks
  prerequisiteId String?         // Parent course

  // Relations
  lessons          Lesson[]
  prerequisite     Class?  @relation("CoursePrerequisites", fields: [prerequisiteId], references: [id])
  dependentCourses Class[] @relation("CoursePrerequisites")
}
```

---

## Technology Stack & Dependencies

This feature is built with the following technologies (see [Platform README](../../README.md) for complete stack details):

### Core Framework

- **Next.js 15.4+** - App Router with Server Components ([Docs](https://nextjs.org/docs))
- **React 19+** - Server Actions, new hooks (`useActionState`, `useFormStatus`) ([Docs](https://react.dev))
- **TypeScript** - Strict mode for type safety

### Database & ORM

- **Neon PostgreSQL** - Serverless database with autoscaling ([Docs](https://neon.tech/docs/introduction))
- **Prisma ORM 6.14+** - Type-safe queries and migrations ([Docs](https://www.prisma.io/docs))

### Forms & Validation

- **React Hook Form 7.61+** - Performant form state management ([Docs](https://react-hook-form.com))
- **Zod 4.0+** - Runtime schema validation (client + server) ([Docs](https://zod.dev))

### UI Components

- **shadcn/ui** - Accessible components built on Radix UI ([Docs](https://ui.shadcn.com/docs))
- **TanStack Table 8.21+** - Headless table with sorting/filtering ([Docs](https://tanstack.com/table))
- **Tailwind CSS 4** - Utility-first styling ([Docs](https://tailwindcss.com/docs))

### Server Actions Pattern

All mutations follow the standard server action pattern:

```typescript
"use server"
export async function performAction(input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = schema.parse(input)
  await db.model.create({ data: { ...validated, schoolId } })
  revalidatePath("/feature-path")
  return { success: true }
}
```

### Key Features

- **Multi-Tenant Isolation**: All queries scoped by `schoolId`
- **Type Safety**: End-to-end TypeScript with Prisma + Zod inference
- **Server-Side Operations**: Mutations via Next.js Server Actions
- **URL State Management**: Filters and pagination synced to URL (where applicable)
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML

For complete technology documentation, see [Platform Technology Stack](../../README.md#technology-stack--documentation).

---
