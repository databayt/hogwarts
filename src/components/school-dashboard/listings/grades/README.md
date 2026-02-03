## Results — Gradebook and Academic Performance

**Admin Control Center for Grade Management and Reporting**

The Results feature provides a comprehensive gradebook where teachers and administrators track student performance, calculate GPAs, generate report cards, and analyze academic trends across assignments and exams.

### URLs Handled by This Block

| URL                                                    | Page         | Status         |
| ------------------------------------------------------ | ------------ | -------------- |
| `/[lang]/s/[subdomain]/(platform)/grades`              | Gradebook    | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/grades/report-cards` | Report Cards | 🚧 In Progress |

**Status:** ✅ Production-Ready MVP (75%)
**Last Updated:** 2025-12-14

### What Admins Can Do

**Core Capabilities:**

- 📊 View school-wide gradebook
- 📈 Calculate term and year GPAs
- 📑 Generate report cards
- 🔍 Analyze academic trends
- 📁 Export grades to CSV
- 📧 Send report cards to parents
- 🏆 Identify honor roll students
- 📉 Track at-risk students

### What Teachers Can Do

- ✅ Enter grades for their classes
- ✅ View gradebook for assigned classes
- ✅ Calculate class averages
- ✅ Provide feedback per assignment/exam
- ✅ Track student progress over time
- ✅ Export class grades
- ❌ Cannot view other teachers' gradebooks

### What Students Can View

- ✅ View their own grades
- ✅ See GPA calculation
- ✅ View feedback from teachers
- ✅ Track progress over term
- ❌ Cannot view other students' grades

### What Parents Can View

- ✅ View their child's grades
- ✅ See GPA and class rank
- ✅ Download report cards
- ✅ View teacher feedback
- ❌ Cannot view full class gradebook

### Current Implementation Status

**Production-Ready MVP ✅**

**Completed:**

- ✅ CRUD operations with validation
- ✅ Multi-step form (student/assignment → grading)
- ✅ Grade entry (score, max score, letter grade)
- ✅ Percentage auto-calculation
- ✅ Teacher feedback field
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Integration with assignments and exams

**In Progress:**

- 🚧 GPA calculation
- 🚧 Report card generation
- 🚧 Grade boundaries configuration

**Planned:**

- ⏸️ Automated report card distribution
- ⏸️ Progress reports mid-term
- ⏸️ Academic probation tracking
- ⏸️ Honor roll identification

---

## Admin Workflows

### 1. Enter Grades for Assignment

**After students complete an assignment:**

1. Navigate to assignment detail page
2. Click "Enter Grades" button
3. View class roster with grade entry fields
4. For each student, enter:
   - Score obtained (e.g., 85 out of 100)
   - Letter grade (A, B, C, etc.) - auto-calculated or manual
   - Feedback comments
5. Click "Save All Grades"
6. System creates Result records
7. Students can view their grades

### 2. View Gradebook for Class

**Comprehensive grade overview:**

1. Navigate to `/results`
2. Select class from dropdown
3. View gradebook table showing:
   - Student names (rows)
   - Assignments/Exams (columns)
   - Grades in each cell
   - Class averages (bottom row)
   - Student averages (right column)
4. Sort by student name or average
5. Filter by assignment type

### 3. Calculate GPA

**Term and cumulative GPA:**

1. Navigate to student detail page
2. View "Academic Performance" tab
3. See GPA calculation:
   - **Term GPA**: Average of current term grades
   - **Cumulative GPA**: Average across all terms
   - **Weighted GPA**: Honors/AP courses weighted higher
4. GPA scale: 4.0 (A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.0)
5. Grade boundaries configurable per school

### 4. Generate Report Cards

**End of term reporting:**

1. Navigate to `/results/report-cards`
2. Select term and grade level
3. Configure report card template:
   - School logo and header
   - Student information
   - Grades per subject
   - GPA and class rank
   - Teacher comments
   - Attendance summary
4. Click "Generate for All Students"
5. System creates PDF report cards
6. Download ZIP file or email to parents

### 5. Analyze Academic Trends

**Performance analytics:**

1. Navigate to `/results/analytics`
2. View charts:
   - **Grade Distribution**: Histogram showing A/B/C/D/F counts
   - **Performance Trends**: Line chart showing averages over time
   - **Subject Comparison**: Which subjects have highest/lowest averages
   - **Student Rankings**: Top 10 performers
3. Filter by class, subject, or time period
4. Export charts to PDF

### 6. Identify Honor Roll Students

**Academic recognition:**

1. Navigate to `/results/honor-roll`
2. Configure criteria:
   - **High Honor Roll**: GPA ≥ 3.75
   - **Honor Roll**: GPA ≥ 3.25
3. System generates list of qualifying students
4. Export list to CSV
5. Generate certificates
6. Send notifications to students and parents

### 7. Track At-Risk Students

**Early intervention:**

1. Navigate to `/results/at-risk`
2. System identifies students with:
   - GPA < 2.0
   - Multiple failing grades (F)
   - Significant grade drops
3. View student list with risk factors
4. Click student to see detailed performance
5. Initiate intervention:
   - Schedule parent meeting
   - Assign tutoring
   - Academic probation status
6. Track intervention outcomes

### 8. Export Grades to CSV

**Data portability:**

1. Navigate to `/results`
2. Apply filters (class, term, date range)
3. Click "Export to CSV"
4. Download file with columns:
   - studentId, studentName, assignment, score, maxScore, percentage, grade, feedback
5. Use for external analysis or record-keeping

### 9. Provide Teacher Feedback

**Qualitative assessment:**

1. When entering grades, add feedback:
   - "Excellent work! Clear understanding of concepts."
   - "Needs improvement on problem-solving."
   - "Great progress since last assignment."
2. Feedback visible to:
   - Student (in their grade view)
   - Parents (in parent portal)
   - Counselors (for intervention)
3. Feedback tracked historically

### 10. Configure Grade Boundaries

**School-specific grading scale:**

1. Navigate to `/settings/grading`
2. Configure percentage to grade mapping:
   - A+: 97-100%
   - A: 93-96%
   - A-: 90-92%
   - B+: 87-89%
   - B: 83-86%
   - B-: 80-82%
   - (continue for all grades)
3. Configure GPA weights:
   - Regular: A = 4.0
   - Honors: A = 4.5
   - AP/IB: A = 5.0
4. Save and apply to all future grades

---

## Integration with Other Features

### Links to Assignments

- Results store grades for assignments
- Weighted average calculation uses assignment weights
- Assignment completion feeds into final grade

### Links to Exams

- Exam scores stored as results
- Exams typically weighted higher than homework
- Exam analytics show class performance

### Links to Students

- Student profile shows complete grade history
- GPA calculated and displayed
- Academic standing tracked

### Links to Classes

- Gradebook organized by class
- Class averages calculated
- Class performance compared across subjects

### Links to Teachers

- Teachers grade their assigned classes
- Grading workload tracked
- Teacher effectiveness metrics

### Links to Subjects

- Subject-wise performance tracking
- Subject averages across school
- Curriculum effectiveness analysis

### Links to Dashboard

- Teacher dashboard shows grading tasks
- Student dashboard shows recent grades
- Admin dashboard shows school-wide statistics

### Links to Announcements

- Grade publication announcements
- Report card distribution notifications
- Honor roll announcements

### Links to Parent Portal

- Parents view child's grades
- Report card downloads
- Grade alerts and notifications

---

## Technical Implementation

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the results table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing results
- `student-assignment.tsx` - First step form for student and assignment selection
- `grading.tsx` - Second step form for grading and feedback
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form

- **Step 1**: Student & Assignment Selection (student, assignment, class)
- **Step 2**: Grading & Feedback (score, max score, grade, feedback)

### Data Management

- Create new results
- Edit existing results
- Delete results
- View result details
- Search and filter by student, assignment, class, and grade

### Validation

- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping
- Custom validation ensuring score cannot exceed max score
- Auto-calculation of percentage based on score and max score

### Table Features

- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Delete)
- Percentage display with proper formatting

## Database Schema

Results are stored with the following fields:

- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `studentId` - Associated student
- `assignmentId` - Associated assignment
- `classId` - Associated class
- `score` - Student's score
- `maxScore` - Maximum possible score
- `percentage` - Calculated percentage (score/maxScore \* 100)
- `grade` - Letter grade (A+, A, A-, B+, B, B-, etc.)
- `feedback` - Teacher feedback for the student
- `submittedAt` - When the assignment was submitted
- `gradedAt` - When the result was graded
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Grade Options

The component supports the following grade options:

- A+, A, A-
- B+, B, B-
- C+, C, C-
- D+, D, D-
- F

## Smart Features

### Auto-population

- `maxScore` is automatically populated from the selected assignment's total points
- `percentage` is automatically calculated when score or maxScore changes

### Data Integration

- Integrates with existing Students, Classes, and Assignments components
- Fetches related data for display in the table
- Maintains referential integrity across the system

## Usage

The component is used in the platform dashboard at `/dashboard/results` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Multi-step form navigation
- Automatic percentage calculation
- Grade assignment with predefined options

## Dependencies

- React Hook Form for form management
- Zod for validation with custom refinements
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations
- Integration with existing Students, Classes, and Assignments components

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
