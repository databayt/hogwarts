## Dashboard — Role-Based Home Pages

**Personalized Dashboard for Each User Role**

The Dashboard provides role-specific landing pages with relevant widgets, quick actions, and key metrics tailored to admins, teachers, students, and parents.

### URLs Handled by This Block

| URL | Page | Status |
|-----|------|--------|
| `/[lang]/s/[subdomain]/(platform)/dashboard` | Dashboard (redirect) | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/dashboard/admin` | Admin Dashboard | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/dashboard/teacher` | Teacher Dashboard | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/dashboard/student` | Student Dashboard | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/dashboard/parent` | Parent Dashboard | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/dashboard/accountant` | Accountant Dashboard | ✅ Ready |
| `/[lang]/s/[subdomain]/(platform)/dashboard/staff` | Staff Dashboard | ✅ Ready |

**Status:** ✅ Production-Ready MVP (80%)
**Last Updated:** 2025-12-14

### What Each Role Sees

**Admin Dashboard:**
- 📊 School-wide statistics
- 📈 Enrollment trends
- ⚠️ Pending tasks and alerts
- 🎯 Quick actions (create class, add student)

**Teacher Dashboard:**
- 📚 Today's schedule
- 📝 Assignments needing grading
- 📊 Class performance summary
- 👥 Student attendance

**Student Dashboard:**
- 📅 Today's timetable
- 📝 Upcoming assignments
- 📊 Recent grades
- 📢 Announcements

**Parent Dashboard:**
- 👨‍👩‍👧 Children overview
- 📊 Child's grades
- 📅 Attendance summary
- 📢 School announcements

### Current Implementation Status
**✅ Production-Ready MVP**

**Completed:**
- ✅ Role-based views
- ✅ Quick stats cards
- ✅ Pending tasks widget
- ✅ Recent activity

**In Progress:**
- 🚧 Replace mock data with real queries
- 🚧 Performance optimization

**Planned:**
- ⏸️ Real-time updates
- ⏸️ Customizable widgets
- ⏸️ Charts and graphs

---

## Technical Implementation

Dashboard routes:
- `/dashboard` (redirects to role-specific)
- `/dashboard/admin`
- `/dashboard/teacher`
- `/dashboard/student`
- `/dashboard/parent`

**Widgets:**
- Stats cards
- Recent activity feed
- Quick action buttons
- Calendar preview
- Notifications

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
