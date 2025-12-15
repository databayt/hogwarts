## Announcements — School-Wide Communication

**Admin Control Center for Announcements and Notifications**

The Announcements feature enables administrators to broadcast important messages to the entire school, specific classes, or role-based groups with targeted communication and notification management.

### URLs Handled by This Block

| URL | Page | Status |
|-----|------|--------|
| `/[lang]/s/[subdomain]/(platform)/announcements` | Announcements List | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/announcements/new` | Create Announcement | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/announcements/[id]` | View Announcement | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/announcements/[id]/edit` | Edit Announcement | ✅ Ready |

**Status:** ✅ Production-Ready MVP (85%)
**Last Updated:** 2025-12-14

### What Admins Can Do

**Core Capabilities:**
- 📢 Create school-wide announcements
- 🎯 Target specific audiences (classes, roles)
- 📅 Schedule announcements
- 📊 Track read receipts
- 📁 Export announcement history
- 🔔 Send push notifications

### What Teachers Can Do
- ✅ Create class announcements
- ✅ Send messages to their students
- ✅ View school announcements
- ❌ Cannot create school-wide announcements

### What Students Can View
- ✅ View school announcements
- ✅ View class announcements
- ✅ Mark as read
- ❌ Cannot create announcements

### What Parents Can View
- ✅ View school announcements
- ✅ View class announcements (if child enrolled)
- ❌ Cannot create announcements

### Current Implementation Status
**Production-Ready MVP ✅**

**Completed:**
- ✅ CRUD operations with validation
- ✅ Multi-step form (information → scope)
- ✅ Scope targeting (SCHOOL, CLASS, ROLE)
- ✅ Publish/unpublish workflow
- ✅ Multi-tenant isolation (schoolId scoping)

**Planned:**
- ⏸️ Read receipts tracking
- ⏸️ Push notifications
- ⏸️ Email notifications
- ⏸️ Scheduled publishing

---

## Admin Workflows

### 1. Create School-Wide Announcement
1. Navigate to `/announcements`
2. Click "Create Announcement"
3. Fill in details:
   - Title (e.g., "School Closure - Weather")
   - Body content (rich text)
   - Scope: SCHOOL (all users)
   - Priority level (low/medium/high)
4. Click "Publish" or "Save as Draft"
5. All users see announcement

### 2. Target Specific Class
1. Create announcement
2. Set scope to CLASS
3. Select class from dropdown
4. Only students/parents of that class see it

### 3. Target by Role
1. Create announcement
2. Set scope to ROLE
3. Select role (TEACHER, STUDENT, PARENT)
4. Only users with that role see it

---

## Integration with Other Features

### Links to Classes
- Class-specific announcements
- Visible to enrolled students
- Parents of class students notified

### Links to Dashboard
- Recent announcements widget
- Unread count badge
- Quick announcement creation

---

## Technical Implementation

## Structure

The component follows the standardized file pattern:

- `content.tsx` - Main content component that renders the announcements table
- `actions.ts` - Server actions for CRUD operations
- `validation.ts` - Zod schemas for form validation
- `types.ts` - TypeScript type definitions
- `config.ts` - Constants and configuration
- `form.tsx` - Multi-step form for creating/editing announcements
- `information.tsx` - First step form for basic information
- `scope.tsx` - Second step form for scope and publishing settings
- `footer.tsx` - Form footer with navigation and progress
- `columns.tsx` - Table column definitions
- `table.tsx` - Data table component
- `list-params.ts` - Search parameters configuration

## Features

### Multi-step Form
- **Step 1**: Basic Information (title, body)
- **Step 2**: Scope & Publishing (scope, class/role selection, publish status)

### Data Management
- Create new announcements
- Edit existing announcements
- Delete announcements
- View announcement details
- Toggle publish/unpublish status
- Search and filter by title, scope, and publish status

### Validation
- Client-side validation with Zod schemas
- Server-side validation for all mutations
- Multi-tenant safety with `schoolId` scoping
- Conditional validation for scope-specific fields

### Table Features
- Sortable columns
- Filterable data
- Pagination
- Action menu (View, Edit, Publish/Unpublish, Delete)

## Database Schema

Announcements are stored with the following fields:
- `id` - Unique identifier
- `schoolId` - Multi-tenant identifier
- `title` - Announcement title
- `body` - Announcement content
- `scope` - Target scope (school, class, or role)
- `classId` - Associated class (when scope is class)
- `role` - Target role (when scope is role)
- `published` - Publication status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Usage

The component is used in the platform dashboard at `/dashboard/announcements` and automatically handles:

- Multi-tenant data isolation
- Form state management
- Server-side validation
- Optimistic updates
- Error handling
- Dynamic form fields based on scope selection

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
