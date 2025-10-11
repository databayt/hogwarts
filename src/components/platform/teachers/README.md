## Teachers — Faculty Management

**Admin Control Center for Teacher Records**

The Teachers feature empowers school administrators to manage teaching staff from hiring to assignment, with comprehensive record-keeping, bulk operations, and class/subject assignments.

### What Admins Can Do

**Core Capabilities:**
- 👨‍🏫 Add teachers individually or bulk import via CSV
- 📋 View and manage complete faculty roster with advanced filters
- 🔍 Search by name, email, department, subject specialization
- 📝 Update teacher information (contact, qualifications, assignments)
- 🏢 Assign teachers to departments
- 📚 Assign teachers to classes and subjects
- 📊 Track employment status (active, on leave, terminated)
- 📁 Export teacher data to CSV for reporting
- 🔄 Batch operations for department and subject assignments
- 📈 View teaching load and schedule

### What Teachers Can View
- ✅ View their own profile and contact information
- ✅ See their assigned classes and subjects
- ✅ Access their teaching schedule (timetable)
- ✅ View student rosters for their classes
- ✅ Update their own contact details
- ❌ Cannot view other teachers' information (unless admin)

### What Students Can View
- ✅ See their teachers' names and subjects
- ✅ View teacher contact information (school email)
- ❌ Cannot view teacher personal details

### What Parents Can View
- ✅ See their child's teachers
- ✅ View teacher names and subjects taught
- ✅ Access teacher contact information for communication
- ❌ Cannot view teacher employment details

### Current Implementation Status
**Production-Ready MVP ✅**

**Completed:**
- ✅ CRUD operations with validation
- ✅ CSV bulk import with error reporting
- ✅ Department assignments (TeacherDepartment)
- ✅ Class and subject assignments
- ✅ Contact information management
- ✅ Search and filtering (name, email, status)
- ✅ Export to CSV
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Multi-step form (information → contact)

**In Progress:**
- 🚧 Qualification tracking (degrees, certifications)
- 🚧 Performance reviews management
- 🚧 Teaching load analytics

**Planned:**
- ⏸️ Document attachments (resume, certificates)
- ⏸️ Professional development tracking
- ⏸️ Attendance and leave management
- ⏸️ Performance evaluation system

---

## Admin Workflows

### 1. Add a Single Teacher
**Prerequisites:** Departments and subjects already configured

1. Navigate to `/teachers`
2. Click "Create" button in toolbar
3. Fill in multi-step teacher form:
   - **Step 1 - Basic Information**:
     - Given name, surname
     - Gender (male/female)
   - **Step 2 - Contact Details**:
     - Email address (school email)
     - Phone number (optional)
4. Click "Save"
5. System validates and creates teacher record
6. Success toast appears, table refreshes automatically

### 2. Bulk Import Teachers via CSV
**Prerequisites:** CSV file with proper column format

1. Navigate to `/import`
2. Download CSV template for teachers
3. Fill template with teacher data:
   - Columns: `givenName`, `surname`, `gender`, `emailAddress`, `phone`, `department`, `subjects`
4. Upload completed CSV file
5. System validates each row:
   - Checks required fields (name, email)
   - Validates email format
   - Ensures unique email per tenant
6. Review error report if validation fails
7. Click "Import" to confirm
8. System creates all valid teachers
9. Summary shows: X created, Y errors

### 3. Assign Teacher to Department
**Prerequisites:** Departments created in settings

1. Open teacher detail page or edit modal
2. Navigate to "Departments" section
3. Click "Add Department"
4. Select department from dropdown
5. Optionally set as department head
6. Click "Assign"
7. Teacher appears in department roster

**Bulk Department Assignment:**
1. Select multiple teachers via checkboxes
2. Click "Bulk Actions" → "Assign to Department"
3. Choose target department
4. Confirm assignment
5. All selected teachers added to department

### 4. Assign Teacher to Classes and Subjects
**Single Assignment:**
1. Navigate to class detail page
2. Click "Assign Teacher"
3. Select subject to teach
4. Select teacher from dropdown
5. Confirm assignment
6. Teacher assigned as subject teacher for that class

**From Teacher Profile:**
1. Open teacher detail page
2. Navigate to "Class Assignments" section
3. Click "Add Assignment"
4. Select class and subject
5. Click "Assign"
6. Assignment appears in teacher's schedule

**Teaching Load View:**
- Displays number of classes and subjects per teacher
- Shows total teaching periods per week
- Highlights overloaded teachers
- Helps balance workload distribution

### 5. Search and Filter Teachers
**Quick Search:**
1. Use search box in toolbar
2. Type teacher name or email (partial match)
3. Results update as you type

**Advanced Filtering:**
1. Click "Status" dropdown → Select active/on leave/terminated
2. Click "Department" dropdown → Select specific department
3. Click "Subject" dropdown → Filter by subject specialization
4. Click "View" → Toggle column visibility
5. Filters combine (AND logic)
6. URL updates with filter state (shareable link)

### 6. Update Teacher Information
**Method A: Edit via Modal**
1. Find teacher in table
2. Click row actions (three dots)
3. Select "Edit"
4. Multi-step modal opens with pre-filled form
5. Update fields as needed (across both steps)
6. Click "Save"
7. System validates and updates record

**Method B: Detail Page**
1. Click "View" on teacher row
2. Navigate to `/teachers/[id]`
3. Click "Edit" button
4. Update information
5. Click "Save"

### 7. View Teacher Schedule and Load
1. Open teacher detail page
2. View "Teaching Schedule" section:
   - Weekly timetable showing all assigned classes
   - Period-by-period breakdown
   - Free periods highlighted
3. View "Teaching Load" summary:
   - Total periods per week
   - Number of different classes
   - Number of different subjects
   - Contact hours calculation

### 8. Export Teacher Data
1. Apply desired filters (department, status, subject)
2. Click "Export" button
3. Select export format (CSV)
4. Choose columns to include
5. Download file
6. Use for HR reports, payroll, or external systems

### 9. Track Employment Status
**Status Options:**
- **Active**: Currently teaching
- **On Leave**: Temporarily absent (sick leave, maternity, sabbatical)
- **Terminated**: No longer employed
- **Retired**: Completed service
- **Contract Ended**: Fixed-term contract expired

**Change Status:**
1. Edit teacher record
2. Update "Status" field
3. Add status change notes (reason, effective date)
4. Save
5. System logs status change with timestamp
6. Historical record preserved for audit

---

## Integration with Other Features

### Links to Classes
- Teacher assignments create Class-Teacher relationships
- Each class can have multiple subject teachers
- Homeroom teacher designation available
- Class roster accessible to assigned teachers

### Links to Subjects
- Teachers marked as subject specialists
- Subject assignment during class allocation
- Qualification matching for subject teaching
- Subject-based performance tracking

### Links to Timetable
- Teacher schedule generated from timetable slots
- Conflict detection prevents double-booking
- Free periods identified for meetings
- Teaching load calculated from timetable
- Teacher view shows weekly teaching schedule

### Links to Departments
- TeacherDepartment many-to-many relationship
- Department head designation
- Department meetings and coordination
- Resource sharing within departments

### Links to Attendance
- Teacher attendance tracking (separate from student attendance)
- Leave management integration
- Substitute teacher assignment when absent
- Attendance reports for HR

### Links to Lessons
- Teachers create lesson plans for their classes
- Lesson content linked to assigned subjects
- Curriculum mapping per teacher
- Teaching resources management

### Links to Exams
- Teachers create exams for their subjects
- Grade entry for assigned classes
- Exam scheduling coordination
- Marks moderation per department

### Links to Assignments
- Teachers create assignments for their classes
- Grading interface for submissions
- Assignment analytics per teacher
- Workload distribution monitoring

---

## Technical Implementation

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the teachers table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing teachers
- `information.tsx` - First step form for basic information
- `contact.tsx` - Second step form for contact details
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Basic Information (names, gender)
- **Step 2**: Contact Details (email address)

### Data Management
- Create new teachers
- Edit existing teachers
- Delete teachers
- View teacher details
- Search and filter by name, email, and status

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

Teachers are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `givenName` - First name
- `surname` - Last name
- `gender` - Gender (male/female, optional)
- `emailAddress` - Email address (unique per school)
- `userId` - Associated user account (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/teachers` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling

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
