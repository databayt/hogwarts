---
name: listings
---

# Listings Agent

Expert in the unified Listings pattern for data tables, grids, and CRUD operations across the Hogwarts platform.

## Quick Reference

**Documentation**: `content/docs-en/listings.mdx`
**Reference Implementation**: `src/components/platform/listings/grades/`
**Pattern**: Mirror pattern - routes mirror component folders

## Listings Status Overview

| Module        | Status       | Completion | Blocker                       |
| ------------- | ------------ | ---------- | ----------------------------- |
| Grades        | ✅ MVP Ready | 75%        | GPA calculation, report cards |
| Announcements | ✅ MVP Ready | 85%        | None                          |
| Students      | 🔴 BLOCKED   | 75%        | Guardian linking (FIXED)      |
| Teachers      | ✅ MVP Ready | 85%        | Qualification tracking        |
| Parents       | ✅ MVP Ready | 90%        | Test infrastructure           |
| Classes       | 🔴 BLOCKED   | 85%        | Subject teacher assignment    |
| Subjects      | ✅ MVP Ready | 85%        | Prerequisites tracking        |
| Lessons       | ✅ MVP Ready | 90%        | Resource attachments          |
| Events        | ✅ MVP Ready | 85%        | Recurring events, iCal        |
| Assignments   | ✅ MVP Ready | 85%        | Submission tracking           |
| Staff         | ✅ MVP Ready | 80%        | Leave management              |

## Critical Blockers

### 1. Classes - Subject Teacher Assignment (🔴 INCOMPLETE)

**Current State**: Homeroom teacher works, subject teachers missing
**Impact**: Cannot assign specific teachers to teach specific subjects

**Missing**:

- `assignSubjectTeacher(classId, subjectId, teacherId)` action
- `removeSubjectTeacher(classId, subjectId)` action
- Subject teacher UI component
- `ClassSubjectTeacher` junction model

**Files**:

- `src/components/platform/listings/classes/actions.ts`
- `src/components/platform/listings/classes/subject-teachers.tsx` (create)

### 2. Students - Guardian Linking (✅ FIXED)

**Status**: Server actions implemented

- `linkGuardian` action exists
- `unlinkGuardian` action exists
- Tests written (failing due to Vitest import resolution)

## Listing Structure (Mirror Pattern)

```
src/
  app/[lang]/s/[subdomain]/(platform)/<feature>/
    page.tsx              # Imports {Feature}Content from components
    layout.tsx            # Route-specific layout

  components/platform/listings/<feature>/
    content.tsx           # Server component: data fetching, tenant context
    table.tsx             # Client component: interactive table with state
    columns.tsx           # Column definitions (client, uses hooks)
    form.tsx              # Create/Edit form with validation
    actions.ts            # Server actions ("use server")
    queries.ts            # Query builders with Prisma
    authorization.ts      # RBAC permission checks
    validation.ts         # Zod schemas
    types.ts              # TypeScript types
    config.ts             # Constants, options, labels
    list-params.ts        # URL params (nuqs)
    README.md             # Feature documentation
    ISSUE.md              # Known issues tracker
```

## Page Layout Composition

```
┌─────────────────────────────────────────────────────────────────┐
│  PageTitle                     src/components/atom/page-title.tsx│
├─────────────────────────────────────────────────────────────────┤
│  PageNav                         src/components/atom/page-nav.tsx│
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ All      │ Active   │ Archive  │ Settings │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
├─────────────────────────────────────────────────────────────────┤
│  Toolbar                         src/components/atom/toolbar.tsx │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ SearchInput    Filters           ViewToggle Export Create   ││
│  │ [🔍 Search...] [Status▾][Type▾]  [≡/⊞]     [↓]    [+]      ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  DataTable                   src/components/table/data-table.tsx │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ☐ │ Name        │ Status   │ Created    │ Actions          ││
│  │───┼─────────────┼──────────┼────────────┼──────────────────││
│  │ ☐ │ Item 1      │ Active   │ 2025-01-20 │ [···]            ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Modal (when open)              src/components/atom/modal/modal  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ModalFormLayout + Form + ModalFooter                        ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Component Flow

```
Route (page.tsx)
    │
    ▼
Content (content.tsx) ──── Server Component
    │ • getTenantContext()
    │ • Parse URL params
    │ • Fetch data via queries.ts
    │
    ▼
Table (table.tsx) ──────── Client Component
    │ • useModal()
    │ • usePlatformView()
    │ • useDataTable()
    │
    ├──► Toolbar
    │      • SearchInput
    │      • ViewToggle
    │      • ExportButton
    │      • CreateButton
    │
    ├──► DataTable / GridContainer
    │      • Columns (columns.tsx)
    │      • Row actions
    │      • Pagination
    │
    └──► Modal
           • Form (form.tsx)
           • ModalFormLayout
           • ModalFooter
```

## Server Actions Pattern

```typescript
// actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { itemSchema } from "./validation"

export async function createItem(data: FormData) {
  // 1. Authenticate and get schoolId
  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) throw new Error("Unauthorized")

  // 2. Parse and validate
  const validated = itemSchema.parse(Object.fromEntries(data))

  // 3. Execute with schoolId scope (CRITICAL)
  const item = await db.item.create({
    data: { ...validated, schoolId },
  })

  // 4. Revalidate
  revalidatePath(`/items`)
  return { success: true, item }
}
```

## Column Definitions Pattern

**CRITICAL**: Columns with hooks MUST be in client components

```typescript
// columns.tsx - "use client"
"use client"

import type { ColumnDef } from "@tanstack/react-table"

export const getColumns = (
  dictionary: Dictionary,
  lang: string,
  { onDelete, onEdit, onView }: ColumnCallbacks
): ColumnDef<Row>[] => [
  // Define columns here
]

// table.tsx - client component (CORRECT ✅)
const columns = useMemo(
  () => getColumns(dictionary, lang, callbacks),
  [dictionary, lang]
)

// content.tsx - server component (WRONG ❌)
// <Table columns={getColumns(dictionary)} /> // Will cause SSE
```

## Core Hooks

| Hook            | Path                                     | Purpose                                                   |
| --------------- | ---------------------------------------- | --------------------------------------------------------- |
| usePlatformData | `src/hooks/use-platform-data.ts`         | Data fetching with optimistic updates and infinite scroll |
| usePlatformView | `src/hooks/use-platform-view.ts`         | View mode (table/grid) with URL persistence               |
| useDataTable    | `src/components/table/use-data-table.ts` | TanStack Table state management                           |
| useModal        | `src/components/atom/modal/context.tsx`  | Modal open/close state management                         |

## Multi-Tenant Safety

**ALWAYS include schoolId in every query**:

```typescript
// ✅ CORRECT
await db.student.findMany({
  where: { schoolId, yearLevel: "10" },
})

// ❌ WRONG - breaks tenant isolation
await db.student.findMany({
  where: { yearLevel: "10" },
})
```

## Best Practices

### Column Definitions

- Define handlers BEFORE columns `useMemo`
- Columns with hooks (useModal) must be in client components
- Pass callbacks via `getColumns(dictionary, lang, { onDelete, onEdit, onView })`

### Optimistic Updates

- Call `optimisticRemove(id)` before server request
- Call `refresh()` on error to rollback
- Use `optimisticUpdate(id, updater)` for in-place updates

### Server Actions

- Start with `"use server"` directive
- Validate with Zod on both client and server
- Call `revalidatePath()` or `redirect()` after mutations
- Return typed `ActionResponse<T>` results

### Modal Forms

- Use `ModalFormLayout` for two-column header/form layout
- Use `ModalFooter` for progress bar and navigation
- Call `onSuccess()` callback after successful mutations

## Module Details

### Grades (Reference Implementation)

- **Status**: ✅ 75% complete
- **Features**: CRUD, multi-step form, grade entry, percentage auto-calc
- **Planned**: GPA calculation, report card generation, grade boundaries

### Announcements

- **Status**: ✅ 85% complete
- **Features**: CRUD, scope targeting (SCHOOL/CLASS/ROLE), publish workflow
- **Planned**: Read receipts, push notifications, scheduled publishing

### Students

- **Status**: ✅ 75% complete (Guardian linking FIXED)
- **Features**: CRUD, CSV import, class enrollment, search/filter
- **Planned**: Photo upload, document attachments, academic history

### Teachers

- **Status**: ✅ 85% complete
- **Features**: CRUD, CSV import, department assignments, multi-step form
- **Planned**: Qualification tracking, teaching load analytics

### Parents

- **Status**: ✅ 90% complete
- **Features**: CRUD, linkGuardian/unlinkGuardian actions
- **Planned**: Communication logs, access analytics

### Classes

- **Status**: 🔴 85% complete (Subject teacher BLOCKED)
- **Features**: CRUD, homeroom teacher, student enrollment, capacity limits
- **Blocked**: Subject teacher assignment actions

### Subjects

- **Status**: ✅ 85% complete
- **Features**: CRUD, subject catalog, class/teacher assignment
- **Planned**: Prerequisites, curriculum standards

### Lessons

- **Status**: ✅ 90% complete
- **Features**: CRUD, class linking, evaluation types, course management
- **Planned**: Resource attachments, lesson templates

### Events

- **Status**: ✅ 85% complete
- **Features**: CRUD, event scheduling, RSVP tracking
- **Planned**: Recurring events, iCal export, email reminders

### Assignments

- **Status**: ✅ 85% complete
- **Features**: CRUD, multi-step form, assignment types, due dates
- **Planned**: Submission tracking, grading interface, file attachments

### Staff

- **Status**: ✅ 80% complete
- **Features**: CRUD, employment status/type, department assignment
- **Planned**: Leave management, attendance tracking

## Commands

```bash
# Development
pnpm dev                     # Start dev server
pnpm build                   # Production build

# Database
pnpm prisma generate         # Generate Prisma client
pnpm prisma migrate dev      # Create and apply migration

# Validation
/validate-prisma <file>      # Validate Prisma queries
/scan-errors                 # Detect error patterns
```

## Creating a New Listing

1. Create directory: `src/components/platform/listings/<name>/`
2. Copy structure from grades (reference implementation)
3. Create route: `src/app/[lang]/s/[subdomain]/(platform)/<name>/page.tsx`
4. Implement files in order:
   - `types.ts` → `validation.ts` → `config.ts`
   - `actions.ts` → `queries.ts` → `authorization.ts`
   - `columns.tsx` → `table.tsx` → `content.tsx`
   - `form.tsx` (with steps if multi-step)
5. Add to sidebar navigation
6. Create README.md and ISSUE.md
