"use client";

import { useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/table/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { useDataTable } from "@/components/table/use-data-table";
import { getAssignmentColumns, type AssignmentRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "@aliimam/icons";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { AssignmentCreateForm } from "@/components/platform/assignments/form";
import { ExportButton } from "./export-button";
import { getAssignments } from "./actions";

interface AssignmentsTableProps {
  initialData: AssignmentRow[];
  total: number;
  perPage?: number;
}

export function AssignmentsTable({ initialData, total, perPage = 20 }: AssignmentsTableProps) {
  const columns = useMemo(() => getAssignmentColumns(), []);

  // State for incremental loading
  const [data, setData] = useState<AssignmentRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getAssignments({ page: nextPage, perPage });

      if (result.rows.length > 0) {
        setData(prev => [...prev, ...result.rows]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more assignments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<AssignmentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length, // Show all loaded data
      },
      columnVisibility: {
        // Default visible: title, className, dueDate, status
        type: false,
        totalPoints: false,
        createdAt: false,
      },
    },
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
        <div className="flex items-center gap-2">
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
          <ExportButton />
        </div>
      </DataTableToolbar>
      <Modal content={<AssignmentCreateForm />} />
    </DataTable>
  );
}
