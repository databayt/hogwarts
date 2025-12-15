# Manage Block - Exam Lifecycle Management

**Complete examination planning, scheduling, and management system**

Part of the [Exam Block System](../README.md)

---

## Overview

The Manage Block handles the entire lifecycle of examinations from creation to completion. It provides a comprehensive interface for scheduling exams, configuring marks, assigning classes and subjects, and tracking exam status throughout the academic term.

**Key Responsibilities:**

- Exam creation with multi-step forms
- Scheduling with date, time, and duration
- Class and subject assignment
- Marks configuration (total, passing threshold)
- Exam type categorization
- Status workflow management
- Search, filter, and sort capabilities
- Calendar view for scheduling
- Analytics dashboard

---

## Features

### 1. Multi-Step Exam Creation

Three-step form workflow for comprehensive exam setup:

**Step 1: Basic Information**

- Exam title and description
- Class selection (dropdown from enrolled classes)
- Subject selection (filtered by class)
- Exam type (MIDTERM, FINAL, QUIZ, TEST, PRACTICAL)

**Step 2: Schedule & Marks**

- Exam date (calendar picker)
- Start time and end time
- Auto-calculated duration
- Total marks allocation
- Passing marks threshold (with validation)

**Step 3: Instructions & Details**

- Exam instructions for students
- Additional notes for teachers
- Review and submit

**File References:**

- `form.tsx:1-191` - Main form component
- `basic-information.tsx:1-135` - Step 1
- `schedule-marks.tsx:1-151` - Step 2
- `instructions-details.tsx:1-50` - Step 3
- `footer.tsx:1-83` - Navigation controls

### 2. Exam Status Workflow

Exams progress through defined states:

```
PLANNED → IN_PROGRESS → COMPLETED
                ↓
            CANCELLED
```

**Status Definitions:**

- `PLANNED` - Exam scheduled but not started
- `IN_PROGRESS` - Exam currently happening
- `COMPLETED` - Exam finished, marks being entered
- `CANCELLED` - Exam cancelled/postponed

**Status Management:**

- Manual status updates via actions
- Automatic transitions based on date/time (future enhancement)
- Status-based filtering in exam list
- Color-coded status indicators

### 3. Exam Calendar View

Visual scheduling interface with:

- Month/week/day views
- Drag-and-drop rescheduling (future)
- Color-coding by exam type
- Conflict detection (same class, overlapping time)
- Quick exam creation from calendar
- Export to PDF/iCal

**File Reference:** `calendar.tsx:1-430`

### 4. Marks Entry Interface

Streamlined interface for entering student grades:

- Student roster with input fields
- Real-time validation (marks ≤ total marks)
- Auto-calculate percentage
- Auto-assign letter grade (based on boundaries)
- Mark student as absent
- Bulk save functionality
- Remarks/comments per student

**File Reference:** `marks-entry-form.tsx:1-259`

### 5. Analytics Dashboard

Comprehensive exam statistics:

- Class average and median
- Highest and lowest scores
- Pass rate percentage
- Grade distribution chart
- Student rankings
- Subject-wise performance
- Comparison with previous exams

**File Reference:** `analytics-dashboard.tsx:1-226`

### 6. Search & Filtering

Advanced filtering capabilities:

- Search by exam title
- Filter by class
- Filter by subject
- Filter by exam type
- Filter by status
- Date range filtering
- Sort by date, name, class

---

## Architecture

### File Structure

```
manage/
├── content.tsx                # Server component - main page
├── table.tsx                  # Client component - data table
├── columns.tsx                # Table column definitions
├── form.tsx                   # Multi-step exam form
├── basic-information.tsx      # Form step 1
├── schedule-marks.tsx         # Form step 2
├── instructions-details.tsx   # Form step 3
├── footer.tsx                 # Form navigation
├── calendar.tsx               # Calendar view component
├── marks-entry-form.tsx       # Grade entry interface
├── analytics-dashboard.tsx    # Statistics dashboard
├── results-list.tsx           # Results display
├── export-button.tsx          # Export functionality
├── actions.ts                 # Server actions
├── validation.ts              # Zod schemas
├── types.ts                   # TypeScript types
├── config.ts                  # Static configuration
├── utils.ts                   # Helper functions
└── list-params.ts             # URL state management
```

### Technology Stack

- **Next.js 15** - App Router with Server Components
- **React 19** - Server Actions and hooks
- **Prisma 6.14** - Type-safe database operations
- **React Hook Form 7.61** - Form state management
- **Zod 4.0** - Schema validation
- **@tanstack/react-table 8.21** - Data tables
- **date-fns 4.1** - Date manipulation
- **Recharts 2.15** - Analytics charts

---

## Usage

### Creating an Exam

```typescript
import { createExam } from "@/components/platform/exams/manage/actions"

// Server action usage
const exam = await createExam({
  title: "Mathematics Midterm Exam",
  description: "Covers chapters 1-5",
  classId: "clx123abc",
  subjectId: "sub456def",
  examDate: new Date("2025-03-15"),
  startTime: "09:00",
  endTime: "11:00",
  totalMarks: 100,
  passingMarks: 50,
  examType: "MIDTERM",
  instructions: "Bring calculator and geometry set",
})

// Returns: { success: true, examId: "..." }
```

### Updating an Exam

```typescript
import { updateExam } from "@/components/platform/exams/manage/actions"

const updated = await updateExam({
  id: "exam123",
  title: "Updated Title",
  examDate: new Date("2025-03-16"),
  totalMarks: 120,
})
```

### Fetching Exams with Filters

```typescript
import { getExams } from "@/components/platform/exams/manage/actions"

const exams = await getExams({
  search: "midterm",
  classId: "clx123",
  status: "PLANNED",
  page: 1,
  pageSize: 20,
})

// Returns: { exams: Exam[], total: number, pages: number }
```

### Entering Marks

```typescript
import { enterMarks } from "@/components/platform/exams/manage/actions"

const results = await enterMarks({
  examId: "exam123",
  marks: [
    {
      studentId: "stu001",
      marksObtained: 85,
      isAbsent: false,
      remarks: "Excellent work",
    },
    {
      studentId: "stu002",
      marksObtained: 0,
      isAbsent: true,
      remarks: "Medical leave",
    },
  ],
})
```

### Getting Exam Analytics

```typescript
import { getExamAnalytics } from "@/components/platform/exams/manage/actions"

const analytics = await getExamAnalytics("exam123")

/*
Returns:
{
  averageScore: 72.5,
  medianScore: 75,
  highestScore: 98,
  lowestScore: 35,
  passRate: 85.5,
  gradeDistribution: {
    "A+": 5,
    "A": 12,
    "B": 18,
    ...
  },
  rankings: [
    { studentId: "...", name: "...", score: 98, rank: 1 },
    ...
  ]
}
*/
```

---

## Server Actions

### Available Actions

All actions in `actions.ts:1-522`:

#### CRUD Operations

- `createExam(data)` - Create new exam
- `updateExam(data)` - Update existing exam
- `deleteExam(examId)` - Delete exam (soft delete)
- `getExam(examId)` - Fetch single exam with relations
- `getExams(filters)` - Fetch paginated exam list

#### Marks Management

- `enterMarks(examId, marks[])` - Bulk save student marks
- `getExamResults(examId)` - Fetch all results for exam
- `updateMarks(examId, studentId, marks)` - Update single result

#### Analytics

- `getExamAnalytics(examId)` - Calculate statistics
- `getExamWithStudents(examId)` - Fetch exam with student roster

#### Scheduling

- `checkExamConflict(classId, date, startTime, endTime)` - Detect conflicts
- `getExamsForCalendar(startDate, endDate)` - Calendar data

#### Export

- `exportExamSchedule(filters)` - Generate PDF schedule
- `exportExamMarks(examId)` - Export marks to CSV

### Action Pattern

All actions follow this pattern:

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

export async function actionName(input: InputType) {
  // 1. Authentication
  const session = await auth()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // 2. Multi-tenant context
  const { schoolId } = await getTenantContext()

  // 3. Validation (Zod)
  const validated = schema.parse(input)

  // 4. Permission check (role-based)
  if (!["ADMIN", "TEACHER"].includes(session.user.role)) {
    throw new Error("Insufficient permissions")
  }

  // 5. Business logic
  const result = await db.exam.create({
    data: {
      ...validated,
      schoolId, // Always scope by tenant
    },
  })

  // 6. Revalidate
  revalidatePath(`/[lang]/exams`)

  // 7. Return typed result
  return { success: true, data: result }
}
```

---

## Validation & Types

### Zod Schemas

**File:** `validation.ts:1-83`

```typescript
import { z } from "zod"

// Base exam schema
export const examSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    classId: z.string().cuid("Invalid class ID"),
    subjectId: z.string().cuid("Invalid subject ID"),
    examDate: z.date().min(new Date(), "Date must be in future"),
    startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
    totalMarks: z.number().int().min(1).max(1000),
    passingMarks: z.number().int().min(1),
    examType: z.enum(["MIDTERM", "FINAL", "QUIZ", "TEST", "PRACTICAL"]),
    instructions: z.string().optional(),
  })
  .refine((data) => data.passingMarks <= data.totalMarks, {
    message: "Passing marks cannot exceed total marks",
    path: ["passingMarks"],
  })
  .refine(
    (data) => {
      const start = new Date(`2000-01-01T${data.startTime}`)
      const end = new Date(`2000-01-01T${data.endTime}`)
      return end > start
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )

// Marks entry schema
export const marksEntrySchema = z
  .object({
    examId: z.string().cuid(),
    marks: z.array(
      z.object({
        studentId: z.string().cuid(),
        marksObtained: z.number().min(0),
        isAbsent: z.boolean().default(false),
        remarks: z.string().optional(),
      })
    ),
  })
  .refine(
    async (data) => {
      // Validate marks don't exceed total
      const exam = await db.exam.findUnique({
        where: { id: data.examId },
      })
      return data.marks.every(
        (m) => m.isAbsent || m.marksObtained <= exam.totalMarks
      )
    },
    {
      message: "Marks obtained cannot exceed total marks",
      path: ["marks"],
    }
  )
```

### TypeScript Types

**File:** `types.ts:1-39`

```typescript
import type { Exam, ExamStatus, ExamType } from "@prisma/client"

// Form input types (client-side)
export type ExamFormData = {
  title: string
  description?: string
  classId: string
  subjectId: string
  examDate: Date
  startTime: string
  endTime: string
  totalMarks: number
  passingMarks: number
  examType: ExamType
  instructions?: string
}

// Extended exam with relations (server-side)
export type ExamWithRelations = Exam & {
  class: { id: string; name: string }
  subject: { id: string; subjectName: string }
  _count: {
    examResults: number
  }
}

// Analytics result type
export type ExamAnalytics = {
  averageScore: number
  medianScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  totalStudents: number
  presentStudents: number
  absentStudents: number
  gradeDistribution: Record<string, number>
  rankings: Array<{
    studentId: string
    studentName: string
    score: number
    percentage: number
    grade: string
    rank: number
  }>
}
```

---

## Configuration

### Exam Types

**File:** `config.ts:1-39`

```typescript
export const EXAM_TYPES = [
  { value: "MIDTERM", label: "Midterm Exam", color: "blue" },
  { value: "FINAL", label: "Final Exam", color: "red" },
  { value: "QUIZ", label: "Quiz", color: "green" },
  { value: "TEST", label: "Test", color: "yellow" },
  { value: "PRACTICAL", label: "Practical Exam", color: "purple" },
] as const

export const EXAM_STATUSES = [
  { value: "PLANNED", label: "Planned", icon: "Calendar" },
  { value: "IN_PROGRESS", label: "In Progress", icon: "Clock" },
  { value: "COMPLETED", label: "Completed", icon: "CheckCircle" },
  { value: "CANCELLED", label: "Cancelled", icon: "XCircle" },
] as const

// Default values
export const DEFAULT_EXAM_DURATION = 120 // minutes
export const DEFAULT_PASSING_PERCENTAGE = 50
export const MAX_EXAM_DURATION = 480 // 8 hours
```

---

## Utilities

### Helper Functions

**File:** `utils.ts:1-190`

#### Duration Calculation

```typescript
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number)
  const [endHour, endMin] = endTime.split(":").map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  let duration = endMinutes - startMinutes
  if (duration < 0) duration += 24 * 60 // Overnight exam

  return duration
}
```

#### Conflict Detection

```typescript
export async function detectExamConflict(
  classId: string,
  examDate: Date,
  startTime: string,
  endTime: string,
  excludeExamId?: string
): Promise<Exam | null> {
  const { schoolId } = await getTenantContext()

  return await db.exam.findFirst({
    where: {
      schoolId,
      classId,
      examDate,
      id: excludeExamId ? { not: excludeExamId } : undefined,
      OR: [
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    },
  })
}
```

#### Format Helpers

```typescript
export function formatExamDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatExamTime(
  date: Date,
  startTime: string,
  endTime: string
): string {
  return `${format(date, "MMM dd, yyyy")} • ${startTime} - ${endTime}`
}
```

---

## Routes

### Page Routes

All routes under `/[lang]/exams/`:

- `/[lang]/exams` - Exam list (table view)
- `/[lang]/exams/new` - Create exam (multi-step form)
- `/[lang]/exams/[id]` - Exam details
- `/[lang]/exams/[id]/edit` - Edit exam
- `/[lang]/exams/[id]/marks` - Enter marks
- `/[lang]/exams/[id]/analytics` - View analytics
- `/[lang]/exams/calendar` - Calendar view
- `/[lang]/exams/upcoming` - Upcoming exams (filtered)

### API Routes (Future)

REST API endpoints (planned):

- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `GET /api/exams/[id]` - Get exam
- `PATCH /api/exams/[id]` - Update exam
- `DELETE /api/exams/[id]` - Delete exam
- `POST /api/exams/[id]/marks` - Submit marks

---

## Integration Points

### With Other Blocks

**Question Bank Block:**

- Link to question bank when creating exam
- "Add Questions" button in exam form
- Future: Auto-populate from question bank

**Generate Block:**

- "Generate from Template" option in create form
- Redirects to generate block with pre-filled data

**Mark Block:**

- "Enter Marks" action in exam list
- Redirects to marks entry interface
- Shows marking status

**Results Block:**

- "View Results" action for completed exams
- Links to analytics dashboard
- PDF generation trigger

### With Platform Features

**Timetable:**

- Block regular classes during exam
- Show exams in timetable view

**Notifications:**

- Send exam reminders to students
- Alert teachers when marks due

**Reports:**

- Include exam data in report cards
- Performance trends over time

---

## Multi-Tenant Safety

**Critical:** All database operations MUST include `schoolId`:

```typescript
// ✅ CORRECT - Scoped by school
const exams = await db.exam.findMany({
  where: {
    schoolId, // Required!
    status: "PLANNED",
  },
})

// ✅ CORRECT - Update with school check
const updated = await db.exam.update({
  where: {
    id: examId,
    schoolId, // Prevents cross-tenant modification
  },
  data: updates,
})

// ❌ WRONG - Missing schoolId
const exam = await db.exam.findUnique({
  where: { id: examId },
})
```

**Testing Multi-Tenant Safety:**

1. Create test accounts for multiple schools
2. Attempt to access exam from different school
3. Verify 404 or unauthorized error
4. Check database queries include schoolId filter

---

## Internationalization

### Translation Keys

**Required dictionary keys:**

```typescript
dictionary.school.exams.manage = {
  title: "Exam Management",
  description: "Create and manage examinations",
  create: "Create Exam",
  edit: "Edit Exam",
  delete: "Delete Exam",
  form: {
    title: "Exam Title",
    description: "Description",
    class: "Select Class",
    subject: "Select Subject",
    examDate: "Exam Date",
    startTime: "Start Time",
    endTime: "End Time",
    totalMarks: "Total Marks",
    passingMarks: "Passing Marks",
    examType: "Exam Type",
    instructions: "Instructions for Students",
  },
  status: {
    planned: "Planned",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  },
}
```

### RTL Support

All components support RTL (Arabic):

- Form layouts adjust automatically
- Calendar flips for RTL
- Table text-align changes
- Time pickers work in both directions

---

## Testing

### Unit Tests (Future)

```typescript
// __tests__/manage/validation.test.ts
import { examSchema } from "../validation"

describe("Exam Validation", () => {
  it("should validate valid exam data", () => {
    const result = examSchema.safeParse({
      title: "Math Exam",
      classId: "clx123",
      subjectId: "sub456",
      examDate: new Date("2025-03-15"),
      startTime: "09:00",
      endTime: "11:00",
      totalMarks: 100,
      passingMarks: 50,
      examType: "MIDTERM",
    })

    expect(result.success).toBe(true)
  })

  it("should reject passing marks > total marks", () => {
    const result = examSchema.safeParse({
      // ... other valid fields
      totalMarks: 100,
      passingMarks: 120,
    })

    expect(result.success).toBe(false)
  })
})
```

### Integration Tests

```typescript
// __tests__/manage/actions.test.ts
import { createExam } from "../actions"

describe("Exam Actions", () => {
  it("should create exam with schoolId", async () => {
    const exam = await createExam({
      title: "Test Exam",
      // ... other fields
    })

    expect(exam.schoolId).toBe(mockSchoolId)
  })
})
```

---

## Performance Considerations

### Database Indexes

Ensure these indexes exist:

```prisma
model Exam {
  // ...
  @@index([schoolId, examDate])
  @@index([schoolId, classId])
  @@index([schoolId, subjectId])
  @@index([schoolId, status])
}
```

### Query Optimization

```typescript
// ❌ Slow - Fetches everything
const exams = await db.exam.findMany({
  where: { schoolId },
  include: {
    class: true,
    subject: true,
    examResults: true,
  },
})

// ✅ Fast - Select only needed fields
const exams = await db.exam.findMany({
  where: { schoolId },
  select: {
    id: true,
    title: true,
    examDate: true,
    class: { select: { name: true } },
    subject: { select: { subjectName: true } },
    _count: { select: { examResults: true } },
  },
})
```

---

## Contributing

When adding features to the Manage Block:

1. **Follow the pattern:** types.ts → validation.ts → actions.ts → form.tsx
2. **Multi-tenant first:** Always include `schoolId` in queries
3. **Validate twice:** Client (UX) + Server (security)
4. **Type everything:** No `any` types
5. **Document:** Update this README
6. **Test:** Add unit and integration tests
7. **i18n:** Add translation keys for en/ar
8. **Accessibility:** Ensure keyboard navigation works

---

## Related Documentation

- [Main Exam Block README](../README.md)
- [Main Exam Block ISSUE](../ISSUE.md)
- [Question Bank Block](../qbank/README.md)
- [Auto-Generate Block](../generate/README.md)
- [Auto-Mark Block](../mark/README.md)
- [Results Block](../results/README.md)

---

**Last Updated:** 2025-10-27
**Version:** 2.0
**Maintainer:** Platform Team
