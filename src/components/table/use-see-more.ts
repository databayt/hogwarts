/**
 * useSeeMore Hook
 * Custom hook for "see more" pagination pattern with URL state management
 */

"use client";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  type UseQueryStateOptions,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { useDebouncedCallback } from "./use-debounced-callback";
import { getSortingStateParser } from "./utils";
import type { ExtendedColumnSort, SeeMorePaginationState } from "./types";
import { paginationConfig } from "./config";

const LOADED_COUNT_KEY = "loadedCount";
const BATCH_SIZE_KEY = "batchSize";
const SORT_KEY = "sort";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

interface UseSeeMoreProps<TData>
  extends Omit<
      TableOptions<TData>,
      | "state"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    > {
  /**
   * Total number of records available on the server
   */
  totalCount: number;
  /**
   * Initial state for the table
   */
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  /**
   * History mode for URL updates
   */
  history?: "push" | "replace";
  /**
   * Debounce time in milliseconds for filter updates
   */
  debounceMs?: number;
  /**
   * Throttle time in milliseconds
   */
  throttleMs?: number;
  /**
   * Clear URL params when they match default values
   */
  clearOnDefault?: boolean;
  /**
   * Enable advanced filter UI
   */
  enableAdvancedFilter?: boolean;
  /**
   * Scroll to top on state change
   */
  scroll?: boolean;
  /**
   * Use shallow routing
   */
  shallow?: boolean;
  /**
   * React transition function
   */
  startTransition?: React.TransitionStartFunction;
  /**
   * Callback when "see more" is triggered
   */
  onSeeMore?: (newLoadedCount: number, batchSize: number) => Promise<void>;
}

export function useSeeMore<TData>(props: UseSeeMoreProps<TData>) {
  const {
    columns,
    data: initialData,
    totalCount,
    initialState,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    onSeeMore,
    ...tableProps
  } = props;

  const queryStateOptions = React.useMemo<
    Omit<UseQueryStateOptions<string>, "parse">
  >(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    ]
  );

  // ============================================================================
  // State Management
  // ============================================================================

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  // Track loaded count in URL
  const [loadedCount, setLoadedCount] = useQueryState(
    LOADED_COUNT_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(initialData.length)
  );

  // Track batch size in URL
  const [batchSize, setBatchSize] = useQueryState(
    BATCH_SIZE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(paginationConfig.defaultBatchSize)
  );

  // Accumulated data state
  const [accumulatedData, setAccumulatedData] = React.useState<TData[]>(initialData);

  // Loading state for "see more" action
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Pagination state for TanStack Table
  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: 0,
      pageSize: accumulatedData.length,
    };
  }, [accumulatedData.length]);

  // See more pagination state
  const seeMoreState: SeeMorePaginationState = React.useMemo(() => ({
    loadedCount,
    batchSize,
    hasMore: loadedCount < totalCount,
    total: totalCount,
  }), [loadedCount, batchSize, totalCount]);

  // ============================================================================
  // Sorting
  // ============================================================================

  const columnIds = React.useMemo(() => {
    return new Set(
      columns.map((column) => column.id).filter(Boolean) as string[]
    );
  }, [columns]);

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? [])
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === "function") {
        const newSorting = updaterOrValue(sorting);
        setSorting(newSorting as ExtendedColumnSort<TData>[]);
      } else {
        setSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
      }
      // Reset loaded data when sorting changes
      setLoadedCount(batchSize);
      setAccumulatedData(initialData.slice(0, batchSize));
    },
    [sorting, setSorting, batchSize, initialData, setLoadedCount]
  );

  // ============================================================================
  // Filtering
  // ============================================================================

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<
      Record<string, Parser<string> | Parser<string[]>>
    >((acc, column) => {
      if (column.meta?.options) {
        acc[column.id ?? ""] = parseAsArrayOf(
          parseAsString,
          ARRAY_SEPARATOR
        ).withOptions(queryStateOptions);
      } else {
        acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
      }
      return acc;
    }, {});
  }, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: typeof filterValues) => {
      void setFilterValues(values);
      // Reset loaded data when filters change
      void setLoadedCount(batchSize);
      setAccumulatedData(initialData.slice(0, batchSize));
    },
    debounceMs
  );

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          const processedValue = Array.isArray(value)
            ? value
            : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
            ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
            : [value];

          filters.push({
            id: key,
            value: processedValue,
          });
        }
        return filters;
      },
      []
    );
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;

        const filterUpdates = next.reduce<
          Record<string, string | string[] | null>
        >((acc, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            acc[filter.id] = filter.value as string | string[];
          }
          return acc;
        }, {});

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter]
  );

  // ============================================================================
  // See More Handler
  // ============================================================================

  const handleSeeMore = React.useCallback(async () => {
    if (!seeMoreState.hasMore || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const newLoadedCount = loadedCount + batchSize;

      // Call the onSeeMore callback if provided
      if (onSeeMore) {
        await onSeeMore(newLoadedCount, batchSize);
      }

      // Update URL state
      void setLoadedCount(newLoadedCount);
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [seeMoreState.hasMore, isLoadingMore, loadedCount, batchSize, onSeeMore, setLoadedCount]);

  // Update accumulated data when initial data changes
  React.useEffect(() => {
    setAccumulatedData(initialData);
  }, [initialData]);

  // ============================================================================
  // Table Instance
  // ============================================================================

  const table = useReactTable({
    ...tableProps,
    data: accumulatedData,
    columns,
    initialState,
    pageCount: -1, // Not used in see more mode
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: false, // Client-side pagination for accumulated data
    manualSorting: true, // Server-side sorting
    manualFiltering: true, // Server-side filtering
  });

  return {
    table,
    seeMoreState,
    handleSeeMore,
    isLoadingMore,
    shallow,
    debounceMs,
    throttleMs,
  };
}
