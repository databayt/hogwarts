"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { TenantsTable } from "./table";
import { tenantColumns, type TenantRow } from "./columns";
import { TenantsSearch } from "./search";
import { DataTableSkeleton } from "@/components/table/data-table/data-table-skeleton";
import { EmptyState } from "@/components/platform/operator/common/empty-state";

type TenantsContentProps = {
  rows: TenantRow[];
  page: number;
  pageCount?: number;
};

export function TenantsContent({ rows, page, pageCount = -1 }: TenantsContentProps) {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Tenants</h1>
            <p className="text-sm text-muted-foreground">Page {page}</p>
          </div>
          <TenantsSearch />
        </div>

        {rows ? (
          rows.length > 0 ? (
            <TenantsTable data={rows} columns={tenantColumns} pageCount={pageCount} />
          ) : (
            <EmptyState title="No tenants found" description="Try adjusting filters or search." />
          )
        ) : (
          <DataTableSkeleton columnCount={tenantColumns.length} />
        )}
      </div>
    </PageContainer>
  );
}


