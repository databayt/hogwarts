## Classes — Academic Class Management

**Admin Control Center for Class Organization**

The Classes feature empowers school administrators to organize students into grade sections, assign teachers and subjects, manage class schedules, and track enrollment with comprehensive class management tools.

### URLs Handled by This Block

| URL                                                      | Page             | Status         |
| -------------------------------------------------------- | ---------------- | -------------- |
| `/[lang]/s/[subdomain]/(platform)/classes`               | Class List       | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/classes/new`           | Create Class     | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/classes/[id]`          | Class Detail     | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/classes/[id]/edit`     | Edit Class       | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/classes/[id]/roster`   | Student Roster   | ✅ Ready       |
| `/[lang]/s/[subdomain]/(platform)/classes/[id]/teachers` | Subject Teachers | **🔴 BLOCKED** |
| `/[lang]/s/[subdomain]/(platform)/classes/[id]/schedule` | Timetable        | ✅ Ready       |

### What Admins Can Do

**Core Capabilities:**

- 📚 Create classes (grade sections like Grade 1A, Grade 2B)
- 👥 Assign students to classes (many-to-many enrollment)
- 👨‍🏫 Assign teachers to classes **← PARTIAL** (homeroom works, subject teachers incomplete)
- 🎯 Link classes to subjects
- 📅 Set class schedules (term, periods, classroom)
- 🏫 Manage classroom assignments
- 🔢 Track enrollment capacity and limits
- 📊 View class rosters and attendance
- 📁 Export class data to CSV
- 🔄 Batch operations for student enrollment

### What Teachers Can View

- ✅ View classes they are assigned to teach
- ✅ See complete student roster for their classes
- ✅ Access class schedule and timetable
- ✅ View class performance analytics
- ✅ Take attendance for their classes
- ❌ Cannot modify class structure (admin-only)

### What Students Can View

- ✅ See their own class assignment
- ✅ View classmates (optional based on school settings)
- ✅ Access class timetable
- ✅ See class announcements
- ❌ Cannot view other classes

### What Parents Can View

- ✅ View their child's class
- ✅ See class teachers and subjects
- ✅ Access class schedule
- ✅ View class announcements
- ❌ Cannot view full class roster (privacy)

### Current Implementation Status

**🔴 BLOCKED - Subject Teacher Assignment Incomplete**
**Completion:** 85%

---

## Critical Blocker: Teacher-Class Assignment

| Property          | Value                                               |
| ----------------- | --------------------------------------------------- |
| **URL**           | `/classes/[id]/teachers`                            |
| **Current State** | Homeroom teacher works, subject teachers incomplete |
| **Impact**        | Cannot assign specific subject teachers to classes  |

**What Works:**

- Homeroom teacher assignment via `teacherId` field
- Teacher dropdown in class form

**What's Missing:**

- `assignSubjectTeacher(classId, subjectId, teacherId)` server action
- `removeSubjectTeacher(classId, subjectId)` server action
- Teacher availability validation (conflict detection)
- Subject teacher management UI
- Multiple teachers per subject (co-teaching)

**Files to Create/Modify:**

- `src/components/platform/classes/subject-teachers.tsx` - UI component
- `src/components/platform/classes/actions.ts` - Add subject teacher actions

---

**Completed:**

- ✅ CRUD operations with validation
- ✅ Homeroom teacher assignment
- ✅ Student enrollment (many-to-many via StudentClass)
- ✅ Subject linking
- ✅ Capacity limits configuration
- ✅ Search and filtering (name, subject, teacher, term)
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Multi-step form (information → schedule)
- ✅ Timetable integration

**Blocked:**

- 🔴 **Subject teacher assignment** ← MVP blocker (homeroom only, not subject teachers)
- 🔴 Teacher availability validation

**In Progress:**

- 🚧 Class performance analytics
- 🚧 Attendance summary per class
- 🚧 Grade distribution charts

**Planned:**

- ⏸️ Seating arrangement management
- ⏸️ Class behavior tracking
- ⏸️ Parent-teacher communication per class
- ⏸️ Class resources and materials management

---

## Admin Workflows

### 1. Create a New Class

**Prerequisites:** Subjects, teachers, classrooms, and terms already configured

1. Navigate to `/classes`
2. Click "Create" button in toolbar
3. Fill in multi-step class form:
   - **Step 1 - Basic Information**:
     - Class name (e.g., Grade 1A, Year 2 Blue)
     - Select subject (e.g., Mathematics, English)
     - Assign homeroom teacher
     - Set capacity (max students)
   - **Step 2 - Schedule & Location**:
     - Select academic term
     - Choose start and end periods (daily schedule)
     - Assign physical classroom
4. Click "Save"
5. System validates and creates class
6. Success toast appears, table refreshes

### 2. Enroll Students in Class

**Prerequisites:** Students already created, class exists

**Single Student Enrollment:**

1. Navigate to student detail page
2. Click "Enroll in Class"
3. Select class from dropdown
4. Click "Enroll"
5. Student appears in class roster

**Bulk Enrollment:**

1. Navigate to class detail page
2. Click "Enroll Students"
3. Select multiple students from list (checkboxes)
4. Click "Enroll Selected"
5. System creates StudentClass relationships
6. Capacity validation (prevent over-enrollment)
7. Success message shows X students enrolled

**From Students List:**

1. Select multiple students via checkboxes
2. Click "Bulk Actions" → "Enroll in Class"
3. Choose target class
4. Confirm enrollment
5. All selected students added to class

### 3. Assign Teachers to Class

**Homeroom Teacher:**

1. Open class detail or edit form
2. Navigate to "Teacher Assignment" section
3. Select homeroom teacher from dropdown
4. Save changes
5. Teacher becomes primary contact for class

**Subject Teachers:**

1. Open class detail page
2. Scroll to "Subject Teachers" section
3. Click "Add Subject Teacher"
4. Select subject (e.g., Mathematics)
5. Select teacher from dropdown
6. Click "Assign"
7. Teacher can now teach that subject to this class

**Multiple Subjects:**

- Repeat for each subject the class studies
- A class typically has 5-10 different subject teachers
- System prevents duplicate subject assignments

### 4. Manage Class Capacity

**Set Capacity:**

1. Edit class
2. Update "Capacity" field (e.g., 30 students)
3. Save changes
4. System enforces limit during enrollment

**Capacity Indicators:**

- Class list shows enrollment count (e.g., 25/30)
- Visual indicators:
  - Green: < 80% capacity
  - Yellow: 80-100% capacity
  - Red: At capacity (full)
- Enrollment blocked when at capacity

**Increase Capacity:**

1. Edit class
2. Increase capacity number
3. Save
4. Additional students can now enroll

### 5. View Class Roster

1. Navigate to class detail page
2. View "Students" tab
3. See complete list of enrolled students:
   - Student names
   - Enrollment date
   - Status (active/inactive)
   - Quick links to student profiles
4. Click "Export Roster" for CSV download
5. Use for attendance sheets, seating charts, etc.

### 6. Manage Class Schedule

**View Schedule:**

1. Open class detail page
2. Click "Timetable" tab
3. See weekly schedule:
   - Days and periods
   - Subject per period
   - Teacher per period
   - Classroom assignments

**Modify Schedule:**

- Schedule managed via Timetable feature
- Conflicts detected automatically
- Changes update across students and teachers

### 7. Search and Filter Classes

**Quick Search:**

1. Use search box in toolbar
2. Type class name (e.g., "Grade 1")
3. Results update as you type

**Advanced Filtering:**

1. Click "Subject" dropdown → Select specific subject
2. Click "Teacher" dropdown → Filter by homeroom teacher
3. Click "Term" dropdown → Select academic term
4. Click "Status" dropdown → Active/Inactive
5. Filters combine (AND logic)
6. URL updates with filter state (shareable)

### 8. Update Class Information

**Edit Class:**

1. Find class in table
2. Click row actions (three dots)
3. Select "Edit"
4. Multi-step modal opens with pre-filled data
5. Update fields across both steps:
   - Basic info (name, subject, teacher, capacity)
   - Schedule (term, periods, classroom)
6. Click "Save"
7. System validates and updates

**Change Homeroom Teacher:**

1. Edit class
2. Select new teacher from dropdown
3. Save
4. New teacher gains access to class roster
5. Previous teacher retains access if teaching a subject

### 9. Transfer Students Between Classes

**Individual Transfer:**

1. Open student detail page
2. Navigate to "Class Enrollment" section
3. Click "Change Class"
4. Select new class
5. Confirm transfer
6. Student removed from old class, added to new class

**Bulk Transfer:**

1. Navigate to source class detail page
2. Select students to transfer (checkboxes)
3. Click "Transfer Students"
4. Select destination class
5. Confirm transfer
6. System validates capacity in destination class
7. Updates StudentClass relationships

### 10. Delete or Archive Class

**Archive Class (End of Term):**

1. Edit class
2. Change status to "Inactive" or "Archived"
3. Save
4. Class hidden from active lists
5. Historical data preserved
6. Students can still view past class in history

**Delete Class:**

1. Find class in table
2. Click row actions → "Delete"
3. Confirmation dialog warns:
   - X students will be unenrolled
   - Timetable slots will be removed
   - Historical data will be lost (if hard delete)
4. Confirm deletion
5. System cascades delete or soft-deletes
6. Success message appears

---

## Integration with Other Features

### Links to Students

- StudentClass many-to-many relationship
- Enrollment creates bidirectional link
- Students see their class on profile
- Class roster shows all enrolled students
- Capacity limits enforced during enrollment

### Links to Teachers

- Homeroom teacher assigned per class
- Subject teachers assigned per subject
- Teacher dashboard shows assigned classes
- Teacher timetable generated from class assignments
- Teachers access student rosters for their classes

### Links to Subjects

- Each class linked to primary subject (e.g., Math class)
- Subject teachers teach specific subjects to class
- Subject-specific assessments and assignments
- Curriculum mapping per subject

### Links to Timetable

- Class schedule defined in timetable slots
- Day/period/subject/teacher/classroom assignments
- Conflict detection prevents double-booking
- Students inherit class timetable
- Changes to timetable update class schedule

### Links to Classrooms

- Physical classroom assigned per class
- Classroom capacity vs. class size validation
- Classroom availability checked in timetable
- Classroom resources available to class

### Links to Attendance

- Attendance taken per class per period
- Class roster used for attendance marking
- Attendance summaries calculated per class
- Absence alerts sent to homeroom teacher

### Links to Assignments

- Assignments created for specific classes
- All students in class receive assignment
- Class-level grading and analytics
- Assignment completion rates per class

### Links to Exams

- Exams scheduled for classes
- All students in class take exam
- Class average and performance metrics
- Grade distribution per class

### Links to Announcements

- Announcements can target specific classes
- Class-specific notifications
- Important updates to class students and parents
- Homeroom teacher can create class announcements

### Links to Lessons

- Lesson plans created per class
- Subject-specific lesson content
- Class schedule determines lesson timing
- Lesson materials shared with class

---

## Technical Implementation

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the classes table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing classes
- `information.tsx` - First step form for basic information
- `schedule.tsx` - Second step form for schedule and location
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form

- **Step 1**: Basic Information (class name, subject, teacher)
- **Step 2**: Schedule & Location (term, start/end periods, classroom)

### Data Management

- Create new classes
- Edit existing classes
- Delete classes
- View class details
- Search and filter by name, subject, teacher, and term

### Validation

- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping

### Table Features

- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Delete)

## Database Schema

Classes are stored with the following fields:

- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `name` - Class name
- `subjectId` - Associated subject
- `teacherId` - Assigned teacher
- `termId` - Academic term
- `startPeriodId` - Start period
- `endPeriodId` - End period
- `classroomId` - Physical classroom
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/classes` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Multi-step form navigation

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations

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
