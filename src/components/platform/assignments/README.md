## Assignments — Homework and Task Management

**Admin Control Center for Assignment Creation and Grading**

The Assignments feature empowers teachers and administrators to create homework, projects, and tasks, manage submissions, grade student work, and track completion rates with comprehensive assignment lifecycle management.

### What Admins Can Do

**Core Capabilities:**

- 📝 Create assignments for any class
- 📚 Assign homework, quizzes, projects, essays
- 📅 Set due dates and deadlines
- 📊 Configure points and grading weights
- 🔍 View all assignments across school
- 📁 Export assignment data to CSV
- 📈 Monitor completion rates
- 🔄 Bulk assignment creation

### What Teachers Can Do

- ✅ Create assignments for their classes
- ✅ Set assignment types (homework, quiz, project, etc.)
- ✅ Define due dates and point values
- ✅ Add instructions and attachments
- ✅ Grade student submissions
- ✅ View submission status
- ✅ Export grades to CSV
- ✅ Track completion rates
- ❌ Cannot modify other teachers' assignments

### What Students Can View

- ✅ View their assigned homework/tasks
- ✅ See assignment details and instructions
- ✅ View due dates and deadlines
- ✅ Submit assignments (future)
- ✅ View their grades and feedback
- ✅ Track completion status
- ❌ Cannot view other students' submissions

### What Parents Can View

- ✅ View their child's assignments
- ✅ See due dates and requirements
- ✅ View submission status
- ✅ See grades and feedback
- ❌ Cannot submit on behalf of student

### Current Implementation Status

**Production-Ready MVP ✅**

**Completed:**

- ✅ CRUD operations with validation
- ✅ Multi-step form (information → details)
- ✅ Assignment types (HOMEWORK, QUIZ, TEST, MIDTERM, FINAL, PROJECT, LAB_REPORT, ESSAY, PRESENTATION)
- ✅ Due date management
- ✅ Points and weight configuration
- ✅ Class targeting
- ✅ Search and filtering
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Status management (DRAFT, PUBLISHED)

**In Progress:**

- 🚧 Submission tracking
- 🚧 Grading interface
- 🚧 File attachments

**Planned:**

- ⏸️ Student submission portal
- ⏸️ Late submission policies
- ⏸️ Rubrics and marking guides
- ⏸️ Peer review functionality
- ⏸️ Plagiarism detection

---

## Admin Workflows

### 1. Create a New Assignment

**Prerequisites:** Classes and students already configured

1. Navigate to `/assignments`
2. Click "Create" button in toolbar
3. Fill in multi-step assignment form:
   - **Step 1 - Basic Information**:
     - Title (e.g., "Chapter 5 Math Problems")
     - Description (overview of assignment)
     - Select class (e.g., Grade 10A)
   - **Step 2 - Details & Settings**:
     - Assignment type (Homework/Quiz/Project/etc.)
     - Total points (e.g., 100)
     - Weight (% of final grade, e.g., 10%)
     - Due date (date picker)
     - Instructions (detailed requirements)
4. Click "Save as Draft" or "Publish"
5. System creates assignment
6. Students in class can now view assignment

### 2. Assignment Type Selection

**Different types for different purposes:**

- **Homework**: Daily practice assignments
- **Quiz**: Short assessments (10-20 minutes)
- **Test**: In-class assessments (30-60 minutes)
- **Midterm**: Mid-term examinations
- **Final Exam**: End-of-term examinations
- **Project**: Long-term research/creative work
- **Lab Report**: Science laboratory write-ups
- **Essay**: Writing assignments
- **Presentation**: Oral presentations

Each type can have different:

- Default point values
- Grading criteria
- Submission requirements

### 3. Set Due Dates and Deadlines

**Flexible deadline management:**

1. Set primary due date (when assignment is due)
2. Optional: Set late submission cutoff date
3. System shows:
   - Days until due (e.g., "Due in 3 days")
   - Overdue status (e.g., "2 days overdue")
4. Color coding:
   - Green: Due in 3+ days
   - Yellow: Due in 1-2 days
   - Red: Overdue

### 4. Configure Points and Grading Weight

**Marking scheme configuration:**

**Points:**

- Set total points (e.g., 100 points)
- Students graded out of this total
- Can vary by assignment type

**Weight:**

- Set percentage of final grade (e.g., 10%)
- Sum of all assignment weights should = 100%
- Example grading scheme:
  - Homework: 20% (multiple assignments)
  - Quizzes: 20% (multiple quizzes)
  - Midterm: 25%
  - Final: 35%

### 5. Grade Student Submissions (Future)

**After students submit work:**

1. Navigate to assignment detail page
2. Click "Grade Submissions" button
3. View submission list:
   - Student name
   - Submission date/time
   - Status (submitted/late/missing)
   - Attached files
4. For each submission:
   - View student work
   - Enter points earned (e.g., 85/100)
   - Add feedback comments
   - Mark as graded
5. Click "Save Grades"
6. Students receive notification of grade

**Bulk Grading:**

- Grade multiple submissions at once
- Apply same feedback to multiple students
- Import grades from spreadsheet

### 6. Track Submission Status

**Monitor student progress:**

1. Navigate to assignment detail page
2. View "Submissions" tab
3. See submission statistics:
   - **Submitted**: 18/25 students (72%)
   - **Not Submitted**: 7 students
   - **Late Submissions**: 3 students
   - **Average Grade**: 82/100
4. Color-coded status:
   - Green: Submitted on time
   - Yellow: Submitted late
   - Red: Not submitted (missing)
5. Identify students who need reminders

### 7. View Assignment Analytics

**Performance insights:**

1. Navigate to assignment detail page
2. View "Analytics" tab
3. See statistics:
   - **Class Average**: 82.5/100
   - **Highest Score**: 98/100
   - **Lowest Score**: 45/100
   - **Median**: 85/100
   - **Completion Rate**: 90% (18/20 submitted)
4. Visual charts:
   - Bar chart: Grade distribution
   - Pie chart: Submission status
   - Line chart: Performance trends

### 8. Search and Filter Assignments

**Quick Search:**

1. Use search box in toolbar
2. Type assignment title (partial match)
3. Results update as you type

**Advanced Filtering:**

1. Click "Type" dropdown → Select homework/quiz/project
2. Click "Class" dropdown → Select specific class
3. Click "Status" dropdown → Select draft/published
4. Date range: Assignments due between X and Y
5. Filters combine (AND logic)
6. URL updates with filter state

### 9. Export Assignment Data

**For Record-Keeping:**

1. Navigate to `/assignments`
2. Apply desired filters
3. Click "Export to CSV"
4. Download CSV with columns:
   - assignmentId, title, type, class, dueDate, totalPoints, weight, status
5. Use for analysis or reporting

**Export Grades:**

1. Navigate to assignment detail page
2. Click "Export Grades"
3. CSV includes:
   - studentId, studentName, pointsEarned, totalPoints, percentage, submissionDate, status
4. Import into gradebook software

### 10. Manage Draft vs. Published Status

**Publishing workflow:**

**Draft Status:**

- Assignment created but not visible to students
- Teachers can edit without affecting students
- Use for preparation and review

**Published Status:**

- Assignment visible to students
- Students can begin working
- Editing discouraged (students already started)

**Workflow:**

1. Create assignment as DRAFT
2. Review details and instructions
3. Click "Publish" button
4. Confirmation dialog warns: "Students will be notified"
5. Confirm publication
6. Students receive notification
7. Assignment appears in student dashboard

**Unpublish (Recall):**

- Revert to DRAFT if published by mistake
- Only allowed if no submissions yet

---

## Integration with Other Features

### Links to Classes

- Assignments targeted to specific classes
- All students in class receive assignment
- Class roster used for grading interface
- Class performance analytics

### Links to Students

- Students view their assignments in dashboard
- Assignment completion tracked per student
- Grades feed into student gradebook
- Missing assignment alerts

### Links to Results

- Assignment grades contribute to final grade
- Weighted average calculation
- GPA impact based on weight
- Report card generation

### Links to Teachers

- Teachers create assignments for their classes
- Assignment creation limited to subject teachers
- Grading workload distribution
- Assignment templates per teacher

### Links to Subjects

- Assignments linked to subjects
- Subject-specific assignment types
- Curriculum alignment
- Subject performance tracking

### Links to Dashboard

- Teacher dashboard shows:
  - Assignments needing grading
  - Recently created assignments
  - Upcoming due dates
- Student dashboard shows:
  - Upcoming assignments
  - Overdue assignments
  - Recent grades

### Links to Announcements

- Assignment creation sends announcement
- Due date reminders
- Grade publication notifications
- Missing assignment alerts

### Links to Calendar/Events

- Assignment due dates appear on calendar
- Deadline reminders
- Workload visualization
- Conflict detection (multiple assignments same day)

---

## Technical Implementation

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the assignments table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing assignments
- `information.tsx` - First step form for basic information
- `details.tsx` - Second step form for details and settings
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form

- **Step 1**: Basic Information (title, description, class)
- **Step 2**: Details & Settings (type, points, weight, due date, instructions)

### Data Management

- Create new assignments
- Edit existing assignments
- Delete assignments
- View assignment details
- Search and filter by title, type, and class

### Validation

- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping
- Date validation (due date cannot be in the past)

### Table Features

- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Delete)

## Database Schema

Assignments are stored with the following fields:

- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `title` - Assignment title
- `description` - Assignment description
- `classId` - Associated class
- `type` - Assignment type (HOMEWORK, QUIZ, TEST, etc.)
- `totalPoints` - Total possible points
- `weight` - Weight percentage for grading
- `dueDate` - Assignment due date
- `instructions` - Assignment instructions
- `status` - Assignment status (DRAFT, PUBLISHED, etc.)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Assignment Types

The component supports the following assignment types:

- Homework
- Quiz
- Test
- Midterm
- Final Exam
- Project
- Lab Report
- Essay
- Presentation

## Usage

The component is used in the platform dashboard at `/dashboard/assignments` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Multi-step form navigation
- Date picker for due dates
- Numeric input validation for points and weight

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations
- date-fns for date formatting

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

For complete technology documentation, see [Platform Technology Stack](../README.md#technology-stack--documentation).

---
