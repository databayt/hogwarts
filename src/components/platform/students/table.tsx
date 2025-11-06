"use client";

import { useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import { getStudentColumns, type StudentRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { StudentCreateForm } from "@/components/platform/students/form";
import { ExportButton } from "./export-button";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { getStudents } from "./actions";

interface StudentsTableProps {
  initialData: StudentRow[];
  total: number;
  dictionary?: Dictionary['school']['students'];
  perPage?: number;
}

export function StudentsTable({ initialData, total, dictionary, perPage = 20 }: StudentsTableProps) {
  // Generate columns on the client side with hooks
  const columns = useMemo(() => getStudentColumns(dictionary), [dictionary]);

  // State for incremental loading
  const [data, setData] = useState<StudentRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getStudents({ page: nextPage, perPage });

      if (result.rows.length > 0) {
        setData(prev => [...prev, ...result.rows as any]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more students:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<StudentRow>({
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
      <Modal content={<StudentCreateForm dictionary={dictionary} />} />
    </DataTable>
  );
}



