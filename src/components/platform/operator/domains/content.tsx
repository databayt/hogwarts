"use client";

import { Shell as PageContainer } from "@/components/table/shell";
import { Button } from "@/components/ui/button";
import { DomainsTable } from "./table";
import { domainColumns, type DomainRow } from "./columns";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import { DataTableSkeleton } from "@/components/table/data-table/data-table-skeleton";
import { EmptyState } from "@/components/platform/operator/common/empty-state";
import { approveDomainRequest } from "@/app/(platform)/operator/actions/domains/approve";
import { rejectDomainRequest } from "@/app/(platform)/operator/actions/domains/reject";
import { verifyDomainRequest } from "@/app/(platform)/operator/actions/domains/verify";

type DomainsContentProps = {
  rows: DomainRow[];
  pageCount?: number;
};

export function DomainsContent({ rows, pageCount = -1 }: DomainsContentProps) {
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
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Domain Requests</h1>
          <p className="text-sm text-muted-foreground">Approve, reject, and verify custom domains</p>
        </div>
        {rows ? (
          rows.length > 0 ? (
            <DomainsTable data={rows} columns={domainColumns} pageCount={pageCount} />
          ) : (
            <EmptyState title="No domain requests" description="New requests will appear here." />
          )
        ) : (
          <DataTableSkeleton columnCount={domainColumns.length} />
        )}
      </div>
    </PageContainer>
  );
}


