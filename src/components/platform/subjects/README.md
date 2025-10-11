## Subjects — Subject Catalog Management

**Admin Control Center for Academic Subjects**

The Subjects feature manages the school's subject catalog, assigns teachers to subjects, tracks curriculum standards, and organizes academic content.

### What Admins Can Do

**Core Capabilities:**
- 📚 Create and manage subjects
- 👨‍🏫 Assign teachers to subjects
- 📊 Track subject offerings
- 🔍 Search and filter subjects
- 📁 Export subject catalog

### Current Implementation Status
**✅ Production-Ready MVP**

**Completed:**
- ✅ CRUD operations with validation
- ✅ Subject catalog management
- ✅ Search and filtering
- ✅ Class and teacher assignment
- ✅ Multi-tenant isolation

**Planned:**
- ⏸️ Prerequisites tracking
- ⏸️ Curriculum standards
- ⏸️ Learning outcomes
- ⏸️ Subject grouping

---

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the subjects table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Single-step form for creating/editing subjects
- `information.tsx` - Form step for basic information
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Single-step Form
- **Step 1**: Basic Information (subject name, department)

### Data Management
- Create new subjects
- Edit existing subjects
- Delete subjects
- View subject details
- Search and filter by subject name and department

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

Subjects are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `departmentId` - Associated department
- `subjectName` - Name of the subject
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/subjects` and automatically handles:

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
