## Import — CSV Bulk Operations

**Admin Tool for Data Import and Migration**

The Import feature enables administrators to bulk upload students, teachers, and other data via CSV files with validation and error reporting.

### What Admins Can Do

**Core Capabilities:**
- 📂 Import students from CSV
- 👨‍🏫 Import teachers from CSV
- ✅ Download CSV templates
- 🔍 Validate data before import
- 📊 View import error reports

### Current Implementation Status
**🚧 Basic Implementation**

**Completed:**
- ✅ CSV import for students
- ✅ CSV import for teachers
- ✅ Template downloads
- ✅ Basic validation

**In Progress:**
- 🚧 Enhanced error reporting
- 🚧 Bulk updates

**Planned:**
- ⏸️ Export all entities
- ⏸️ Data migration tools
- ⏸️ Backup/restore
- ⏸️ SIS integration

---

## Admin Workflows

### 1. Import Students from CSV
1. Navigate to `/import`
2. Select "Import Students"
3. Download template (if needed)
4. Fill template with student data
5. Upload CSV file
6. Review validation results
7. Confirm import
8. View success/error summary

### 2. Download CSV Template
1. Navigate to `/import/templates`
2. Select entity type (students, teachers)
3. Download template with example data
4. Use as guide for data formatting

### 3. Review Import Errors
1. After import attempt
2. View error report
3. See which rows failed
4. Download error CSV
5. Fix errors and re-import

---

## Integration with Other Features

### Links to Students
- Bulk student creation
- Class enrollment via import

### Links to Teachers
- Bulk teacher creation
- Department assignment via import

---

## Technical Implementation

**Supported Entities:**
- Students
- Teachers
- Classes (planned)
- Parents (planned)

**CSV Format:**
- UTF-8 encoding
- Comma-separated
- Header row required
- Date format: YYYY-MM-DD

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
