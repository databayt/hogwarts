# Table Block Migration Guide

## Overview

The central table block at `src/components/table/` has been reorganized to follow the project's standardized file pattern and now supports both **page-based pagination** (existing) and **"see more" pagination** (new).

## What Changed?

### 1. File Structure Reorganization

**Before:**

```
src/components/table/
  ├── types/
  │   ├── data-table.ts
  │   └── index.ts
  ├── config/
  │   └── data-table.ts
  ├── lib/
  │   ├── data-table.ts
  │   ├── parsers.ts
  │   └── ... (13 files)
  ├── hooks/
  │   ├── use-data-table.ts
  │   └── use-debounced-callback.ts
  └── data-table/ (components)
```

**After:**

```
src/components/table/
  ├── types.ts              # ✨ Consolidated types
  ├── config.ts             # ✨ Consolidated config
  ├── utils.ts              # ✨ Consolidated utilities
  ├── actions.ts            # ✨ NEW: Server action helpers
  ├── validation.ts         # ✨ NEW: Zod schemas
  ├── use-data-table.ts     # Moved from hooks/
  ├── use-see-more.ts       # ✨ NEW: See more pagination
  ├── use-debounced-callback.ts
  ├── data-table.tsx
  ├── data-table-pagination.tsx    # Existing page flipping
  ├── data-table-see-more.tsx      # ✨ NEW: See more button
  └── data-table/ (complex components)
```

### 2. Import Path Changes

| Old Import                                | New Import                          |
| ----------------------------------------- | ----------------------------------- |
| `@/components/table/types/data-table`     | `@/components/table/types`          |
| `@/components/table/config/data-table`    | `@/components/table/config`         |
| `@/components/table/lib/data-table`       | `@/components/table/utils`          |
| `@/components/table/lib/parsers`          | `@/components/table/utils`          |
| `@/components/table/hooks/use-data-table` | `@/components/table/use-data-table` |

### 3. New Features

- **See More Pagination**: New hook and component for infinite scroll pattern
- **Server Action Helpers**: Reusable patterns for data fetching with pagination
- **Validation Schemas**: Zod schemas for all table inputs
- **Better Type Safety**: Consolidated type definitions

## Migration Paths

### Path 1: Keep Existing Page-Based Pagination (No Changes Required)

If your feature uses page flipping and you're happy with it, **no changes needed**! The existing `useDataTable` hook and `DataTablePagination` component still work exactly as before.

```tsx
// ✅ This still works!
import { DataTable } from "@/components/table/data-table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

export function StudentsTable({ data, pageCount }) {
  const { table } = useDataTable({ data, columns, pageCount })

  return <DataTable table={table} />
}
```

### Path 2: Migrate to "See More" Pagination (Recommended for New Features)

For new features or when you want to improve UX with infinite scroll:

#### Step 1: Update Server Action

```typescript
// src/components/school-dashboard/students/actions.ts
"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import {
  buildPaginationResult,
  buildPrismaOrderBy,
  getSeeMorePaginationParams,
} from "@/components/table/actions"

export async function fetchStudents(params: {
  loadedCount?: number
  batchSize?: number
  sorting?: SortingInput
}) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) throw new Error("No school context")

  const { skip, take } = getSeeMorePaginationParams(
    params.loadedCount ?? 0,
    params.batchSize ?? 20
  )

  const where = { schoolId }
  const orderBy = buildPrismaOrderBy(params.sorting)

  const [data, total] = await Promise.all([
    db.student.findMany({ where, orderBy, skip, take }),
    db.student.count({ where }),
  ])

  return buildPaginationResult(data, total, { skip, take })
}
```

#### Step 2: Update Client Component

```tsx
// src/components/school-dashboard/students/table.tsx
"use client"

import { useMemo, useState } from "react"

import { DataTableSeeMore } from "@/components/table/data-table-see-more"
import { DataTable } from "@/components/table/data-table/data-table"
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar"
import { useSeeMore } from "@/components/table/use-see-more"

import { fetchStudents } from "./actions"
import { getStudentColumns } from "./columns"

export function StudentsTable({ initialData, totalCount }) {
  const columns = useMemo(() => getStudentColumns(), [])
  const [data, setData] = useState(initialData)

  const onSeeMore = async (newLoadedCount, batchSize) => {
    const result = await fetchStudents({
      loadedCount: newLoadedCount,
      batchSize,
    })
    setData((prev) => [...prev, ...result.data])
  }

  const { table, seeMoreState, handleSeeMore, isLoadingMore } = useSeeMore({
    data,
    columns,
    totalCount,
    onSeeMore,
  })

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        {/* Your toolbar actions */}
      </DataTableToolbar>
      <DataTableSeeMore
        seeMoreState={seeMoreState}
        onSeeMore={handleSeeMore}
        isLoading={isLoadingMore}
      />
    </DataTable>
  )
}
```

#### Step 3: Update Route Page

```tsx
// src/app/[lang]/s/[subdomain]/(school-dashboard)/students/page.tsx
import { fetchStudents } from "@/components/school-dashboard/listings/students/actions"
import { StudentsTable } from "@/components/school-dashboard/listings/students/table"

export default async function StudentsPage() {
  // Fetch initial batch
  const { data, total } = await fetchStudents({
    loadedCount: 0,
    batchSize: 20,
  })

  return <StudentsTable initialData={data} totalCount={total} />
}
```

## Comparison: Page-Based vs See More

| Feature                | Page-Based                                  | See More                               |
| ---------------------- | ------------------------------------------- | -------------------------------------- |
| **User Experience**    | Traditional pagination with page numbers    | Infinite scroll / load more button     |
| **Data Loading**       | Replaces entire dataset on page change      | Accumulates data progressively         |
| **URL State**          | `?page=2&perPage=20`                        | `?loadedCount=40&batchSize=20`         |
| **Best For**           | Admin panels, data tables with many filters | User-facing lists, mobile-friendly UIs |
| **Implementation**     | Existing `useDataTable`                     | New `useSeeMore`                       |
| **Migration Required** | No                                          | Yes (server + client changes)          |

## Import Path Update Checklist

If you have custom table components or utilities, update these imports:

```typescript
// ❌ Old imports
import { dataTableConfig } from "@/components/table/config"
import { dataTableConfig } from "@/components/table/config/data-table"
import { useDataTable } from "@/components/table/hooks/use-data-table"
import { getCommonPinningStyles } from "@/components/table/lib/data-table"
import { getSortingStateParser } from "@/components/table/lib/parsers"
// ✅ New imports
import { ExtendedColumnSort } from "@/components/table/types"
import { ExtendedColumnSort } from "@/components/table/types/data-table"
import { useDataTable } from "@/components/table/use-data-table"
import {
  getCommonPinningStyles,
  getSortingStateParser,
} from "@/components/table/utils"
```

## Backward Compatibility

- ✅ All existing table implementations continue to work without changes
- ✅ Old import paths still work (files not deleted, just deprecated)
- ✅ Page-based pagination is still the default
- ✅ No breaking changes to public APIs

## Testing Checklist

When migrating to "see more" pagination, test:

- [ ] Initial data loads correctly
- [ ] "See More" button loads next batch
- [ ] Data accumulates (doesn't replace)
- [ ] Sorting resets loaded data
- [ ] Filtering resets loaded data
- [ ] URL state persists on refresh
- [ ] "End of list" message shows when all data loaded
- [ ] Loading spinner shows during fetch
- [ ] Error handling works correctly

## Deprecation Notice

The following folders are now deprecated (but not removed for backward compatibility):

- `src/components/table/types/` → Use `src/components/table/types.ts`
- `src/components/table/config/` → Use `src/components/table/config.ts`
- `src/components/table/lib/` → Use `src/components/table/utils.ts`
- `src/components/table/hooks/` → Import hooks from root

**Plan**: These folders will be removed in a future major version after all features are migrated.

## Need Help?

- Check the example implementation in `src/components/table/_components/tasks-table.tsx`
- Review the types in `src/components/table/types.ts`
- Read the inline documentation in `src/components/table/actions.ts`
- Test your changes locally before pushing to production

## Rollout Strategy

**Phase 1 (Completed)**: ✅

- Reorganize table block structure
- Create new pagination components
- Update internal imports

**Phase 2 (Current)**: 🔄

- Migrate 1-2 pilot features (start with students table)
- Gather feedback and refine APIs
- Document any edge cases

**Phase 3 (Future)**: 📅

- Gradually migrate remaining features
- Remove deprecated folders
- Publish final migration guide

---

**Last Updated**: 2025-10-24
**Status**: Phase 2 - Pilot Implementation
