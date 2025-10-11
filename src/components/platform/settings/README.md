## Settings — School Configuration

**Admin Control Center for School Settings**

The Settings feature enables administrators to configure school-wide preferences, academic year setup, grading scales, and system customization.

### What Admins Can Do

**Core Capabilities:**
- 🏫 Configure school profile (name, logo)
- 📅 Manage academic years and terms
- 🌍 Set locale (Arabic/English)
- ⏰ Configure timezone
- 🎨 Customize branding
- 🔐 Manage subdomain

### Current Implementation Status
**✅ Production-Ready MVP**

**Completed:**
- ✅ School profile management
- ✅ Academic year configuration
- ✅ Locale selection (ar/en)
- ✅ Timezone configuration
- ✅ Subdomain management

**Planned:**
- ⏸️ Grading scale configuration
- ⏸️ Email templates
- ⏸️ Notification preferences
- ⏸️ Backup and restore

---

## Admin Workflows

### 1. Configure School Profile
1. Navigate to `/settings`
2. Update school information:
   - School name
   - Logo upload
   - Contact information
3. Save changes

### 2. Setup Academic Year
1. Navigate to `/settings/academic-year`
2. Create new academic year
3. Define terms (Fall, Spring, Summer)
4. Set start/end dates
5. Activate for current use

### 3. Configure Grading Scale
1. Navigate to `/settings/grading`
2. Set grade boundaries
3. Configure GPA weights
4. Apply to all classes

---

## Integration with Other Features

### Links to All Features
- Settings affect entire platform
- Academic year used by timetable, results
- Locale affects all UI translations
- Grading scale used by results

---

## Technical Implementation

**Database Schema:**
```prisma
model School {
  id            String   @id @default(cuid())
  name          String
  subdomain     String   @unique
  locale        String   @default("ar")
  timezone      String   @default("UTC")
  logoUrl       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model SchoolYear {
  id        String   @id @default(cuid())
  schoolId  String
  name      String
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(false)
  createdAt DateTime @default(now())

  school School @relation(fields: [schoolId], references: [id])
  terms  Term[]
}
```

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
