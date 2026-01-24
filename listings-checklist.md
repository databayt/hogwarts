# Listings Checklist v2.0

A unified guide for all listings in Hogwarts, following the architecture hierarchy (radix → shadcn → atoms → templates → blocks).

---

## Quick Reference

**Gold Standards:** `grades` and `announcements` (complete patterns with `queries.ts` + `authorization.ts`)

**Component Locations:**

| Level                | Location                                      | Purpose                                  |
| -------------------- | --------------------------------------------- | ---------------------------------------- |
| UI Primitives        | `src/components/ui/`                          | Radix UI → shadcn/ui                     |
| Table Infrastructure | `src/components/table/`                       | DataTable, useDataTable, bulk-actions    |
| Atoms                | `src/components/atom/`                        | page-title, toolbar, modal, search-input |
| Export               | `src/components/file/export/`                 | CSV, Excel, PDF exports                  |
| Platform Features    | `src/components/platform/listings/{feature}/` | Unified listing file structure           |

**Deprecated:** `src/components/platform/shared/` → migrate to atoms

---

## 1. Component Hierarchy

Following `architecture.mdx`:

```
Level 1: UI Primitives
    └── src/components/ui/ (Radix UI → shadcn/ui)

Level 2: Atoms (2+ primitives composed)
    └── src/components/atom/
        ├── page-title.tsx     # Unified page header
        ├── page-nav.tsx       # Page navigation breadcrumbs
        ├── toolbar.tsx        # Composable toolbar container
        ├── search-input.tsx   # Debounced search with icon
        ├── view-toggle.tsx    # Table/grid toggle
        ├── grid-card.tsx      # Card for grid views
        ├── grid-container.tsx # Responsive grid layout
        ├── empty-state.tsx    # Empty state with action
        └── modal/             # Modal context and components

Level 3: Reusable Infrastructure
    └── src/components/table/   ✓ EXISTS
        ├── data-table.tsx
        ├── data-table-enhanced.tsx
        ├── use-data-table.ts
        ├── bulk-actions-toolbar.tsx
        ├── data-table-column-header.tsx
        └── ... (filters, pagination, etc.)
    └── src/components/export/  (new)
        ├── export-button.tsx
        └── generators/ (csv, excel, pdf)

Level 4: Platform Features
    └── src/components/platform/listings/{feature}/
        ├── 11 required files (see below)
        └── Follows mirror pattern with routes
```

---

## 2. File Structure (REQUIRED)

Every listing in `src/components/platform/listings/<feature>/` MUST have:

| File               | Purpose                       | Required  |
| ------------------ | ----------------------------- | --------- |
| `content.tsx`      | Server component wrapper      | ✓         |
| `table.tsx`        | Client listing UI             | ✓         |
| `columns.tsx`      | Column definitions (client)   | ✓         |
| `card.tsx`         | Grid view card (client)       | ✓ **NEW** |
| `form.tsx`         | Create/Edit form              | ✓         |
| `actions.ts`       | Server actions ("use server") | ✓         |
| `queries.ts`       | Centralized query builders    | ✓ **NEW** |
| `authorization.ts` | RBAC permission checks        | ✓ **NEW** |
| `validation.ts`    | Zod schemas                   | ✓         |
| `types.ts`         | TypeScript interfaces         | ✓         |
| `config.ts`        | Constants and options         | ✓         |
| `list-params.ts`   | URL search params (nuqs)      | Optional  |

### Checklist

- [ ] `table.tsx` - Client component with DataTable + Grid views
- [ ] `card.tsx` - Grid view card with feature-specific data
- [ ] `form.tsx` - React Hook Form with Zod validation
- [ ] `columns.tsx` - Column definitions with "use client" directive
- [ ] `content.tsx` - Server component that fetches via `queries.ts`
- [ ] `actions.ts` - Server actions using `authorization.ts`
- [ ] `queries.ts` - Centralized query builders (copy from grades)
- [ ] `authorization.ts` - RBAC permission checks (copy from grades)
- [ ] `validation.ts` - Zod schemas for all form inputs
- [ ] `types.ts` - TypeScript interfaces for Row types
- [ ] Route page imports `{Feature}Content` from content.tsx

---

## 3. Table Infrastructure (REUSE)

### From `src/components/table/` ✓ EXISTS

```typescript
import { BulkActionsToolbar } from "@/components/table/bulk-actions-toolbar"
import { DataTable } from "@/components/table/data-table"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter"
import { useDataTable } from "@/components/table/use-data-table"
```

### Usage Pattern

```tsx
// table.tsx
"use client"

import { useMemo } from "react"

import {
  BulkActionsToolbar,
  createDeleteAction,
} from "@/components/table/bulk-actions-toolbar"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { getColumns } from "./columns"

export function FeatureTable({ initialData, total, dictionary, lang }) {
  // Memoize columns
  const columns = useMemo(
    () => getColumns(dictionary, lang, { onEdit, onDelete }),
    [dictionary, lang, onEdit, onDelete]
  )

  // Setup table
  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || 20 },
      columnVisibility: { id: false, createdAt: false },
    },
  })

  // Bulk actions
  const bulkActions = useMemo(
    () => [
      createDeleteAction(async (rows) => {
        for (const row of rows) await deleteFeature({ id: row.id })
        refresh()
      }, lang),
    ],
    [refresh, lang]
  )

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={loadMore}
      actionBar={
        <BulkActionsToolbar table={table} actions={bulkActions} lang={lang} />
      }
    />
  )
}
```

---

## 4. queries.ts Pattern (REQUIRED)

Copy from `src/components/platform/listings/grades/queries.ts`:

```typescript
// queries.ts
/**
 * Query builders for {Feature} module
 * Pattern follows grades module for consistency
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type FeatureListFilters = {
  search?: string
  status?: string
  // feature-specific filters
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type FeatureQueryParams = FeatureListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const featureListSelect = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
  // Add relations as needed
} as const

/** Full fields for detail/edit */
export const featureDetailSelect = {
  id: true,
  name: true,
  status: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  // Add all fields and relations
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for feature queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildFeatureWhere(
  schoolId: string,
  filters: FeatureListFilters = {}
): Prisma.FeatureWhereInput {
  const where: Prisma.FeatureWhereInput = { schoolId }

  if (filters.search) {
    where.name = {
      contains: filters.search,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  if (filters.status) {
    where.status = filters.status as any
  }

  return where
}

/**
 * Build order by clause
 */
export function buildFeatureOrderBy(
  sortParams?: SortParam[]
): Prisma.FeatureOrderByWithRelationInput[] {
  if (sortParams?.length) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }
  return [{ createdAt: Prisma.SortOrder.desc }]
}

/**
 * Build pagination params
 */
export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get feature list with filtering, sorting, pagination
 */
export async function getFeatureList(
  schoolId: string,
  params: Partial<FeatureQueryParams> = {}
) {
  const where = buildFeatureWhere(schoolId, params)
  const orderBy = buildFeatureOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.feature.findMany({
      where,
      orderBy,
      skip,
      take,
      select: featureListSelect,
    }),
    db.feature.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single feature by ID
 */
export async function getFeatureDetail(schoolId: string, id: string) {
  return db.feature.findFirst({
    where: { id, schoolId },
    select: featureDetailSelect,
  })
}

// ============================================================================
// Helpers
// ============================================================================

/** Localized field helper */
export function getLocalizedTitle(
  entity: { titleEn: string | null; titleAr: string | null },
  locale: string
): string {
  if (locale === "ar") {
    return entity.titleAr || entity.titleEn || ""
  }
  return entity.titleEn || entity.titleAr || ""
}
```

---

## 5. authorization.ts Pattern (REQUIRED)

Copy from `src/components/platform/listings/grades/authorization.ts`:

```typescript
// authorization.ts
/**
 * Authorization for {Feature} module
 * Implements RBAC for feature operations
 */

import { UserRole } from "@prisma/client"

export type FeatureAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "bulk_action"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface FeatureContext {
  id?: string
  createdBy?: string | null
  schoolId?: string
}

/**
 * Check if user has permission to perform action
 */
export function checkFeaturePermission(
  auth: AuthContext,
  action: FeatureAction,
  entity?: FeatureContext
): boolean {
  const { role, userId, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!entity?.schoolId) return true
    return schoolId === entity.schoolId
  }

  // TEACHER can manage within school
  if (role === "TEACHER") {
    if (action === "create") return true
    if (action === "read") return schoolId === entity?.schoolId
    if (["update", "delete"].includes(action)) {
      return entity?.createdBy === userId && schoolId === entity?.schoolId
    }
    if (action === "export") return schoolId === entity?.schoolId
  }

  // Other roles: read-only
  if (["ACCOUNTANT", "STAFF"].includes(role)) {
    if (action === "read") return schoolId === entity?.schoolId
  }

  return false
}

/**
 * Assert permission, throw if unauthorized
 */
export function assertFeaturePermission(
  auth: AuthContext,
  action: FeatureAction,
  entity?: FeatureContext
): void {
  if (!checkFeaturePermission(auth, action, entity)) {
    throw new Error(`Unauthorized: ${auth.role} cannot ${action}`)
  }
}

/**
 * Get auth context from session
 */
export function getAuthContext(session: any): AuthContext | null {
  if (!session?.user) return null
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId || null,
  }
}

/**
 * Helper: Check if role can create
 */
export function canCreate(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

/**
 * Helper: Check if role can export
 */
export function canExport(role: UserRole): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER", "ACCOUNTANT"].includes(role)
}

/**
 * Helper: Get allowed actions for role
 */
export function getAllowedActions(role: UserRole): FeatureAction[] {
  switch (role) {
    case "DEVELOPER":
    case "ADMIN":
      return ["create", "read", "update", "delete", "export", "bulk_action"]
    case "TEACHER":
      return ["create", "read", "update", "delete", "export"]
    case "ACCOUNTANT":
      return ["read", "export"]
    case "STAFF":
      return ["read"]
    default:
      return []
  }
}
```

---

## 6. Server Actions Pattern

```typescript
// actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import { assertFeaturePermission, getAuthContext } from "./authorization"
import { featureSchema } from "./validation"

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createFeature(
  input: z.infer<typeof featureSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authCtx = getAuthContext(session)
    if (!authCtx?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Check permission
    assertFeaturePermission(authCtx, "create")

    // Validate input
    const validated = featureSchema.parse(input)

    // Execute with schoolId (CRITICAL)
    const item = await db.feature.create({
      data: { ...validated, schoolId: authCtx.schoolId },
    })

    revalidatePath("/features")
    return { success: true, data: { id: item.id } }
  } catch (error) {
    console.error("createFeature error:", error)
    return { success: false, error: "Failed to create" }
  }
}

export async function updateFeature(
  id: string,
  input: z.infer<typeof featureSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authCtx = getAuthContext(session)
    if (!authCtx?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get existing item
    const existing = await db.feature.findFirst({
      where: { id, schoolId: authCtx.schoolId },
    })
    if (!existing) {
      return { success: false, error: "Not found" }
    }

    // Check permission with entity context
    assertFeaturePermission(authCtx, "update", {
      id: existing.id,
      createdBy: existing.createdBy,
      schoolId: existing.schoolId,
    })

    const validated = featureSchema.parse(input)

    const item = await db.feature.update({
      where: { id },
      data: validated,
    })

    revalidatePath("/features")
    return { success: true, data: { id: item.id } }
  } catch (error) {
    console.error("updateFeature error:", error)
    return { success: false, error: "Failed to update" }
  }
}

export async function deleteFeature(input: {
  id: string
}): Promise<ActionResponse<null>> {
  try {
    const session = await auth()
    const authCtx = getAuthContext(session)
    if (!authCtx?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const existing = await db.feature.findFirst({
      where: { id: input.id, schoolId: authCtx.schoolId },
    })
    if (!existing) {
      return { success: false, error: "Not found" }
    }

    assertFeaturePermission(authCtx, "delete", {
      id: existing.id,
      createdBy: existing.createdBy,
      schoolId: existing.schoolId,
    })

    await db.feature.delete({ where: { id: input.id } })

    revalidatePath("/features")
    return { success: true, data: null }
  } catch (error) {
    console.error("deleteFeature error:", error)
    return { success: false, error: "Failed to delete" }
  }
}
```

---

## 7. Atom Usage Guide

### Page Layout

```tsx
import { DashboardHeader } from "@/components/platform/dashboard/header"
import { PlatformToolbar } from "@/components/platform/shared/platform-toolbar"

<DashboardHeader heading={t.pageTitle} text={t.pageDescription}>
  <PlatformToolbar
    table={table}
    view={view}
    onToggleView={toggleView}
    searchValue={searchInput}
    onSearchChange={setSearchInput}
    searchPlaceholder={t.searchPlaceholder}
    onCreate={() => openModal()}
    getCSV={getFeatureCSV}
    entityName="features"
    translations={{...}}
  />
</DashboardHeader>
```

### Grid View

```tsx
import { EmptyState, GridContainer } from "@/components/atom"

import { FeatureCard } from "./card"

{
  view === "grid" &&
    (data.length === 0 ? (
      <EmptyState
        title={t.noItems}
        description={t.addFirst}
        icon={<Icon className="h-12 w-12" />}
        action={<Button onClick={() => openModal()}>{t.create}</Button>}
      />
    ) : (
      <GridContainer columns={3}>
        {data.map((item) => (
          <FeatureCard
            key={item.id}
            item={item}
            dictionary={t}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </GridContainer>
    ))
}
```

### Modal

```tsx
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"

const { openModal, closeModal, modal } = useModal()

// At page level
<Modal content={<FeatureForm onSuccess={refresh} dictionary={t} />} />
```

---

## 8. Content.tsx Pattern

```tsx
// content.tsx
import { auth } from "@/auth"

import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/i18n-config"

import { getFeatureList } from "./queries"
import { FeatureTable } from "./table"

interface FeatureContentProps {
  lang: Locale
  subdomain: string
}

export async function FeatureContent({ lang, subdomain }: FeatureContentProps) {
  // Get auth and schoolId
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return <div>Unauthorized</div>
  }

  // Fetch data using queries.ts
  const { rows, count } = await getFeatureList(schoolId, {
    page: 1,
    perPage: 20,
  })

  // Get translations
  const dictionary = await getDictionary(lang)
  const t = dictionary.school.feature

  return (
    <FeatureTable initialData={rows} total={count} dictionary={t} lang={lang} />
  )
}
```

---

## 9. Column Definitions Pattern

```tsx
// columns.tsx
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "@/components/table/data-table-column-header"

import type { FeatureRow } from "./types"

interface ColumnCallbacks {
  onView?: (item: FeatureRow) => void
  onEdit?: (item: FeatureRow) => void
  onDelete?: (item: FeatureRow) => void
}

export function getColumns(
  dictionary: any,
  lang: string,
  callbacks: ColumnCallbacks
): ColumnDef<FeatureRow>[] {
  const t = dictionary

  return [
    // Selection column
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Name column with sorting
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.name} />
      ),
      enableSorting: true,
    },

    // Status column with filter
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.status} />
      ),
      meta: {
        label: t.status,
        variant: "select",
        options: [
          { label: t.active, value: "ACTIVE" },
          { label: t.inactive, value: "INACTIVE" },
        ],
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },

    // Actions column
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => callbacks.onView?.(item)}>
                {t.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => callbacks.onEdit?.(item)}>
                {t.edit}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => callbacks.onDelete?.(item)}
                className="text-destructive"
              >
                {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
```

---

## 10. Card Component Pattern (NEW)

Each listing has its own `card.tsx` for grid views with feature-specific data:

```tsx
// card.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { FeatureRow } from "./types"

interface FeatureCardProps {
  item: FeatureRow
  dictionary: any
  onView?: (item: FeatureRow) => void
  onEdit?: (item: FeatureRow) => void
  onDelete?: (item: FeatureRow) => void
  className?: string
}

export function FeatureCard({
  item,
  dictionary,
  onView,
  onEdit,
  onDelete,
  className,
}: FeatureCardProps) {
  const t = dictionary

  return (
    <div
      className={cn(
        "bg-background hover:border-primary relative overflow-hidden rounded-lg border p-4 transition-[border-color] duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Avatar or Icon */}
        <Avatar className="h-12 w-12">
          {item.image && <AvatarImage src={item.image} alt={item.name} />}
          <AvatarFallback className="bg-primary/10 text-primary">
            {item.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(item)}>
              {t.view}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(item)}>
              {t.edit}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete?.(item)}
              className="text-destructive"
            >
              {t.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content - customize per feature */}
      <div className="mt-4 space-y-2">
        <h4 className="truncate font-medium">{item.name}</h4>
        <p className="text-muted-foreground truncate text-sm">{item.email}</p>
        {item.status && (
          <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
            {t[item.status.toLowerCase()]}
          </Badge>
        )}
      </div>
    </div>
  )
}
```

---

## 11. Compliance Matrix

| Listing       | Files | Table | card.tsx | queries.ts | auth.ts | i18n | Theme |
| ------------- | :---: | :---: | :------: | :--------: | :-----: | :--: | :---: |
| grades        |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| announcements |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| students      |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| teachers      |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| staff         |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ○   |   ✓   |
| parents       |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| classes       |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| subjects      |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| lessons       |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| events        |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |
| assignments   |   ✓   |   ✓   |    ○     |     ✓      |    ✓    |  ✓   |   ✓   |

**Legend:** ✓ Complete | ○ Missing | △ Partial

**Note:** Attendance, fees, and timetable are NOT listings - they have specialized UIs.

---

## 11. Migration Priority

### High Priority (Core Listings)

1. **students** - Most used, test case for pattern
2. **teachers** - Similar structure to students
3. **parents** - Guardian linking critical
4. **classes** - Depends on students/teachers

### Medium Priority (Academic)

5. **subjects** - Simple, straightforward
6. **lessons** - Complex relationships
7. **assignments** - Assessment system
8. **events** - Calendar integration

### Lower Priority (Operations)

9. **announcements** - Already complete ✓
10. **grades** - Already complete ✓

---

## 12. Per-Listing Migration Steps

For each listing:

1. **Create `queries.ts`** from grades template
2. **Create `authorization.ts`** from grades template
3. **Update `content.tsx`** to use `getFeatureList()` from queries.ts
4. **Update `actions.ts`** to use `assertFeaturePermission()`
5. **Update `table.tsx`** to use atoms (optional, can be incremental)
6. **Verify** all queries include `schoolId`
7. **Test** CRUD operations and permissions

---

## 13. Multi-Tenant Safety

### CRITICAL: Every query MUST include schoolId

```typescript
// ✅ CORRECT - includes schoolId
await db.student.findMany({
  where: { schoolId, yearLevel: "10" },
})

// ❌ WRONG - missing schoolId (BREAKS TENANT ISOLATION)
await db.student.findMany({
  where: { yearLevel: "10" },
})
```

### Server Actions Checklist

- [ ] Get `schoolId` from `auth()` session
- [ ] Never accept `schoolId` from client
- [ ] Include `schoolId` in ALL database queries
- [ ] Use `assertFeaturePermission()` before mutations
- [ ] Entity school must match user school

---

## 14. Internationalization Checklist

- [ ] All text from dictionary, never hardcoded
- [ ] Page title localized
- [ ] Search placeholder localized
- [ ] Column headers localized
- [ ] Filter options localized
- [ ] Button labels localized
- [ ] Toast messages localized
- [ ] Empty state messages localized
- [ ] Modal titles/descriptions localized

### Bilingual Data Fields

```typescript
// queries.ts helper
export function getLocalizedTitle(
  entity: { titleEn: string | null; titleAr: string | null },
  locale: string
): string {
  if (locale === "ar") {
    return entity.titleAr || entity.titleEn || ""
  }
  return entity.titleEn || entity.titleAr || ""
}
```

---

## 15. Theme Checklist

### Semantic Tokens Only

```tsx
// ✅ CORRECT - Semantic tokens
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground border-border">
<div className="bg-muted text-muted-foreground">

// ❌ WRONG - Hardcoded colors
<div className="bg-white dark:bg-gray-900 text-black">
```

### Token Reference

| Usage           | Token                                        |
| --------------- | -------------------------------------------- |
| Page background | `bg-background`                              |
| Card background | `bg-card`                                    |
| Muted areas     | `bg-muted`                                   |
| Primary text    | `text-foreground`                            |
| Secondary text  | `text-muted-foreground`                      |
| Borders         | `border-border`                              |
| Primary actions | `bg-primary text-primary-foreground`         |
| Destructive     | `bg-destructive text-destructive-foreground` |

---

## 16. Quick Start Template

### Create New Listing

```bash
# 1. Copy reference implementation
cp -r src/components/platform/listings/grades src/components/platform/listings/new-feature

# 2. Update in order:
# - types.ts       - Define row types
# - validation.ts  - Define Zod schemas
# - queries.ts     - Define query builders
# - authorization.ts - Define RBAC rules
# - actions.ts     - Implement server actions
# - columns.tsx    - Define table columns
# - form.tsx       - Create form component
# - table.tsx      - Assemble listing
# - content.tsx    - Server wrapper

# 3. Create route
mkdir -p src/app/[lang]/s/[subdomain]/(platform)/new-feature
# Copy page.tsx from another listing
```

### Implementation Order

1. **Types & Validation** - types.ts, validation.ts
2. **Data Layer** - queries.ts, actions.ts
3. **Authorization** - authorization.ts
4. **UI Components** - columns.tsx, form.tsx, table.tsx
5. **Integration** - content.tsx, page.tsx
6. **Testing** - Seed data, manual testing

---

## 17. Deprecated: shared/ Directory

### Migration Map

| Old Location                           | New Location               |
| -------------------------------------- | -------------------------- |
| `platform/shared/platform-toolbar.tsx` | Keep (compose with atoms)  |
| `platform/shared/view-toggle.tsx`      | `atom/view-toggle.tsx`     |
| `platform/shared/grid-card.tsx`        | `atom/grid-card.tsx`       |
| `platform/shared/export-button.tsx`    | `export/export-button.tsx` |

After migration, update imports:

```typescript
// Before

// After
import { ViewToggle } from "@/components/atom/view-toggle"
import { ViewToggle } from "@/components/platform/shared/view-toggle"
```

---

## 18. Anti-Patterns (Avoid)

❌ **Don't:**

- Import from `@/components/platform/shared/` for new code
- Write inline Prisma queries in content.tsx
- Skip `queries.ts` and `authorization.ts` files
- Miss schoolId in any database query
- Hardcode colors (use semantic tokens)
- Hardcode text (use dictionary)
- Call hooks from server components
- Generate columns in server components

✅ **Do:**

- Use centralized query builders in queries.ts
- Use RBAC checks via authorization.ts
- Include schoolId in every query
- Use semantic tokens for all colors
- Internationalize all text
- Memoize columns in client components
- Pass dictionary/lang as props

---

## Summary

This checklist ensures all listings follow the unified pattern established by `grades` and `announcements`. Key principles:

1. **11 Required Files** - Consistent structure per listing
2. **queries.ts** - Centralized, type-safe query builders
3. **authorization.ts** - Role-based access control
4. **Table Infrastructure** - Reuse `src/components/table/`
5. **Atoms** - Compose from `src/components/atom/`
6. **Multi-Tenant Safety** - schoolId in EVERY query
7. **Full i18n** - No hardcoded strings
8. **Theme Support** - Semantic tokens only
