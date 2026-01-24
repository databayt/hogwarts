## Events — School Calendar and Activities

**Admin Control Center for Event Management**

The Events feature enables schools to manage calendars, schedule activities, track RSVPs, and coordinate school-wide events with comprehensive event planning tools.

### What Admins Can Do

**Core Capabilities:**

- 📅 Create and schedule events
- 🎯 Manage event categories
- 👥 Track attendance/RSVP
- 📊 View event analytics
- 📁 Export event calendar

### What Teachers Can Do

- ✅ Create class events
- ✅ View school calendar
- ✅ RSVP to events
- ❌ Cannot create school-wide events

### What Students Can View

- ✅ View upcoming events
- ✅ RSVP to events
- ✅ View event details

### What Parents Can View

- ✅ View school events
- ✅ RSVP on behalf of child
- ✅ Add to personal calendar

### Current Implementation Status

**Production-Ready MVP ✅**

**Completed:**

- ✅ CRUD operations
- ✅ Event scheduling (date, time, location)
- ✅ Attendee targeting
- ✅ RSVP tracking
- ✅ Multi-tenant isolation

**Planned:**

- ⏸️ Recurring events
- ⏸️ iCal export
- ⏸️ Email reminders
- ⏸️ Event photos/gallery

---

## Admin Workflows

### 1. Create School Event

1. Navigate to `/events`
2. Click "Create Event"
3. Fill in details:
   - Event name
   - Date and time
   - Location
   - Description
   - Target audience
4. Publish event
5. Users receive notifications

### 2. Track RSVPs

1. Open event detail page
2. View RSVP list
3. See attending/not attending counts
4. Export attendee list

### 3. View Calendar

1. Navigate to `/events/calendar`
2. View monthly calendar
3. Filter by event type
4. Click event for details

---

## Integration with Other Features

### Links to Dashboard

- Upcoming events widget
- Event reminders

### Links to Announcements

- Event announcements
- Reminder notifications

---

## Technical Implementation

**Database Schema:**

```prisma
model Event {
  id          String   @id @default(cuid())
  schoolId    String
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime?
  location    String?
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  school School @relation(fields: [schoolId], references: [id])

  @@index([schoolId, startDate])
}
```

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
