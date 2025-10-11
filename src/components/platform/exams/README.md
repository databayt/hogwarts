## Exams — Examination Management

**Admin Control Center for Exam Scheduling and Assessment**

The Exams feature empowers school administrators and teachers to schedule examinations, manage exam logistics, enter marks, track student performance, and generate comprehensive assessment reports.

### What Admins Can Do

**Core Capabilities:**
- 📝 Create and schedule exams (date, time, duration)
- 📚 Assign exams to classes and subjects
- ⏰ Set exam timing (start time, end time, duration)
- 📊 Configure marking scheme (total marks, passing threshold)
- 📋 Manage exam types (midterm, final, quiz, test)
- 🏫 Assign exam halls and invigilators
- 📁 Export exam schedules to CSV/PDF
- 🔄 Bulk exam creation for multiple classes
- 📈 View exam performance analytics

### What Teachers Can Do
- ✅ Create exams for their assigned classes
- ✅ Schedule exam date and time
- ✅ Enter marks for students
- ✅ View exam results and statistics
- ✅ Generate grade reports
- ✅ Export exam marks to CSV
- ❌ Cannot modify other teachers' exams

### What Students Can View
- ✅ View upcoming exams (schedule)
- ✅ See exam details (date, time, duration, total marks)
- ✅ View their exam scores after marking
- ✅ See grade analysis and feedback
- ❌ Cannot view other students' marks

### What Parents Can View
- ✅ View their child's exam schedule
- ✅ See exam details and instructions
- ✅ View child's exam results
- ✅ Access performance trends
- ❌ Cannot view full class results

### Current Implementation Status
**Production-Ready MVP ✅**

**Completed:**
- ✅ CRUD operations with validation
- ✅ Multi-step form (basic info → schedule → instructions)
- ✅ Exam scheduling (date, time, duration)
- ✅ Class and subject assignment
- ✅ Total marks and passing threshold configuration
- ✅ Exam types (MIDTERM, FINAL, QUIZ, TEST, PRACTICAL)
- ✅ Exam status (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
- ✅ Search and filtering
- ✅ Multi-tenant isolation (schoolId scoping)

**In Progress:**
- 🚧 Marks entry interface
- 🚧 Grade boundaries (A+, A, B+, etc.)
- 🚧 Exam analytics dashboard

**Planned:**
- ⏸️ Exam hall assignment
- ⏸️ Invigilator scheduling
- ⏸️ Question paper upload
- ⏸️ Automated grade calculation
- ⏸️ Performance comparison (class average, median)

---

## Admin Workflows

### 1. Create a New Exam
**Prerequisites:** Classes, subjects, and term already configured

1. Navigate to `/exams`
2. Click "Create" button in toolbar
3. Fill in multi-step exam form:
   - **Step 1 - Basic Information**:
     - Exam title (e.g., "Mathematics Midterm Exam")
     - Description/instructions
     - Select class (e.g., Grade 10A)
     - Select subject (e.g., Mathematics)
   - **Step 2 - Schedule & Marks**:
     - Exam date (date picker)
     - Start time (e.g., 09:00 AM)
     - End time (e.g., 11:00 AM)
     - Duration (auto-calculated or manual, in minutes)
     - Total marks (e.g., 100)
     - Passing marks (e.g., 40)
     - Exam type (Midterm/Final/Quiz/Test/Practical)
   - **Step 3 - Instructions & Details**:
     - Exam instructions for students
     - Materials allowed (calculator, formula sheet, etc.)
     - Special notes
4. Click "Save"
5. System validates and creates exam
6. Exam status set to "PLANNED"
7. Success toast confirms creation

### 2. Bulk Create Exams for Multiple Classes
**Scenario:** Final exams for all Grade 10 sections (A, B, C, D)

1. Navigate to `/exams/bulk-create`
2. Configure exam template:
   - Subject: Mathematics
   - Exam type: Final
   - Date: 2025-06-15
   - Time: 09:00 - 11:00
   - Total marks: 100
   - Passing marks: 40
3. Select classes: Grade 10A, 10B, 10C, 10D
4. Click "Create for All Classes"
5. System creates 4 identical exams (one per class)
6. Review created exams in list

### 3. Schedule Exam Calendar
**View all exams on timeline:**

1. Navigate to `/exams/calendar`
2. View calendar with color-coded exams:
   - Green: Upcoming exams
   - Blue: In progress
   - Gray: Completed
   - Red: Cancelled
3. Filter by:
   - Class
   - Subject
   - Exam type
   - Date range
4. Click exam on calendar to view details
5. Identify scheduling conflicts (same class, same time)

### 4. Enter Exam Marks
**After exam is completed:**

1. Navigate to exam detail page
2. Click "Enter Marks" button
3. System shows class roster with all enrolled students
4. For each student, enter:
   - Marks obtained (e.g., 85 out of 100)
   - Grade (auto-calculated based on boundaries)
   - Remarks (optional: "Excellent", "Needs improvement")
5. Validation ensures marks ≤ total marks
6. Click "Save Marks"
7. System stores marks in `ExamResult` model
8. Students can now view their scores

**Bulk Marks Entry:**
- Import marks from CSV (studentId, marks)
- Copy-paste from spreadsheet
- Quick keyboard navigation (Tab between students)

### 5. Configure Grade Boundaries
**Define grading scale:**

1. Navigate to `/settings/grading`
2. Configure grade boundaries:
   - A+: 95-100
   - A: 90-94
   - B+: 85-89
   - B: 80-84
   - C+: 75-79
   - C: 70-74
   - D: 60-69
   - F: Below 60
3. Apply to all exams or per subject
4. System auto-calculates letter grades from numeric marks

### 6. View Exam Results and Analytics
**Class Performance Analysis:**

1. Navigate to exam detail page
2. View "Results" tab with statistics:
   - **Class Average**: 78.5/100
   - **Highest Score**: 98/100 (Student name)
   - **Lowest Score**: 45/100
   - **Median**: 80/100
   - **Pass Rate**: 85% (17 out of 20 passed)
   - **Grade Distribution**:
     - A: 3 students
     - B: 7 students
     - C: 5 students
     - D: 2 students
     - F: 3 students
3. Visual charts:
   - Bar chart: Grade distribution
   - Line chart: Score distribution
   - Pie chart: Pass/fail ratio

**Individual Student Performance:**
1. Navigate to student detail page
2. View "Exams" tab
3. See all exams with scores, grades, and trends
4. Identify strengths and weaknesses per subject

### 7. Export Exam Data
**Export Exam Schedule:**
1. Navigate to `/exams`
2. Apply filters (date range, class, subject)
3. Click "Export Schedule to PDF"
4. Generate printable exam timetable for distribution

**Export Exam Marks:**
1. Navigate to exam detail page
2. Click "Export Marks to CSV"
3. Download CSV with columns:
   - studentId, studentName, marksObtained, totalMarks, grade, percentage
4. Use for record-keeping or analysis

### 8. Manage Exam Status Workflow
**Status Transitions:**

- **PLANNED** → **IN_PROGRESS** → **COMPLETED**
- **PLANNED** → **CANCELLED** (if exam is postponed/cancelled)

**Update Status:**
1. Navigate to exam detail page
2. Click "Update Status" button
3. Select new status:
   - **In Progress**: Exam is currently being taken
   - **Completed**: Exam finished, marks can be entered
   - **Cancelled**: Exam postponed or cancelled
4. Add reason/notes (for cancelled exams)
5. Save
6. Students notified of status change

### 9. Assign Exam Hall and Invigilators (Future)
**Exam Logistics:**

1. Edit exam
2. Navigate to "Logistics" tab
3. Assign exam hall/room (e.g., Room 101)
4. Check room capacity vs. class size
5. Assign invigilators (teachers not teaching that class)
6. Set invigilator schedule (who supervises when)
7. Generate invigilator duty roster
8. Print seating arrangement

### 10. Search and Filter Exams
**Quick Search:**
1. Use search box in toolbar
2. Type exam title (partial match)
3. Results update as you type

**Advanced Filtering:**
1. Click "Class" dropdown → Select specific class
2. Click "Subject" dropdown → Select subject
3. Click "Exam Type" dropdown → Select midterm/final/quiz
4. Click "Status" dropdown → Select planned/completed
5. Click "Date" picker → Filter by exam date
6. Filters combine (AND logic)
7. URL updates with filter state (shareable)

---

## Integration with Other Features

### Links to Classes
- Exams assigned to specific classes
- All students in class take the exam
- Class roster used for marks entry
- Class performance analytics calculated

### Links to Subjects
- Exams linked to specific subjects
- Subject-wise performance tracking
- Subject teachers create exams
- Curriculum alignment per subject

### Links to Students
- Exam results stored per student
- Student profile shows exam history
- Performance trends across exams
- GPA calculation uses exam scores

### Links to Results
- Exam marks feed into gradebook
- Results aggregated for report cards
- GPA calculation includes exam scores
- Term-wise and year-wise performance

### Links to Teachers
- Teachers create exams for their subjects
- Teachers enter marks for their classes
- Teacher dashboard shows marking tasks
- Exam creation permissions per teacher

### Links to Timetable
- Exam schedule integrated with regular timetable
- Exam dates block regular class slots
- Conflict detection (no two exams same time for student)
- Exam hall availability checked

### Links to Announcements
- Exam schedule announcements sent to students/parents
- Reminders for upcoming exams
- Results publication announcements
- Important updates about exam changes

### Links to Dashboard
- Admin dashboard shows:
  - Upcoming exams count
  - Exams needing marks entry
  - Recently completed exams
- Student dashboard shows:
  - Next exam date and subject
  - Exam preparation countdown
  - Recent exam results

---

## Technical Implementation

### Files and Responsibilities

- **`content.tsx`**: Server component that renders exams table
- **`table.tsx`**: Client table with exams list
- **`columns.tsx`**: Column definitions for exams table
- **`form.tsx`**: Multi-step exam creation/edit form
- **`basic-information.tsx`**: Step 1 - Title, class, subject
- **`schedule-marks.tsx`**: Step 2 - Date, time, marks configuration
- **`instructions-details.tsx`**: Step 3 - Instructions and special notes
- **`footer.tsx`**: Form navigation and progress indicator
- **`actions.ts`**: Server actions for CRUD operations
- **`validation.ts`**: Zod schemas for exam data
- **`types.ts`**: TypeScript type definitions
- **`config.ts`**: Exam types and status enums
- **`list-params.ts`**: URL state management

### Server Actions

**`createExam(input)`**
- Input: `{ title, description, classId, subjectId, examDate, startTime, endTime, duration, totalMarks, passingMarks, examType, instructions }`
- Validates with `examCreateSchema`
- Creates exam with status "PLANNED"
- Scopes by `schoolId`
- Revalidates `/dashboard/exams`
- Returns `{ success: true, id }`

**`updateExam(input)`**
- Input: `{ id, ...fields to update }`
- Validates with `examUpdateSchema`
- Updates only provided fields
- Uses `updateMany` with schoolId filter for security
- Revalidates path
- Returns `{ success: true }`

**`deleteExam(input)`**
- Input: `{ id }`
- Uses `deleteMany` with schoolId filter
- Cascades to exam results (if configured)
- Revalidates path
- Returns `{ success: true }`

**`getExam(input)`**
- Input: `{ id }`
- Fetches single exam by id and schoolId
- Returns full exam object
- Used for detail page and edit form

**`getExams(input)`**
- Input: `{ title?, classId?, subjectId?, examType?, status?, examDate?, page, perPage, sort }`
- Supports filtering and pagination
- Joins with class and subject for display names
- Default sort: examDate desc, startTime asc
- Returns `{ rows, total }`

### Database Schema

```prisma
model Exam {
  id           String       @id @default(cuid())
  schoolId     String
  title        String
  description  String?
  classId      String
  subjectId    String
  examDate     DateTime
  startTime    String
  endTime      String
  duration     Int          // minutes
  totalMarks   Int
  passingMarks Int
  examType     ExamType
  instructions String?
  status       ExamStatus   @default(PLANNED)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  school       School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  class        Class        @relation(fields: [classId], references: [id])
  subject      Subject      @relation(fields: [subjectId], references: [id])
  results      ExamResult[]

  @@index([schoolId, examDate])
  @@index([schoolId, classId])
  @@index([schoolId, subjectId])
}

enum ExamType {
  MIDTERM
  FINAL
  QUIZ
  TEST
  PRACTICAL
}

enum ExamStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

### Multi-Tenant Safety

- All queries include `schoolId` from `getTenantContext()`
- Update and delete use `updateMany`/`deleteMany` with schoolId filter
- Prevents cross-tenant data access
- Foreign keys enforce referential integrity

### Validation

**Client-Side:**
- Title required, min 3 characters
- Class and subject selection required
- Exam date required
- Start/end times required
- Total marks > 0
- Passing marks ≤ total marks

**Server-Side:**
- `examCreateSchema` validates all fields
- Date parsing and normalization
- Status enum validation
- Exam type enum validation

---

## Usage

The component is used in the platform dashboard at `/dashboard/exams` and automatically handles:

- Multi-tenant data isolation (schoolId scoping)
- Multi-step form state management
- Server-side validation
- Optimistic updates
- Error handling with user-friendly messages

---

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components (DatePicker, Select, Input, Textarea)
- Next.js server actions for backend operations
- Prisma for database access

---

## Technology Stack & Dependencies

This feature is built with the following technologies (see [Platform README](../README.md) for complete stack details):

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
  revalidatePath('/feature-path')
  return { success: true }
}
```

### Key Features
- **Multi-Tenant Isolation**: All queries scoped by `schoolId`
- **Type Safety**: End-to-end TypeScript with Prisma + Zod inference
- **Server-Side Operations**: Mutations via Next.js Server Actions
- **URL State Management**: Filters and pagination synced to URL (where applicable)
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML

For complete technology documentation, see [Platform Technology Stack](../README.md#technology-stack--documentation).

---

## Future Enhancements

See `ISSUE.md` for detailed production readiness tracker and enhancement roadmap.
