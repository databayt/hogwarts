"use client";

import { useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import { getClassColumns, type ClassRow } from "./columns";
import { AddClassButton } from "@/components/platform/classes/form";
import { ExportButton } from "./export-button";
import { getClasses } from "./actions";

interface ClassesTableProps {
  initialData: ClassRow[];
  total: number;
  perPage?: number;
}

export function ClassesTable({ initialData, total, perPage = 20 }: ClassesTableProps) {
  // Generate columns on the client side with hooks
  const columns = useMemo(() => getClassColumns(), []);

  // State for incremental loading
  const [data, setData] = useState<ClassRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getClasses({ page: nextPage, perPage });

      if (result.rows.length > 0) {
        setData(prev => [...prev, ...result.rows]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more classes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<ClassRow>({
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
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
          <AddClassButton />
          <ExportButton />
        </div>
      </DataTableToolbar>
    </DataTable>
  );
}








