## Students — Student Information Management

**Admin Control Center for Student Records**

The Students feature empowers school administrators to manage the complete student lifecycle from enrollment to graduation with comprehensive record-keeping, bulk operations, and class assignments.

### What Admins Can Do

**Core Capabilities:**

- 👨‍🎓 Add students individually or bulk import via CSV
- 📋 View and manage complete student roster with advanced filters
- 🔍 Search by name, status, class, enrollment date
- 📝 Update student information (contact, guardian, class assignment)
- 👪 Link students to guardian/parent accounts
- 📊 Track enrollment status (active, inactive, graduated, transferred)
- 📁 Export student data to CSV for reporting
- 🔄 Batch operations for class assignments and status updates
- 📚 View academic history and class enrollment

### What Teachers Can View

- ✅ See students enrolled in their classes
- ✅ Access student contact information
- ✅ View guardian details for communication
- ❌ Cannot modify student records (read-only access)

### What Students Can View

- ✅ View their own profile information
- ✅ See their class enrollment
- ✅ Access their academic schedule
- ❌ Cannot view other students' information

### What Parents Can View

- ✅ View their child's profile
- ✅ See class assignments and teachers
- ✅ Access academic performance
- ✅ Update emergency contact information
- ❌ Cannot view other students

### Current Implementation Status

**Status:** 75% Complete | **Blocker:** Guardian Linking

### URLs Handled by This Block

| URL                                                     | Page           | Status      |
| ------------------------------------------------------- | -------------- | ----------- |
| `/[lang]/s/[subdomain]/(platform)/students`             | Students List  | Ready       |
| `/[lang]/s/[subdomain]/(platform)/students/manage`      | Manage         | Ready       |
| `/[lang]/s/[subdomain]/(platform)/students/enroll`      | Enroll         | Ready       |
| `/[lang]/s/[subdomain]/(platform)/students/settings`    | Settings       | In Progress |
| `/[lang]/s/[subdomain]/(platform)/students/performance` | Performance    | In Progress |
| `/[lang]/s/[subdomain]/(platform)/students/analysis`    | Analysis       | In Progress |
| `/[lang]/s/[subdomain]/(platform)/students/reports`     | Reports        | In Progress |
| `/[lang]/s/[subdomain]/(platform)/students/guardians`   | Guardians      | **BLOCKED** |
| `/[lang]/s/[subdomain]/(platform)/students/[id]`        | Student Detail | **BLOCKED** |
| `/[lang]/s/[subdomain]/(platform)/students/year-levels` | Year Levels    | Ready       |

### Critical Blocker: Guardian Linking

**Status:** NOT FUNCTIONAL - UI exists, no server actions
**Impact:** Cannot link parents to students in platform
**Location:** `src/components/platform/students/guardian-tab/`

**Fix Required:**

- Create `linkGuardian` server action
- Create `unlinkGuardian` server action
- Wire Add Guardian modal to server actions
- Implement Edit/Delete guardian operations
- Remove hardcoded mockup data

**Completed:**

- ✅ CRUD operations with validation
- ✅ CSV bulk import with error reporting
- ✅ Class enrollment management (many-to-many)
- ✅ Search and filtering (name, status, class)
- ✅ Export to CSV
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Server-side pagination and sorting
- ✅ Modal-based create/edit forms

**Blocked:**

- ❌ Guardian relationships linking (UI only, no server actions)
- ❌ Guardian tab on student detail page

**In Progress:**

- 🚧 Academic history tracking
- 🚧 Photo upload and management
- 🚧 Document attachments (birth certificate, etc.)

**Planned:**

- ⏸️ Transfer between schools
- ⏸️ Health records integration
- ⏸️ Attendance summary per student
- ⏸️ Grade progression tracking

---

## Admin Workflows

### 1. Add a Single Student

**Prerequisites:** School year and classes already configured

1. Navigate to `/students`
2. Click "Create" button in toolbar
3. Fill in student information form:
   - **Personal Info**: Given name, surname, date of birth, gender
   - **Contact**: Email, phone number
   - **Enrollment**: Enrollment date, status (active/inactive)
   - **Class Assignment**: Select class from dropdown
4. Click "Save"
5. System validates and creates student record
6. Success toast appears, table refreshes automatically

### 2. Bulk Import Students via CSV

**Prerequisites:** CSV file with proper column format

1. Navigate to `/import`
2. Download CSV template
3. Fill template with student data:
   - Columns: `givenName`, `surname`, `dateOfBirth`, `gender`, `email`, `phone`, `enrollmentDate`, `status`, `className`
4. Upload completed CSV file
5. System validates each row:
   - Checks required fields
   - Validates date formats
   - Ensures unique email per tenant
6. Review error report if validation fails
7. Click "Import" to confirm
8. System creates all valid students
9. Summary shows: X created, Y errors

### 3. Search and Filter Students

**Quick Search:**

1. Use search box in toolbar
2. Type student name (partial match)
3. Results update as you type

**Advanced Filtering:**

1. Click "Status" dropdown → Select active/inactive/graduated
2. Click "Class" dropdown → Select specific class
3. Click "View" → Toggle column visibility
4. Filters combine (AND logic)
5. URL updates with filter state (shareable link)

### 4. Update Student Information

**Method A: Edit via Modal**

1. Find student in table
2. Click row actions (three dots)
3. Select "Edit"
4. Modal opens with pre-filled form
5. Update fields as needed
6. Click "Save"
7. System validates and updates record

**Method B: Detail Page**

1. Click "View" on student row
2. Navigate to `/students/[id]`
3. Click "Edit" button
4. Update information
5. Click "Save"

### 5. Link Student to Guardian

**Prerequisites:** Parent/guardian account already created

1. Open student detail page (`/students/[id]`)
2. Scroll to "Guardians" section
3. Click "Add Guardian"
4. Select guardian from dropdown (or create new)
5. Specify relationship (mother, father, legal guardian, other)
6. Click "Link"
7. Guardian gains access to student information via parent portal

### 6. Manage Class Enrollment

**Assign to Class:**

1. Open student detail or edit modal
2. Select class from "Class Assignment" dropdown
3. Save changes
4. Student appears in class roster
5. Teachers of that class gain view access

**Bulk Class Assignment:**

1. Select multiple students via checkboxes
2. Click "Bulk Actions" → "Assign to Class"
3. Choose target class
4. Confirm assignment
5. All selected students enrolled in class

### 7. Export Student Data

1. Apply desired filters (status, class, date range)
2. Click "Export" button
3. Select export format (CSV)
4. Choose columns to include
5. Download file
6. Use for reporting, backups, or external systems

### 8. Track Student Status Changes

**Status Options:**

- **Active**: Currently enrolled and attending
- **Inactive**: Temporarily not attending (leave, suspension)
- **Graduated**: Completed all grade levels
- **Transferred**: Moved to another school
- **Withdrawn**: Left school without completion

**Change Status:**

1. Edit student record
2. Update "Status" field
3. Add status change notes
4. Save
5. System logs status change with timestamp
6. Historical record preserved

---

## Integration with Other Features

### Links to Classes

- Student enrollment creates `StudentClass` relationship
- Teachers see student roster in their classes
- Class capacity limits enforced during enrollment
- Class schedule visible to enrolled students

### Links to Parents

- Guardian relationships via `StudentGuardian` model
- Parents access child's information via parent portal
- Emergency contact information available to staff
- Communication logs tracked per guardian

### Links to Attendance

- Attendance records reference student ID
- Daily/period-by-period tracking
- Absence summaries calculated per student
- Alerts for excessive absences

### Links to Results

- Student ID links to exam scores and assignments
- Gradebook shows performance across all subjects
- GPA calculated per student per term
- Report cards generated with student details

### Links to Timetable

- Students see their class timetable
- Schedule shows which teachers they have
- Period-by-period schedule for the week
- Links to lesson plans and materials

---

## Technical Implementation

### Students block

Typed, multi-tenant Students listing with server-driven pagination/sort/filter and a modal create form. Mirrors the route at `src/app/(platform)/students/page.tsx` per the mirror pattern.

### Files and responsibilities

- `content.tsx`: RSC that reads `studentsSearchParams` and fetches rows from `db.student` scoped by `schoolId`. Passes data to the client table.
- `table.tsx`: Client wrapper using `useDataTable` with URL-synced state and the shared toolbar. Injects a Create button and mounts the modal.
- `columns.tsx`: Column defs with `meta` for filters and headers via `DataTableColumnHeader`. Enable filters by setting `enableColumnFilter: true` and `meta.variant`.
- `list-params.ts`: `nuqs` cache for `page`, `perPage`, `name`, `status`, `className`, `sort`.
- `validation.ts`: Zod schemas. Client form and server actions both parse with the same schema.
- `actions.ts`: Server actions for create/update/delete/get/list. All queries include `schoolId` from `getTenantContext()` and call `revalidatePath` on success.
- `form.tsx`: Client create form using `react-hook-form` + `zodResolver`. Opens in `@/components/atom/modal/modal` and submits to `createStudent`.
- `types.ts`: Transport types (`StudentDTO`, `StudentRow`).

### Data flow (server-source-of-truth)

1. URL state → `studentsSearchParams` → `content.tsx` → Prisma where/order/skip/take
2. Server returns rows + total → `StudentsTable` → `useDataTable`
3. Filters in the toolbar update URL via `useDataTable`; server re-fetches on navigation
4. Mutations (`createStudent`, etc.) parse with Zod, scope by `schoolId`, then `revalidatePath("/dashboard/students")`

### Current behavior

- Search by name: partial, case-insensitive match on `givenName` and `surname`.
- Columns: `name`, `className`, `status`, `createdAt`.
- Filters: `name`, `status` enabled. `status` is server‑side filtered and derived from `userId` presence (`active` when `userId` exists; `inactive` otherwise). `className` UI is wired for future mapping.
- Actions:
  - View: navigates to `/students/[id]` and preserves query string (e.g. `?x-school=...` for dev tenant context). The breadcrumb shows the student name instead of the raw id.
  - Edit: opens the same modal as Create with fields prefilled.
  - Delete: shows a shadcn/ui Dialog confirmation (no native confirm). On success, a red "Deleted" toast appears.
- Create: toolbar "Create" button opens a full‑screen modal with `StudentCreateForm`; on success it closes and refreshes the page. Gender is restricted to `male`/`female` via Select.
- Toolbar layout: left‑aligned row → search, status, column visibility ("View"), then a circular outline Create icon button.
- Table styling: outline borders removed for a softer look (muted backgrounds retained by the container route; see table primitives).

### Implementation notes

- Multi-tenant: every query/mutation includes `schoolId` from `getTenantContext()`; dev can pass `?x-school=<domain>` which middleware forwards via `x-subdomain`.
- Validation: parse on client in `form.tsx`, and parse again on server in `actions.ts`.
- Toolbar filters: driven by column `meta` and `enableColumnFilter`; values sync to URL via `useDataTable`.
- Modal: provided by `@/components/atom/modal` and already mounted at `src/app/(platform)/layout.tsx`.
- Breadcrumb: client hook resolves name on `/students/[id]` via `/api/students/[id]` and swaps the last crumb’s label to the student’s name (URL remains id).

### Progress checklist (applied so far)

- [x] Mirror pattern in route and feature (`src/app/(platform)/students/page.tsx` → `src/components/platform/students/content.tsx`).
- [x] URL-synced table state with filters/pagination (`useDataTable`, toolbar).
- [x] Search by name via `name` filter and column meta.
- [x] Create flow using `@/components/atom/modal` and `StudentCreateForm` wired to `createStudent`.
- [x] Server actions parse with Zod and call `revalidatePath`.
- [x] Status filter wired on server (`active`/`inactive`).
- [x] Row actions: View/Edit/Delete (Dialog confirm + red "Deleted" toast).
- [x] Breadcrumb shows student name on `/students/[id]`.

### One-by-one plan (next fixes)

Follow this order to reach production-ready quality in line with `src/app/docs/*`:

1. Data model: add missing fields/relations used by filters.
2. Server mapping: wire `className` filter in `content.tsx` → Prisma `where`.
3. UX polish: loading/empty states.
4. AuthZ + multi-tenant hardening; typed action results.
5. Observability: log `requestId` + `schoolId` in actions.
6. Performance: indexes, avoid N+1 for class relations.

### Production-ready checklist

- Schema & data
  - [ ] Ensure `prisma/models/students.prisma` (or unified `schema.prisma`) includes required fields. Add `status` and class relationship if needed. Scope uniqueness by `{ schoolId, <field> }`.
  - [ ] Add proper indexes for `{ schoolId, createdAt }` and search fields used by filters.
  - [ ] Run migrations and seed representative data (`prisma/generator/seed.ts`).

- Server actions
  - [ ] All actions parse inputs with Zod and include `{ schoolId }` in `where`/`data`.
  - [ ] Return typed results and user-facing errors; never throw raw Prisma errors.
  - [ ] Call `revalidatePath("/dashboard/students")` (already present) or redirect as per docs.

- Filters, sort, pagination
  - [ ] Map `status` and `className` from URL to Prisma `where` in `content.tsx` (currently only `name` is mapped).
  - [ ] Provide stable default sort (createdAt desc) and verify `count` matches filters.
  - [ ] For select filters, define `options` in column `meta` (already done for `status`).

- UI/UX
  - [ ] Empty state and loading skeleton for the table.
  - [ ] Error toasts on failed actions; success toasts on create/update/delete.
  - [ ] Confirm dialog for destructive delete.
  - [ ] Form field hints and accessible labels; date pickers if preferred.

- AuthN/Z & multi-tenant
  - [ ] Respect session shape in `src/auth.ts`; protect actions behind Auth.js.
  - [ ] Never return or mutate across tenants; validate `schoolId` is present.

- Observability & reliability
  - [ ] Log `requestId` and `schoolId` on server actions per docs.
  - [ ] Handle edge cases: invalid dates, duplicate users, missing class links.

- Performance
  - [ ] Avoid N+1 on class relations; use `include` or batch queries where needed.
  - [ ] Cap `perPage` (already enforced via Zod) and use appropriate indexes.

- Docs alignment (see `src/app/docs/*`)
  - [ ] Patterns: `docs/pattern/page.mdx` (mirror, actions, validation).
  - [ ] Table: `docs/table/page.mdx` (URL sync, filters, columns meta).
  - [ ] Architecture: `docs/architecture/*` (directory, standardized files).
  - [ ] Requirements: `docs/requeriments/page.mdx` (consistency and guardrails).

### Extending filters (example)

To add a new filter:

1. Add a column or update `meta` in `columns.tsx` (e.g., `variant: "select"`, `options: [...]`, `enableColumnFilter: true`).
2. Add a key to `studentsSearchParams` in `list-params.ts`.
3. Map the key in the Prisma `where` clause in `content.tsx`.

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

  ```prisma
  model Student {
    id               String   @id @default(cuid())
    schoolId         String
    givenName        String
    surname          String
    dateOfBirth      DateTime?
    gender           Gender?
    email            String?
    status           StudentStatus @default(ACTIVE)

    @@unique([email, schoolId])
    @@index([schoolId, createdAt])
  }
  ```

### Forms & Validation

- **React Hook Form 7.61+** - Performant form state management ([Docs](https://react-hook-form.com))
- **Zod 4.0+** - Runtime schema validation (client + server) ([Docs](https://zod.dev))
  ```typescript
  export const studentCreateSchema = z.object({
    givenName: z.string().min(1),
    surname: z.string().min(1),
    dateOfBirth: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE"]),
  })
  ```

### UI Components

- **shadcn/ui** - Accessible components built on Radix UI ([Docs](https://ui.shadcn.com/docs))
- **TanStack Table 8.21+** - Headless table with sorting/filtering ([Docs](https://tanstack.com/table))
- **Tailwind CSS 4** - Utility-first styling ([Docs](https://tailwindcss.com/docs))

### Data Management

- **nuqs** - Type-safe URL search params synchronization
- **SWR** (future) - Client-side data fetching and caching

### Server Actions Pattern

```typescript
"use server"
export async function createStudent(input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = studentCreateSchema.parse(input)
  await db.student.create({ data: { ...validated, schoolId } })
  revalidatePath("/students")
  return { success: true }
}
```

### Key Features

- **Multi-Tenant Isolation**: All queries scoped by `schoolId`
- **Type Safety**: End-to-end TypeScript with Prisma + Zod inference
- **Server-Side Operations**: Mutations via Next.js Server Actions
- **URL State Management**: Filters and pagination synced to URL
- **Accessibility**: ARIA labels, keyboard navigation, semantic HTML

For complete technology documentation, see [Platform Technology Stack](../README.md#technology-stack--documentation).

---

### Route usage

`src/app/(platform)/students/page.tsx` simply re-exports `default` from `content.tsx`, matching the project's mirror pattern.
