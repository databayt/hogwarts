"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { startImpersonation } from "@/components/operator/actions/impersonation/start";
import { stopImpersonation } from "@/components/operator/actions/impersonation/stop";
import { toggleTenantActive } from "@/components/operator/actions/tenants/toggle-active";
// change plan action not present; remove import and button for now or implement
import { endTenantTrial } from "@/components/operator/actions/tenants/end-trial";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

type TenantDetailProps = {
  tenantId: string;
  name: string;
  domain: string;
  planType: string;
  isActive: boolean;
};

export function TenantDetail({ tenantId, name, domain, planType, isActive }: TenantDetailProps) {
  const [open, setOpen] = React.useState(false);
  const [owners, setOwners] = React.useState<Array<{ id: string; email: string }>>([]);
  const [metrics, setMetrics] = React.useState<{ students: number; teachers: number; classes: number } | null>(null);
  const [billing, setBilling] = React.useState<{ planType: string; outstandingCents: number; trialEndsAt: string | null; nextInvoiceDate: string | null } | null>(null);
  const [invoices, setInvoices] = React.useState<Array<{ id: string; number: string; status: string; amount: number; createdAt: string }>>([]);
  React.useEffect(() => {
    if (!open) return;
    void fetch(`/operator/tenants/${tenantId}/summary`)
      .then((r) => r.json())
      .then((json) => {
        setOwners(json.owners ?? []);
        setMetrics(json.metrics ?? null);
      })
      .catch(() => {
        setOwners([]);
        setMetrics(null);
      });
    void fetch(`/operator/tenants/${tenantId}/billing`)
      .then((r) => r.json())
      .then((json) => setBilling(json))
      .catch(() => setBilling(null));
    void fetch(`/operator/tenants/${tenantId}/invoices`)
      .then((r) => r.json())
      .then((json) => setInvoices(json.invoices ?? []))
      .catch(() => setInvoices([]));
  }, [open, tenantId]);
  const onImpersonate = async () => {
    const reason = prompt(`Reason to impersonate ${name}?`) || "";
    try {
      await startImpersonation(tenantId, reason);
      SuccessToast();
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to impersonate");
    }
  };
  const onStopImpersonate = async () => {
    const reason = prompt("Reason to stop impersonation?") || "";
    try {
      await stopImpersonation(reason);
      SuccessToast();
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to stop impersonation");
    }
  };
  const onToggleActive = async () => {
    const reason = prompt(`Reason to ${isActive ? "suspend" : "activate"} ${name}?`) || "";
    try {
      await toggleTenantActive(tenantId, reason);
      SuccessToast();
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to toggle status");
    }
  };
  // const onChangePlan = async () => {
  //   const next = prompt("New plan (basic/pro/enterprise)?", planType) || planType;
  //   const reason = prompt("Reason to change plan?") || "";
  //   try {
  //     await changeTenantPlan({ tenantId, planType: next, reason });
  //     SuccessToast();
  //   } catch (e) {
  //     ErrorToast(e instanceof Error ? e.message : "Failed to change plan");
  //   }
  // };
  const onEndTrial = async () => {
    const reason = prompt("Reason to end trial?") || "";
    try {
      await endTenantTrial({ tenantId, reason });
      SuccessToast();
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : "Failed to end trial");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">Details</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Tenant details</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <Card className="p-4 text-sm">
            <div className="font-medium">{name}</div>
            <div className="text-muted-foreground">{domain}</div>
            <div className="mt-2 flex gap-4">
              <span className="text-xs">Plan: {planType}</span>
              <span className="text-xs">Status: {isActive ? "Active" : "Inactive"}</span>
            </div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="font-medium mb-2">Billing</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Plan</div>
                <div className="font-medium">{billing?.planType ?? planType}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Outstanding</div>
                <div className="font-medium tabular-nums">${((billing?.outstandingCents ?? 0) / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Trial ends</div>
                <div className="font-medium">{billing?.trialEndsAt ? new Date(billing.trialEndsAt).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Next invoice</div>
                <div className="font-medium">{billing?.nextInvoiceDate ? new Date(billing.nextInvoiceDate).toLocaleDateString() : '-'}</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="font-medium mb-2">Recent Invoices</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-left">Invoice</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Amount</th>
                    <th className="px-2 py-1 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="px-2 py-1">{i.number}</td>
                      <td className="px-2 py-1 capitalize">{i.status}</td>
                      <td className="px-2 py-1 tabular-nums">${(i.amount / 100).toFixed(2)}</td>
                      <td className="px-2 py-1">{new Date(i.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td className="px-2 py-2 text-muted-foreground" colSpan={4}>No invoices found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 text-sm">
            <div className="font-medium mb-2">Owners</div>
            {owners.length === 0 ? (
              <div className="text-muted-foreground">No owners found</div>
            ) : (
              <ul className="list-disc pl-5">
                {owners.map((o) => (
                  <li key={o.id}>{o.email}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4 text-sm">
            <div className="font-medium mb-2">Usage</div>
            <div className="grid grid-cols-3 gap-4">
              <div><div className="text-xs text-muted-foreground">Students</div><div className="text-lg font-semibold">{metrics?.students ?? 0}</div></div>
              <div><div className="text-xs text-muted-foreground">Teachers</div><div className="text-lg font-semibold">{metrics?.teachers ?? 0}</div></div>
              <div><div className="text-xs text-muted-foreground">Classes</div><div className="text-lg font-semibold">{metrics?.classes ?? 0}</div></div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onImpersonate}>Start impersonation</Button>
            <Button size="sm" variant="outline" onClick={onStopImpersonate}>Stop impersonation</Button>
            <Button size="sm" variant="secondary" onClick={onToggleActive}>{isActive ? "Suspend" : "Activate"}</Button>
            {/* <Button size="sm" variant="outline" onClick={onChangePlan}>Change plan</Button> */}
            <Button size="sm" variant="outline" onClick={onEndTrial}>End trial</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


