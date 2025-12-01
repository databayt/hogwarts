"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

interface UsePlatformDataOptions<TData, TFilters> {
  initialData: TData[];
  total: number;
  perPage?: number;
  fetcher: (params: TFilters & { page: number; perPage: number }) => Promise<{
    rows: TData[];
    total: number;
  }>;
  filters?: TFilters;
}

interface UsePlatformDataReturn<TData> {
  data: TData[];
  total: number;
  currentPage: number;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  optimisticAdd: (item: TData) => void;
  optimisticUpdate: (id: string, updater: (item: TData) => TData) => void;
  optimisticRemove: (id: string) => void;
  setData: React.Dispatch<React.SetStateAction<TData[]>>;
}

/**
 * Hook for managing platform data with optimistic updates and auto-refresh
 */
export function usePlatformData<TData extends { id: string }, TFilters = Record<string, unknown>>(
  options: UsePlatformDataOptions<TData, TFilters>
): UsePlatformDataReturn<TData> {
  const { initialData, total: initialTotal, perPage = 20, fetcher, filters = {} as TFilters } = options;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<TData[]>(initialData);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  // Load more items (infinite scroll / load more button)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await fetcher({ ...filters, page: nextPage, perPage });

      if (result.rows.length > 0) {
        setData((prev) => [...prev, ...result.rows]);
        setCurrentPage(nextPage);
        setTotal(result.total);
      }
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore, fetcher, filters]);

  // Refresh data from server (reset to page 1 with current filters)
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetcher({ ...filters, page: 1, perPage });
      setData(result.rows);
      setTotal(result.total);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to refresh:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, filters, perPage]);

  // Track previous filters to detect changes
  const prevFiltersRef = useRef<string>(JSON.stringify(filters));
  const isFirstRender = useRef(true);

  // Auto-refetch when filters change (skip first render)
  useEffect(() => {
    const currentFilters = JSON.stringify(filters);

    // Skip first render (initialData is already filtered)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevFiltersRef.current = currentFilters;
      return;
    }

    // Only refetch if filters actually changed
    if (currentFilters !== prevFiltersRef.current) {
      prevFiltersRef.current = currentFilters;
      refresh();
    }
  }, [filters, refresh]);

  // Optimistic add - immediately add item to list
  const optimisticAdd = useCallback((item: TData) => {
    setData((prev) => [item, ...prev]);
    setTotal((prev) => prev + 1);
  }, []);

  // Optimistic update - immediately update item in list
  const optimisticUpdate = useCallback((id: string, updater: (item: TData) => TData) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? updater(item) : item))
    );
  }, []);

  // Optimistic remove - immediately remove item from list
  const optimisticRemove = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  return {
    data,
    total,
    currentPage,
    isLoading: isLoading || isPending,
    hasMore,
    loadMore,
    refresh,
    optimisticAdd,
    optimisticUpdate,
    optimisticRemove,
    setData,
  };
}

/**
 * Create a mutation helper with optimistic updates and auto-refresh
 */
export function createPlatformMutation<TInput, TResult>(options: {
  mutationFn: (input: TInput) => Promise<TResult & { success: boolean }>;
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error) => void;
}) {
  return async (input: TInput): Promise<TResult & { success: boolean }> => {
    try {
      const result = await options.mutationFn(input);
      if (result.success) {
        options.onSuccess?.(result);
      }
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      options.onError?.(err);
      throw err;
    }
  };
}
