## Staff — Administrative Personnel Management

**Admin Control Center for Non-Teaching Staff**

The Staff feature provides a comprehensive management system for administrative personnel, support staff, and other non-teaching employees. It handles employee records, positions, departments, employment status, and basic HR functions.

### URLs Handled by This Block

| URL                                           | Page         | Status   |
| --------------------------------------------- | ------------ | -------- |
| `/[lang]/s/[subdomain]/(platform)/staff`      | Staff List   | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/staff/[id]` | Staff Detail | ✅ Ready |

**Status:** ✅ Production-Ready MVP (80%)
**Last Updated:** 2025-01-25

### What Admins Can Do

**Core Capabilities:**

- 📋 View all school staff members
- ➕ Create new staff records
- ✏️ Edit staff information
- 🗑️ Delete staff records
- 🔍 Search by name, position, department
- 📊 Filter by employment status/type
- 👤 Link staff to user accounts

### Employment Types Supported

- ✅ Full Time
- ✅ Part Time
- ✅ Contract
- ✅ Temporary

### Employment Status Options

- ✅ Active
- ✅ On Leave
- ✅ Terminated
- ✅ Retired

### Current Implementation Status

**Production-Ready MVP ✅**

**Completed:**

- ✅ CRUD operations with validation
- ✅ Staff information form (name, email, position)
- ✅ Employment status and type tracking
- ✅ Department assignment
- ✅ User account linking (optional)
- ✅ Multi-tenant isolation (schoolId scoping)
- ✅ Search and filtering
- ✅ Table view with sorting

**Planned:**

- ⏸️ Attendance tracking for staff
- ⏸️ Leave management
- ⏸️ Performance reviews
- ⏸️ Document management
- ⏸️ Payroll integration

---

## Technical Implementation

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the staff table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Form for creating/editing staff
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `queries.ts` - Centralized query builders
- `authorization.ts` - RBAC permission checks
- `list-params.ts` - Search parameters configuration

## Features

### Data Management

- Create new staff records
- Edit existing staff
- Delete staff
- View staff details
- Search and filter by name, position, department, status

### Validation

- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping
- Email format validation
- Required field enforcement

### Table Features

- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Delete)
- Employment status badges

## Database Schema

Staff are stored with the following fields:

- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `employeeId` - Optional employee ID
- `givenName` - First name
- `surname` - Last name
- `gender` - Gender (male/female)
- `emailAddress` - Email address
- `position` - Job position/title
- `departmentId` - Associated department
- `employmentStatus` - ACTIVE, ON_LEAVE, TERMINATED, RETIRED
- `employmentType` - FULL_TIME, PART_TIME, CONTRACT, TEMPORARY
- `joiningDate` - Date of employment
- `userId` - Optional link to user account
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Dependencies

- React Hook Form for form management
- Zod for validation
- TanStack Table for data display
- shadcn/ui components for UI elements
- Next.js server actions for backend operations

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
