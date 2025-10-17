# [Module Name] — [Short Descriptive Tagline]

**[Primary User Role] Control Center for [Core Function]**

[Brief description of what this module does and its importance in the school management system]

### What Admins Can Do

**Core Capabilities:**
- 📋 [List main admin capabilities]
- 🔍 [Search and filtering features]
- 📝 [CRUD operations available]
- 📊 [Reporting and analytics]
- 🔄 [Bulk operations]
- 📁 [Export/import features]

### What Teachers Can Do
- ✅ [List teacher permissions]
- ✅ [View capabilities]
- ❌ [Restrictions]

### What Students Can View
- ✅ [Student access rights]
- ❌ [Restrictions]

### What Parents Can View
- ✅ [Parent portal access]
- ❌ [Restrictions]

### Current Implementation Status
**[Development Stage: Planning/In Progress/Production-Ready MVP] ⚠️/🚧/✅**

**Completed:**
- ✅ [List completed features]

**In Progress:**
- 🚧 [List features being developed]

**Planned:**
- ⏸️ [List planned features]

---

## Admin Workflows

### 1. [Primary Workflow Name]
**Prerequisites:** [List any requirements]

1. Navigate to `/[module-path]`
2. [Step-by-step instructions]
3. [Include specific UI elements and actions]
4. [Expected outcomes]

### 2. [Secondary Workflow Name]
[Similar structure as above]

---

## Integration with Other Features

### Links to [Related Module]
- [Explain how modules connect]
- [Data relationships]
- [Shared functionality]

---

## Technical Implementation

### [Module] Block

[Technical description of the module architecture]

### Files and Responsibilities
- `content.tsx`: [Description]
- `table.tsx`: [Description]
- `columns.tsx`: [Description]
- `list-params.ts`: [Description]
- `validation.ts`: [Description]
- `actions.ts`: [Description]
- `form.tsx`: [Description]
- `types.ts`: [Description]

### Data Flow
1. [Explain data flow pattern]
2. [Server-client interaction]
3. [State management]

### Multi-Tenant Safety
- Every query includes `schoolId` from `getTenantContext()`
- Unique constraints scoped by tenant
- Row-level isolation enforced

---

## Technology Stack & Dependencies

This feature uses the platform's standard technology stack:

### Core Framework
- **Next.js 15.4+** - App Router with Server Components
- **React 19+** - Server Actions and new hooks
- **TypeScript** - Strict mode for type safety

### Database & ORM
- **Neon PostgreSQL** - Serverless database
- **Prisma ORM 6.14+** - Type-safe queries

### Forms & Validation
- **React Hook Form 7.61+** - Form state management
- **Zod 4.0+** - Schema validation

### UI Components
- **shadcn/ui** - Accessible components
- **TanStack Table 8.21+** - Data tables
- **Tailwind CSS 4** - Styling

### Server Actions Pattern
```typescript
"use server"
export async function create[Entity](input: FormData) {
  const { schoolId } = await getTenantContext()
  const validated = schema.parse(input)
  await db.[entity].create({ data: { ...validated, schoolId } })
  revalidatePath('/[path]')
  return { success: true }
}
```

---

## Commands

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build for production

# Database
pnpm prisma generate        # Generate Prisma client
pnpm prisma migrate dev     # Run migrations
pnpm db:seed               # Seed test data

# Testing
pnpm test                  # Run unit tests
pnpm test:e2e             # Run E2E tests
```