"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { formatDate } from "@/lib/i18n-format"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import {
  tenantChangePlan,
  tenantEndTrial,
  tenantStartImpersonation,
  tenantStopImpersonation,
  tenantToggleActive,
} from "@/components/saas-dashboard/tenants/actions"

type TenantDetailProps = {
  tenantId: string
  name: string
  domain: string
  planType: string
  isActive: boolean
  dictionary?: any
}

export function TenantDetail({
  tenantId,
  name,
  domain,
  planType,
  isActive,
  dictionary,
}: TenantDetailProps) {
  const d = dictionary?.operator?.tenants?.detail
  const cs = dictionary?.operator?.common?.status
  const [open, setOpen] = React.useState(false)
  const [owners, setOwners] = React.useState<
    Array<{ id: string; email: string }>
  >([])
  const [metrics, setMetrics] = React.useState<{
    students: number
    teachers: number
    classes: number
  } | null>(null)
  const [billing, setBilling] = React.useState<{
    planType: string
    outstandingCents: number
    trialEndsAt: string | null
    nextInvoiceDate: string | null
  } | null>(null)
  const [invoices, setInvoices] = React.useState<
    Array<{
      id: string
      number: string
      status: string
      amount: number
      createdAt: string
    }>
  >([])
  React.useEffect(() => {
    if (!open) return
    void fetch(`/operator/tenants/${tenantId}/summary`)
      .then((r) => r.json())
      .then((json) => {
        setOwners(json.owners ?? [])
        setMetrics(json.metrics ?? null)
      })
      .catch(() => {
        setOwners([])
        setMetrics(null)
      })
    void fetch(`/operator/tenants/${tenantId}/billing`)
      .then((r) => r.json())
      .then((json) => setBilling(json))
      .catch(() => setBilling(null))
    void fetch(`/operator/tenants/${tenantId}/invoices`)
      .then((r) => r.json())
      .then((json) => setInvoices(json.invoices ?? []))
      .catch(() => setInvoices([]))
  }, [open, tenantId])
  const onImpersonate = async () => {
    const reason = prompt(`Reason to impersonate ${name}?`) || ""
    try {
      const result = await tenantStartImpersonation({ tenantId, reason })
      if (result.success) {
        SuccessToast(
          d?.impersonationStarted || "Impersonation started successfully"
        )
      } else {
        ErrorToast(result.error.message)
      }
    } catch (e) {
      ErrorToast(
        e instanceof Error
          ? e.message
          : d?.failedToImpersonate || "Failed to impersonate"
      )
    }
  }
  const onStopImpersonate = async () => {
    const reason = prompt("Reason to stop impersonation?") || ""
    try {
      const result = await tenantStopImpersonation({ reason })
      if (result.success) {
        SuccessToast(
          d?.impersonationStopped || "Impersonation stopped successfully"
        )
      } else {
        ErrorToast(result.error.message)
      }
    } catch (e) {
      ErrorToast(
        e instanceof Error
          ? e.message
          : d?.failedToStopImpersonation || "Failed to stop impersonation"
      )
    }
  }
  const onToggleActive = async () => {
    const reason =
      prompt(`Reason to ${isActive ? "suspend" : "activate"} ${name}?`) || ""
    try {
      const result = await tenantToggleActive({ tenantId, reason })
      if (result.success) {
        SuccessToast(d?.statusToggled || "Status toggled successfully")
      } else {
        ErrorToast(result.error.message)
      }
    } catch (e) {
      ErrorToast(
        e instanceof Error
          ? e.message
          : d?.failedToToggleStatus || "Failed to toggle status"
      )
    }
  }
  const onChangePlan = async () => {
    const next =
      prompt("New plan (TRIAL/BASIC/PREMIUM/ENTERPRISE)?", planType) || planType
    const reason = prompt("Reason to change plan?") || ""
    try {
      const result = await tenantChangePlan({
        tenantId,
        planType: next as any,
        reason,
      })
      if (result.success) {
        SuccessToast(d?.planChanged || "Plan changed successfully")
      } else {
        ErrorToast(result.error.message)
      }
    } catch (e) {
      ErrorToast(
        e instanceof Error
          ? e.message
          : d?.failedToChangePlan || "Failed to change plan"
      )
    }
  }
  const onEndTrial = async () => {
    const reason = prompt("Reason to end trial?") || ""
    try {
      const result = await tenantEndTrial({ tenantId, reason })
      if (result.success) {
        SuccessToast(d?.trialEnded || "Trial ended successfully")
      } else {
        ErrorToast(result.error.message)
      }
    } catch (e) {
      ErrorToast(
        e instanceof Error
          ? e.message
          : d?.failedToEndTrial || "Failed to end trial"
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          {d?.details || "Details"}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{d?.tenantDetails || "Tenant details"}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <Card className="p-4 text-sm">
            <div className="font-medium">{name}</div>
            <div className="text-muted-foreground">{domain}</div>
            <div className="mt-2 flex gap-4">
              <span className="text-xs">
                {d?.plan || "Plan"}: {planType}
              </span>
              <span className="text-xs">
                {d?.status || "Status"}:{" "}
                {isActive ? cs?.active || "Active" : cs?.inactive || "Inactive"}
              </span>
            </div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="mb-2 font-medium">{d?.billing || "Billing"}</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground text-xs">
                  {d?.plan || "Plan"}
                </div>
                <div className="font-medium">
                  {billing?.planType ?? planType}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {d?.outstanding || "Outstanding"}
                </div>
                <div className="font-medium tabular-nums">
                  ${((billing?.outstandingCents ?? 0) / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {d?.trialEnds || "Trial ends"}
                </div>
                <div className="font-medium">
                  {billing?.trialEndsAt
                    ? formatDate(billing.trialEndsAt, "en")
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {d?.nextInvoice || "Next invoice"}
                </div>
                <div className="font-medium">
                  {billing?.nextInvoiceDate
                    ? formatDate(billing.nextInvoiceDate, "en")
                    : "-"}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4 text-sm">
            <div className="mb-2 font-medium">
              {d?.recentInvoices || "Recent Invoices"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1 text-start">
                      {d?.invoice || "Invoice"}
                    </th>
                    <th className="px-2 py-1 text-start">
                      {d?.status || "Status"}
                    </th>
                    <th className="px-2 py-1 text-start">
                      {d?.amount || "Amount"}
                    </th>
                    <th className="px-2 py-1 text-start">
                      {d?.date || "Date"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="px-2 py-1">{i.number}</td>
                      <td className="px-2 py-1 capitalize">{i.status}</td>
                      <td className="px-2 py-1 tabular-nums">
                        ${(i.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-2 py-1">
                        {formatDate(i.createdAt, "en")}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td
                        className="text-muted-foreground px-2 py-2"
                        colSpan={4}
                      >
                        {d?.noInvoicesFound || "No invoices found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 text-sm">
            <div className="mb-2 font-medium">{d?.owners || "Owners"}</div>
            {owners.length === 0 ? (
              <div className="text-muted-foreground">
                {d?.noOwnersFound || "No owners found"}
              </div>
            ) : (
              <ul className="list-disc ps-5">
                {owners.map((o) => (
                  <li key={o.id}>{o.email}</li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4 text-sm">
            <div className="mb-2 font-medium">{d?.usage || "Usage"}</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-muted-foreground text-xs">
                  {d?.students || "Students"}
                </div>
                <div className="text-lg font-semibold">
                  {metrics?.students ?? 0}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {d?.teachers || "Teachers"}
                </div>
                <div className="text-lg font-semibold">
                  {metrics?.teachers ?? 0}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">
                  {d?.classes || "Classes"}
                </div>
                <div className="text-lg font-semibold">
                  {metrics?.classes ?? 0}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onImpersonate}>
              {d?.startImpersonation || "Start impersonation"}
            </Button>
            <Button size="sm" variant="outline" onClick={onStopImpersonate}>
              {d?.stopImpersonation || "Stop impersonation"}
            </Button>
            <Button size="sm" variant="secondary" onClick={onToggleActive}>
              {isActive ? d?.suspend || "Suspend" : d?.activate || "Activate"}
            </Button>
            <Button size="sm" variant="outline" onClick={onChangePlan}>
              {d?.changePlan || "Change plan"}
            </Button>
            <Button size="sm" variant="outline" onClick={onEndTrial}>
              {d?.endTrial || "End trial"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
