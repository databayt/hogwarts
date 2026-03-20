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
├── data-table-see-more.tsx         # "See more" pagination
├── data-table-load-more.tsx        # Load more variant
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
├── use-see-more.ts                 # "See more" pagination hook
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

### Status

**Completion:** 95% | **Blockers:** None

### Integration Points

- **Feature Tables**: `src/components/school-dashboard/*/table.tsx` and `columns.tsx`
- **Server Actions**: Feature-level `actions.ts` use table's `buildPrismaWhere`, `buildPrismaOrderBy`
- **URL State**: nuqs integration for filter/sort/page persistence
- **TanStack Table**: [v8 docs](https://tanstack.com/table/v8)
