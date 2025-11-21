"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { AuditLogTable } from "./logs-table/table";
import { auditColumns, type AuditRow } from "./logs-table/columns";
import { DataTableSkeleton } from "@/components/table/data-table-skeleton";
import { EmptyState } from "@/components/operator/common/empty-state";
import { useState, useEffect } from "react";
import type { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export function ObservabilityContent(props: Props) {
  const [data, setData] = useState<{ rows: AuditRow[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // For now, use sample data to show the working table structure
    // This can be replaced with actual API call when the endpoint is ready
    const sampleData = {
      rows: [
        {
          id: "1",
          createdAt: new Date().toISOString(),
          userEmail: "admin@example.com",
          schoolName: "Sample School",
          action: "login",
          reason: null,
          ip: "192.168.1.1",
          level: "info",
          requestId: "req-123"
        }
      ]
    };
    
    setData(sampleData);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">Recent sensitive operator actions</p>
          </div>
          <DataTableSkeleton columnCount={auditColumns.length} />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">Audit Logs</h1>
            <p className="text-sm text-muted-foreground">Recent sensitive operator actions</p>
          </div>
          <EmptyState title="Error loading audit logs" description="Please try again later." />
        </div>
      </PageContainer>
    );
  }

  const { rows } = data || { rows: [] };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Recent sensitive operator actions</p>
        </div>
        {rows && rows.length > 0 ? (
          <AuditLogTable data={rows} columns={auditColumns} />
        ) : (
          <EmptyState title="No audit entries" description="Actions will be listed here as they happen." />
        )}
      </div>
    </PageContainer>
  );
}


