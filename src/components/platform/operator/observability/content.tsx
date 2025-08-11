"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { AuditLogTable } from "./logs-table/table";
import { auditColumns, type AuditRow } from "./logs-table/columns";
import { DataTableSkeleton } from "@/components/table/data-table/data-table-skeleton";
import { EmptyState } from "@/components/platform/operator/common/empty-state";

type ObservabilityContentProps = {
  rows: AuditRow[];
};

export function ObservabilityContent({ rows }: ObservabilityContentProps) {
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Recent sensitive operator actions</p>
        </div>
        {rows ? (
          rows.length > 0 ? (
            <AuditLogTable data={rows} columns={auditColumns} />
          ) : (
            <EmptyState title="No audit entries" description="Actions will be listed here as they happen." />
          )
        ) : (
          <DataTableSkeleton columnCount={auditColumns.length} />
        )}
      </div>
    </PageContainer>
  );
}


