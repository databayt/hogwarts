## Profile — User Profile Management

**User-Facing Profile and Account Settings**

The Profile feature enables users to manage their personal information, update passwords, configure notification preferences, and customize their account settings.

### What All Users Can Do

**Core Capabilities:**

- 👤 View and edit personal information
- 🔒 Change password
- 🖼️ Upload avatar
- 🔔 Configure notification preferences
- 🌍 Set language preference

### Current Implementation Status

**✅ Production-Ready MVP**

**Completed:**

- ✅ View and edit user information
- ✅ Password change
- ✅ Avatar upload
- ✅ Notification preferences

**Planned:**

- ⏸️ Two-factor authentication
- ⏸️ Session management
- ⏸️ Activity log
- ⏸️ Privacy settings

---

## User Workflows

### 1. Update Profile Information

1. Navigate to `/profile`
2. Click "Edit Profile"
3. Update name, email, phone
4. Save changes

### 2. Change Password

1. Navigate to `/profile/security`
2. Enter current password
3. Enter new password
4. Confirm new password
5. Save changes

### 3. Upload Avatar

1. Navigate to `/profile`
2. Click on avatar placeholder
3. Upload image (JPG, PNG)
4. Crop if needed
5. Save avatar

---

## Technical Implementation

**Database Schema:**

```prisma
model User {
  id            String   @id @default(cuid())
  name          String?
  email         String   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          UserRole @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
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

For complete technology documentation, see [Platform Technology Stack](../README.md#technology-stack--documentation).

---
