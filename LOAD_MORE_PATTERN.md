# Load More Pagination Pattern

This document describes how to implement the "Load More" pagination pattern across all tables in the application.

## Overview

The Load More pattern provides a better user experience by:
- Eliminating complex pagination controls
- Allowing users to incrementally load data with a simple button click
- Maintaining scroll position and context
- Reducing cognitive load (no need to navigate between pages)

## Architecture

The implementation consists of three main components:

1. **DataTableLoadMore Component** (`src/components/table/data-table/data-table-load-more.tsx`)
   - Replaces traditional pagination controls
   - Shows a "Load More" button when more data is available
   - Displays loading state during data fetch

2. **Updated DataTable Component** (`src/components/table/data-table/data-table.tsx`)
   - Supports both `pagination` and `load-more` modes via `paginationMode` prop
   - Conditionally renders pagination or load-more controls

3. **Client-Side Data Accumulation**
   - Table component maintains accumulated data in state
   - Fetches next page and appends to existing data
   - Tracks loading state and whether more data exists

## How to Apply to Any Table

Follow these steps to convert any table from traditional pagination to load-more:

### 1. Update Table Component (Client Component)

```typescript
// Before
interface YourTableProps {
  data: YourRow[];
  pageCount: number;
  dictionary?: Dictionary;
}

export function YourTable({ data, pageCount, dictionary }: YourTableProps) {
  const columns = useMemo(() => getYourColumns(dictionary), [dictionary]);
  const { table } = useDataTable<YourRow>({ data, columns, pageCount });

  return (
    <DataTable table={table}>
      {/* ... */}
    </DataTable>
  );
}

// After
import { useState, useCallback } from "react";
import { getYourItems } from "./actions"; // Import your server action

interface YourTableProps {
  initialData: YourRow[];
  total: number;
  dictionary?: Dictionary;
  perPage?: number;
}

export function YourTable({ initialData, total, dictionary, perPage = 20 }: YourTableProps) {
  const columns = useMemo(() => getYourColumns(dictionary), [dictionary]);

  // State for incremental loading
  const [data, setData] = useState<YourRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getYourItems({ page: nextPage, perPage });

      if (result.rows.length > 0) {
        setData(prev => [...prev, ...result.rows]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  const { table } = useDataTable<YourRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length, // Show all loaded data
      }
    }
  });

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      {/* ... */}
    </DataTable>
  );
}
```

### 2. Update Content Component (Server Component)

```typescript
// Before
<YourTable
  data={data}
  pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))}
  dictionary={dictionary?.yourSection}
/>

// After
<YourTable
  initialData={data}
  total={total}
  dictionary={dictionary?.yourSection}
  perPage={sp.perPage}
/>
```

### 3. Ensure Server Action Exists

Make sure you have a server action that supports paginated fetching:

```typescript
// In your actions.ts file
export async function getYourItems(input: Partial<z.infer<typeof getYourItemsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getYourItemsSchema.parse(input ?? {});

  // Build where clause with filters
  const where = {
    schoolId,
    // ... your filters
  };

  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];

  const [rows, count] = await Promise.all([
    db.yourModel.findMany({ where, orderBy, skip, take }),
    db.yourModel.count({ where }),
  ]);

  // Map to your row type
  const mapped = rows.map(item => ({
    // ... map fields
  }));

  return { rows: mapped, total: count };
}
```

## Example Implementation

See the Students table for a complete working example:
- `src/components/platform/students/table.tsx` - Client component with load-more logic
- `src/components/platform/students/content.tsx` - Server component passing initial data
- `src/components/platform/students/actions.ts` - Server action for fetching data

## Benefits

1. **Simplified UX**: No need to navigate between pages
2. **Better Mobile Experience**: Easier to browse on touch devices
3. **Maintained Context**: Users don't lose their place when loading more
4. **Progressive Loading**: Only load what's needed
5. **Reusable**: Same pattern works for all tables

## Compatibility

This pattern is fully compatible with:
- Filtering (filters apply to all data fetches)
- Sorting (maintains sort order across loads)
- Search (searches apply globally)
- Column visibility
- Row selection

## Performance Considerations

- Initial page load time remains the same (only first page loaded)
- Subsequent loads are fast (incremental)
- Client-side state grows with loaded data (acceptable for most use cases)
- For extremely large datasets (>1000 items), consider virtual scrolling

## Migration Checklist

When migrating a table to load-more pattern:

- [ ] Update table component props (data → initialData, pageCount → total, add perPage)
- [ ] Add state management (data, currentPage, isLoading)
- [ ] Implement handleLoadMore callback
- [ ] Update useDataTable call (pageCount: 1, pageSize: data.length)
- [ ] Add paginationMode="load-more" to DataTable
- [ ] Update content component to pass correct props
- [ ] Ensure server action supports pagination
- [ ] Test with filters and sorting
- [ ] Verify loading states work correctly

## Reverting to Traditional Pagination

To revert to traditional pagination, simply:
1. Change `paginationMode="load-more"` back to `paginationMode="pagination"` (or omit it)
2. Pass `pageCount` instead of `total`
3. Use `data` prop instead of `initialData`
4. Remove load-more state management

The system supports both patterns simultaneously across different tables.
