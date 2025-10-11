## Parent Portal — Family Access Dashboard

**Parent-Facing Platform for Student Information**

The Parent Portal provides guardians with secure access to view their children's academic performance, attendance, assignments, and school communications.

### What Parents Can Do

**Core Capabilities:**
- 📊 View child's grades and GPA
- 📅 See attendance records
- 📝 View assignments and homework
- 📢 Read school announcements
- 📧 Receive notifications
- 📑 Download report cards

### Current Implementation Status
**🚧 Partial Implementation**

**Completed:**
- ✅ Authentication and access
- ✅ View announcements
- ✅ View child's attendance

**In Progress:**
- 🚧 View grades and assignments
- 🚧 View timetable

**Planned:**
- ⏸️ Download report cards
- ⏸️ Receive notifications
- ⏸️ Message teachers
- ⏸️ View fee status
- ⏸️ Update profile

---

## Parent Workflows

### 1. Login to Portal
1. Navigate to parent portal URL
2. Login with credentials
3. View dashboard with children

### 2. View Child's Grades
1. Select child from dropdown
2. Navigate to "Grades" tab
3. View all subjects and scores
4. See GPA and class average

### 3. Check Attendance
1. View "Attendance" tab
2. See attendance percentage
3. View absence history
4. Check late arrivals

### 4. View Assignments
1. View "Assignments" tab
2. See upcoming homework
3. View due dates
4. Check submission status

---

## Integration with Other Features

### Links to Students
- Parent sees their child's data only
- Multiple children support

### Links to Results
- View grades and GPA
- Download report cards

### Links to Attendance
- View attendance records
- Absence notifications

---

## Technical Implementation

Portal routes under `/parent-portal`:
- `/parent-portal/dashboard`
- `/parent-portal/grades`
- `/parent-portal/attendance`
- `/parent-portal/assignments`

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
