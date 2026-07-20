## Table — Central Reusable Data Table System

### Overview

Central, reusable table system for the Hogwarts platform built on TanStack Table v8. Supports two pagination modes (page-based and "see more"), URL-synced state via nuqs, server-side operations, advanced filtering, column sorting, row selection, CSV export, and multi-tenant safety with mandatory `schoolId` scoping.

### File Structure

```
src/components/table/
├── data-table.tsx                  # Main table component
├── data-table-enhanced.tsx         # Enhanced variant
├── data-table-toolbar.tsx          # Toolbar with filters
├── data-table-advanced-toolbar.tsx # Advanced toolbar
├── data-table-pagination.tsx       # Page-based pagination
├── data-table-load-more.tsx        # "See more" / load-more controls (self-i18n)
├── data-table-skeleton.tsx         # Loading skeleton
├── data-table-column-header.tsx    # Column header
├── data-table-faceted-filter.tsx   # Faceted filter
├── data-table-filter-list.tsx      # Filter list
├── data-table-filter-menu.tsx      # Filter menu
├── data-table-date-filter.tsx      # Date filter
├── data-table-range-filter.tsx     # Range filter
├── data-table-slider-filter.tsx    # Slider filter
├── data-table-sort-list.tsx        # Sort list
├── data-table-view-options.tsx     # Column visibility
├── data-table-action-bar.tsx       # Action bar
├── select-column.tsx               # Selection column
├── bulk-actions-toolbar.tsx        # Bulk actions
├── dynamic-container.tsx           # Dynamic container
├── shell.tsx                       # Table shell
├── icons.tsx                       # Table-specific icons
├── use-data-table.ts               # Page-based pagination hook
├── use-table-translations.ts       # Shared i18n for table chrome
├── use-debounced-callback.ts       # Debounce helper
├── use-callback-ref.ts             # Callback ref hook
├── use-media-query.ts              # Media query hook
├── use-auto-refresh.ts             # Auto-refresh hook
├── types.ts                        # Type definitions
├── types/                          # Extended types
├── config.ts                       # Configuration
├── config/                         # Extended config
├── utils.ts                        # Utility functions
├── actions.ts                      # Server action helpers
├── validation.ts                   # Zod schemas
├── providers.tsx                   # Context providers
├── lib/                            # Internal libraries
│   ├── parsers.ts                  # URL state parsers
│   ├── data-table.ts               # Table utilities
│   ├── prisma-filter-columns.ts    # Prisma filter builders
│   ├── db-utils.ts                 # Database utilities
│   ├── export.ts                   # CSV export
│   ├── format.ts                   # Formatters
│   └── ...
├── atom/                           # Sub-components
│   ├── faceted.tsx
│   ├── sortable.tsx
│   └── toggle-group.tsx
├── _lib/                           # Internal query helpers
├── _components/                    # Task demo components
├── layouts/                        # Layout components
└── MIGRATION_GUIDE.md              # Migration instructions
```

### "See more" / load-more contract

`<DataTable paginationMode="load-more" />` backed by `usePlatformData` drives ~39
tables. Three invariants keep it working — breaking any one reintroduces a bug
that already shipped once:

1. **`DataTable` and `DataTableLoadMore` must NOT be wrapped in `React.memo`.**
   Both read rows and selection off the TanStack `table` object, which is
   referentially stable and mutates in place. A shallow prop compare cannot see
   new rows, so a memo silently swallows the re-render that paints them.
2. **pageSize must track the loaded row count.** Call sites seed it via
   `initialState.pagination.pageSize`, which TanStack reads exactly once, so
   `DataTable` re-syncs it on every change while in load-more mode.
3. **Appends are deduped by `id`.** Offset pagination re-serves rows whenever a
   record shifts underneath the cursor; appending blindly yields duplicate React
   keys and visibly repeated rows.

Strings come from `useTableTranslations` (explicit `translations` prop →
`dictionary.common.*` → built-in ar/en), so a table needs no i18n wiring of its
own to render correctly in Arabic. Guarded by `src/tests/table/load-more.test.tsx`.

### Status

**Completion:** 95% | **Blockers:** None

### Integration Points

- **Feature Tables**: `src/components/school-dashboard/*/table.tsx` and `columns.tsx`
- **Server Actions**: Feature-level `actions.ts` use table's `buildPrismaWhere`, `buildPrismaOrderBy`
- **URL State**: nuqs integration for filter/sort/page persistence
- **TanStack Table**: [v8 docs](https://tanstack.com/table/v8)
