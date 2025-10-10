"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { InvoicesTable } from "./table";
import { invoiceColumns, type InvoiceRow } from "./columns";
import { DataTableSkeleton } from "@/components/table/data-table/data-table-skeleton";
import { EmptyState } from "@/components/operator/common/empty-state";
import { useState, useEffect } from "react";
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export function BillingContent(props: Props) {
  const [data, setData] = useState<{ rows: InvoiceRow[]; pageCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // For now, use sample data to show the working table structure
    // This can be replaced with actual API call when the endpoint is ready
    const sampleData = {
      rows: [
        {
          id: "1",
          number: "INV-001",
          tenantName: "Sample School",
          period: "2024-01-01 - 2024-01-31",
          amount: 99.99,
          status: "open",
          createdAt: new Date().toISOString()
        }
      ],
      pageCount: 1
    };
    
    setData(sampleData);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h2>Billing</h2>
            <p className="muted">Invoices and receipts</p>
          </div>
          <DataTableSkeleton columnCount={invoiceColumns.length} />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h2>Billing</h2>
            <p className="muted">Invoices and receipts</p>
          </div>
          <EmptyState title="Error loading billing data" description="Please try again later." />
        </div>
      </PageContainer>
    );
  }

  const { rows, pageCount } = data || { rows: [], pageCount: 0 };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h2>Billing</h2>
          <p className="muted">Invoices and receipts</p>
        </div>
        {rows && rows.length > 0 ? (
          <InvoicesTable data={rows} columns={invoiceColumns} pageCount={pageCount} />
        ) : (
          <EmptyState title="No invoices" description="Invoices will appear as billing runs." />
        )}
      </div>
    </PageContainer>
  );
}


