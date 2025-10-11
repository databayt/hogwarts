## Parents — Guardian Account Management

**Admin Control Center for Parent/Guardian Records**

The Parents feature manages guardian accounts, links them to students, handles communication preferences, and provides parent portal access with comprehensive family relationship management.

### What Admins Can Do

**Core Capabilities:**
- 👨‍👩‍👧 Create parent/guardian accounts
- 🔗 Link parents to students
- 📧 Manage contact information
- 🔐 Set portal access permissions
- 📊 Track parent engagement

### Current Implementation Status
**✅ Production-Ready MVP**

**Completed:**
- ✅ CRUD operations
- ✅ Student relationships (StudentGuardian)
- ✅ Contact information management
- ✅ Multi-tenant isolation

**Planned:**
- ⏸️ Communication logs
- ⏸️ Access analytics
- ⏸️ Permission management

---

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the parents table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing parents
- `information.tsx` - First step form for basic information
- `contact.tsx` - Second step form for contact details
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Basic Information (names)
- **Step 2**: Contact Details (email address, user ID)

### Data Management
- Create new parents/guardians
- Edit existing parents/guardians
- Delete parents/guardians
- View parent/guardian details
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

Parents/Guardians are stored with the following fields (using the `guardian` table):
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `givenName` - First name
- `surname` - Last name
- `emailAddress` - Email address (optional, unique per school)
- `teacherId` - Link to teacher if guardian is also a teacher (optional)
- `userId` - Associated user account (optional)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/parents` and automatically handles:

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
