"use client";

/**
 * Featured invoices lab component
 *
 * Displays key invoice metrics and important invoices.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Clock, AlertCircle } from "lucide-react";
import { formatCurrency, isInvoiceOverdue, getDaysOverdue } from "./util";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate: Date;
}

interface FeaturedInvoicesProps {
  invoices: Invoice[];
}

export function FeaturedInvoices({ invoices }: FeaturedInvoicesProps) {
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status !== "paid" && inv.status !== "void")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueInvoices = invoices.filter((inv) => isInvoiceOverdue(inv.dueDate, inv.status));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              <small>Total Revenue</small>
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h2 className="font-bold">{formatCurrency(totalRevenue)}</h2>
            <small className="muted">Paid invoices</small>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              <small>Pending</small>
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h2 className="font-bold">{formatCurrency(pendingAmount)}</h2>
            <small className="muted">Awaiting payment</small>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              <small>Overdue</small>
            </CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h2 className="font-bold">{overdueInvoices.length}</h2>
            <small className="muted">Require attention</small>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>
              <small>Total Invoices</small>
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <h2 className="font-bold">{invoices.length}</h2>
            <small className="muted">All time</small>
          </CardContent>
        </Card>
      </div>

      {/* Overdue invoices */}
      {overdueInvoices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600" />
            <h4>Overdue Invoices</h4>
            <span className="rounded-full bg-red-500/10 px-2 py-1">
              <small className="text-red-600">{overdueInvoices.length}</small>
            </span>
          </div>

          <div className="space-y-2">
            {overdueInvoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10 p-4"
              >
                <div>
                  <h6>{invoice.invoiceNumber}</h6>
                  <small className="muted">{invoice.clientName}</small>
                </div>
                <div className="text-right">
                  <div className="font-medium tabular-nums">{formatCurrency(invoice.amount)}</div>
                  <small className="text-red-600">
                    {getDaysOverdue(invoice.dueDate)} days overdue
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent invoices */}
      <div className="space-y-4">
        <h4>Recent Invoices</h4>
        <div className="space-y-2">
          {invoices.slice(0, 5).map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h6>{invoice.invoiceNumber}</h6>
                <small className="muted">{invoice.clientName}</small>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-medium tabular-nums">{formatCurrency(invoice.amount)}</div>
                <Badge variant={invoice.status === "paid" ? "default" : "outline"}>
                  {invoice.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
