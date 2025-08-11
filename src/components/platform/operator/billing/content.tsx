"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { InvoicesTable } from "./table";
import { invoiceColumns, type InvoiceRow } from "./columns";
import { DataTableSkeleton } from "@/components/table/data-table/data-table-skeleton";
import { EmptyState } from "@/components/platform/operator/common/empty-state";

export function BillingContent({ rows, pageCount }: { rows: InvoiceRow[]; pageCount: number }) {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="text-sm text-muted-foreground">Invoices and receipts</p>
        </div>
        {rows ? (
          rows.length > 0 ? (
            <InvoicesTable data={rows} columns={invoiceColumns} pageCount={pageCount} />
          ) : (
            <EmptyState title="No invoices" description="Invoices will appear as billing runs." />
          )
        ) : (
          <DataTableSkeleton columnCount={invoiceColumns.length} />
        )}
      </div>
    </PageContainer>
  );
}


