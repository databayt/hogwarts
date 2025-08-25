"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { Button } from "@/components/ui/button";
import { DomainsTable } from "./table";
import { domainColumns, type DomainRow } from "./columns";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import { DataTableSkeleton } from "@/components/table/data-table/data-table-skeleton";
import { EmptyState } from "@/components/operator/common/empty-state";
import { approveDomainRequest } from "@/components/operator/actions/domains/approve";
import { rejectDomainRequest } from "@/components/operator/actions/domains/reject";
import { verifyDomainRequest } from "@/components/operator/actions/domains/verify";
import { useState, useEffect } from "react";

export function DomainsContent() {
  const [data, setData] = useState<{ rows: DomainRow[]; pageCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // For now, use sample data to show the working table structure
    // This can be replaced with actual API call when the endpoint is ready
    const sampleData = {
      rows: [
        {
          id: "1",
          schoolName: "Sample School",
          domain: "example.com",
          status: "pending",
          createdAt: new Date().toISOString()
        }
      ],
      pageCount: 1
    };
    
    setData(sampleData);
    setIsLoading(false);
  }, []);

  const onApprove = async (id: string) => {
    const notes = prompt("Approval notes (optional)") || undefined;
    try {
      await approveDomainRequest(id, notes);
      SuccessToast();
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Approval failed");
    }
  };

  const onReject = async (id: string) => {
    const notes = prompt("Rejection notes (optional)") || undefined;
    try {
      await rejectDomainRequest(id, notes);
      SuccessToast();
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Rejection failed");
    }
  };

  const onVerify = async (id: string) => {
    try {
      await verifyDomainRequest(id);
      SuccessToast();
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Verification failed");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h4>Domain Requests</h4>
            <p className="muted">Approve, reject, and verify custom domains</p>
          </div>
          <DataTableSkeleton columnCount={domainColumns.length} />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <h4>Domain Requests</h4>
            <p className="muted">Approve, reject, and verify custom domains</p>
          </div>
          <EmptyState title="Error loading domain requests" description="Please try again later." />
        </div>
      </PageContainer>
    );
  }

  const { rows, pageCount } = data || { rows: [], pageCount: 0 };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h4>Domain Requests</h4>
          <p className="muted">Approve, reject, and verify custom domains</p>
        </div>
        {rows && rows.length > 0 ? (
          <DomainsTable data={rows} columns={domainColumns} pageCount={pageCount} />
        ) : (
          <EmptyState title="No domain requests" description="New requests will appear here." />
        )}
      </div>
    </PageContainer>
  );
}


