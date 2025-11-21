"use client";

import { useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/table/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { useDataTable } from "@/components/table/use-data-table";
import { parentColumns, type ParentRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { ParentCreateForm } from "@/components/platform/parents/form";
import { getParents } from "./actions";

interface ParentsTableProps {
  initialData: ParentRow[];
  total: number;
  perPage?: number;
}

export function ParentsTable({ initialData, total, perPage = 20 }: ParentsTableProps) {
  // Generate columns on the client side with hooks
  const columns = useMemo(() => parentColumns, []);

  // State for incremental loading
  const [data, setData] = useState<ParentRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getParents({ page: nextPage, perPage });

      if (result.rows.length > 0) {
        setData(prev => [...prev, ...result.rows as any]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more parents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<ParentRow>({
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

  const { openModal } = useModal();

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      <DataTableToolbar table={table}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => openModal()}
          aria-label="Create"
          title="Create"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DataTableToolbar>
      <Modal content={<ParentCreateForm />} />
    </DataTable>
  );
}
