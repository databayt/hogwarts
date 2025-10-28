"use client";

import { useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { InvoiceRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { InvoiceCreateForm } from "@/components/platform/finance/invoice/form";
import { getInvoicesWithFilters } from "./actions";

interface InvoiceTableProps {
  initialData: InvoiceRow[];
  columns: ColumnDef<InvoiceRow, unknown>[];
  total: number;
  perPage?: number;
}

export function InvoiceTable({ initialData, columns, total, perPage = 20 }: InvoiceTableProps) {
  // State for incremental loading
  const [data, setData] = useState<InvoiceRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getInvoicesWithFilters({ page: nextPage, perPage });

      if (result.success && result.data.length > 0) {
        setData(prev => [...prev, ...result.data]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<InvoiceRow>({
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
          aria-label="Create Invoice"
          title="Create Invoice"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DataTableToolbar>
      <Modal content={<InvoiceCreateForm />} />
    </DataTable>
  );
}
