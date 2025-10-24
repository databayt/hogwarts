# Central Table Block

The central, reusable table system for the Hogwarts platform.

## Quick Start

### Page-Based Pagination (Default)

```tsx
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/use-data-table";

export function MyTable({ data, pageCount }) {
  const columns = useMemo(() => getColumns(), []);
  const { table } = useDataTable({ data, columns, pageCount });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        {/* Custom actions */}
      </DataTableToolbar>
    </DataTable>
  );
}
```

### "See More" Pagination (New)

```tsx
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableSeeMore } from "@/components/table/data-table-see-more";
import { useSeeMore } from "@/components/table/use-see-more";

export function MyTable({ initialData, totalCount }) {
  const columns = useMemo(() => getColumns(), []);
  const { table, seeMoreState, handleSeeMore, isLoadingMore } = useSeeMore({
    data: initialData,
    columns,
    totalCount,
    onSeeMore: async (loadedCount, batchSize) => {
      // Fetch more data
    },
  });

  return (
    <DataTable table={table}>
      <DataTableSeeMore
        seeMoreState={seeMoreState}
        onSeeMore={handleSeeMore}
        isLoading={isLoadingMore}
      />
    </DataTable>
  );
}
```

## File Structure

```
src/components/table/
├── README.md                    # This file
├── MIGRATION_GUIDE.md           # Detailed migration guide
│
├── types.ts                     # Type definitions
├── config.ts                    # Configuration
├── utils.ts                     # Utility functions
├── actions.ts                   # Server action helpers
├── validation.ts                # Zod schemas
│
├── use-data-table.ts            # Page-based pagination hook
├── use-see-more.ts              # See more pagination hook
├── use-debounced-callback.ts    # Debounce helper
│
├── data-table.tsx               # Main table component
├── data-table-toolbar.tsx       # Toolbar with filters
├── data-table-pagination.tsx    # Page flipping controls
├── data-table-see-more.tsx      # See more button
├── data-table-skeleton.tsx      # Loading state
│
└── data-table/                  # Complex sub-components
    ├── data-table-column-header.tsx
    ├── data-table-faceted-filter.tsx
    ├── data-table-date-filter.tsx
    └── ... (more filters)
```

## Features

- ✅ **Two Pagination Modes**: Page-based or "see more"
- ✅ **URL State Management**: All state synced to URL (nuqs)
- ✅ **Server-Side Operations**: Pagination, sorting, filtering
- ✅ **Advanced Filtering**: Text, number, date, select, multi-select
- ✅ **Column Sorting**: Single or multi-column
- ✅ **Row Selection**: Single or multiple
- ✅ **Column Visibility**: Show/hide columns
- ✅ **Export to CSV**: Built-in export functionality
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Multi-Tenant**: Always scoped by `schoolId`

## Architecture

### Standardized File Pattern

Following CLAUDE.md conventions:

- `types.ts` - All TypeScript types
- `config.ts` - Static configuration
- `utils.ts` - Pure utility functions
- `actions.ts` - Server action helpers
- `validation.ts` - Zod schemas
- `use-*.ts` - Custom React hooks

### Composition Hierarchy

```
UI (shadcn/ui primitives)
  ↓
Table Block (this component)
  ↓
Feature Tables (students, teachers, etc.)
```

### Multi-Tenant Safety

**CRITICAL**: All queries MUST include `schoolId`:

```typescript
// ✅ Correct
const where = { schoolId };
await db.student.findMany({ where });

// ❌ WRONG - Security risk!
await db.student.findMany();
```

## API Reference

### `useDataTable<TData>`

Page-based pagination hook.

**Props:**
- `data: TData[]` - Table data
- `columns: ColumnDef<TData>[]` - Column definitions
- `pageCount: number` - Total pages
- `initialState?` - Initial table state
- `enableAdvancedFilter?: boolean` - Enable advanced filtering

**Returns:**
- `table` - TanStack Table instance

### `useSeeMore<TData>`

"See more" pagination hook.

**Props:**
- `data: TData[]` - Initial data
- `columns: ColumnDef<TData>[]` - Column definitions
- `totalCount: number` - Total records
- `onSeeMore: (loadedCount, batchSize) => Promise<void>` - Load more callback

**Returns:**
- `table` - TanStack Table instance
- `seeMoreState` - Pagination state
- `handleSeeMore` - Load more handler
- `isLoadingMore` - Loading flag

### Server Action Helpers

```typescript
import {
  getPagePaginationParams,
  getSeeMorePaginationParams,
  buildPrismaOrderBy,
  buildPrismaWhere,
  buildPaginationResult,
} from "@/components/table/actions";
```

See `actions.ts` for full documentation.

## Examples

### Basic Table

```tsx
// 1. Define columns
export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "name",
    header: "Name",
    enableColumnFilter: true,
    meta: { variant: "text" },
  },
];

// 2. Create table component
export function StudentsTable({ data, pageCount }) {
  const { table } = useDataTable({ data, columns, pageCount });
  return <DataTable table={table} />;
}
```

### With Filters

```tsx
export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "status",
    header: "Status",
    enableColumnFilter: true,
    meta: {
      variant: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  },
];
```

### With Server Action

```tsx
// actions.ts
export async function fetchStudents(params: {
  page: number;
  perPage: number;
}) {
  const session = await auth();
  const { skip, take } = getPagePaginationParams(params.page, params.perPage);

  const [data, total] = await Promise.all([
    db.student.findMany({
      where: { schoolId: session.user.schoolId },
      skip,
      take,
    }),
    db.student.count({ where: { schoolId: session.user.schoolId } }),
  ]);

  return { data, pageCount: Math.ceil(total / params.perPage) };
}
```

## Testing

Test files use Vitest + React Testing Library:

```typescript
import { render, screen } from "@testing-library/react";
import { StudentsTable } from "./table";

test("renders table with data", () => {
  render(<StudentsTable data={mockData} pageCount={1} />);
  expect(screen.getByText("John Doe")).toBeInTheDocument();
});
```

## Performance Tips

1. **Memoize Columns**: Always wrap column definitions in `useMemo`
2. **Server-Side Operations**: Keep pagination/sorting/filtering on server
3. **Virtualization**: For 1000+ rows, consider adding virtual scrolling
4. **Debounce Filters**: Built-in 300ms debounce for filter inputs
5. **Batch Size**: Start with 20 rows per batch for "see more" mode

## Common Patterns

### Custom Toolbar Actions

```tsx
<DataTableToolbar table={table}>
  <Button onClick={handleCreate}>
    <Plus />
    Create
  </Button>
  <ExportButton data={table.getFilteredRowModel().rows} />
</DataTableToolbar>
```

### Row Actions

```tsx
{
  id: "actions",
  cell: ({ row }) => (
    <DropdownMenu>
      <DropdownMenuItem onClick={() => handleEdit(row.original)}>
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleDelete(row.original)}>
        Delete
      </DropdownMenuItem>
    </DropdownMenu>
  ),
}
```

### Bulk Actions

```tsx
const selectedRows = table.getFilteredSelectedRowModel().rows;

<Button
  disabled={selectedRows.length === 0}
  onClick={() => handleBulkDelete(selectedRows)}
>
  Delete {selectedRows.length} selected
</Button>
```

## Troubleshooting

### "Column definitions must be memoized"

```tsx
// ❌ Bad
const columns = getColumns();

// ✅ Good
const columns = useMemo(() => getColumns(), []);
```

### "Filters not working"

Make sure column has `enableColumnFilter: true` and `meta.variant`.

### "Sorting not working"

Ensure server action returns data sorted by `orderBy` parameter.

### "School context missing"

Always get `schoolId` from session and include in queries.

## Migration

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for:
- Import path changes
- Upgrading to "see more" pagination
- Backward compatibility notes

## Contributing

When adding features to the table block:

1. Follow the standardized file pattern
2. Add types to `types.ts`
3. Add config to `config.ts`
4. Keep utilities pure (no side effects)
5. Document with JSDoc comments
6. Add examples to this README
7. Update MIGRATION_GUIDE.md if breaking changes

## Resources

- [TanStack Table Docs](https://tanstack.com/table/v8)
- [nuqs (URL State)](https://nuqs.47ng.com/)
- [Project's CLAUDE.md](../../../CLAUDE.md)
- [shadcn/ui Table](https://ui.shadcn.com/docs/components/table)

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-24
**Maintainer**: Hogwarts Platform Team
