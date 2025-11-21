"use client";

import { useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { useDataTable } from "@/components/table/use-data-table";
import type { InvoiceRow } from "./columns";
import { Button } from "@/components/ui/button";
import { exportTableToCSV } from "@/components/table/lib/export";
import type { Locale } from "@/components/internationalization/config";
import { getInvoiceColumns } from "./columns";
import { getInvoices } from "./actions";

interface InvoicesTableProps {
  initialData: InvoiceRow[];
  columns?: ColumnDef<InvoiceRow, unknown>[];
  total: number;
  perPage?: number;
  lang: Locale;
}

export function InvoicesTable({ initialData, columns, total, perPage = 10, lang }: InvoicesTableProps) {
  const actualColumns = columns || getInvoiceColumns(lang);

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
      const result = await getInvoices({ page: nextPage, perPage });

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
    columns: actualColumns,
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
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportTableToCSV(table, { filename: "invoices" })}
        >
          Export CSV
        </Button>
      </DataTableToolbar>
    </DataTable>
  );
}


