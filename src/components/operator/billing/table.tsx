"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { InvoiceRow } from "./columns";
import { Button } from "@/components/ui/button";
import { exportTableToCSV } from "@/components/table/lib/export";
import type { Locale } from "@/components/internationalization/config";
import { getInvoiceColumns } from "./columns";

export function InvoicesTable({ data, columns, pageCount, lang }: { data: InvoiceRow[]; columns?: ColumnDef<InvoiceRow, unknown>[]; pageCount: number; lang: Locale }) {
  const actualColumns = columns || getInvoiceColumns(lang);
  const { table } = useDataTable<InvoiceRow>({
    data,
    columns: actualColumns,
    pageCount,
  });

  return (
    <DataTable table={table}>
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


