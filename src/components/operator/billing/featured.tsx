"use client";

/**
 * Featured invoices and billing insights component
 *
 * Displays highlighted invoices, overdue items, and billing statistics.
 */

import { InvoiceCard, InvoiceStatsCard, BillingSummaryCard, InvoiceHealthCard } from "./card";
import { FileText, DollarSign, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import type { InvoiceWithSchool, InvoiceStatus } from "./type";
import { isInvoiceOverdue, formatCurrency, getDaysUntilDue } from "./util";

interface FeaturedInvoicesProps {
  invoices: InvoiceWithSchool[];
  maxItems?: number;
  onInvoiceClick?: (invoiceId: string) => void;
  onMarkPaid?: (invoiceId: string) => void;
}

/**
 * Featured invoices with quick stats
 */
export function FeaturedInvoices({
  invoices,
  maxItems = 6,
  onInvoiceClick,
  onMarkPaid,
}: FeaturedInvoicesProps) {
  const featuredInvoices = invoices.slice(0, maxItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3>Featured Invoices</h3>
          <p className="muted">Quick overview of recent and important invoices</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featuredInvoices.map((invoice) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            showActions
            onViewDetails={onInvoiceClick}
            onMarkPaid={onMarkPaid}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Recent invoices
 */
export function RecentInvoices({ invoices, maxItems = 5 }: { invoices: InvoiceWithSchool[]; maxItems?: number }) {
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems);

  return (
    <div className="space-y-4">
      <h4>Recent Invoices</h4>
      <div className="space-y-2">
        {recentInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <h6>{invoice.stripeInvoiceId}</h6>
                <small className="muted">{invoice.school.name}</small>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium tabular-nums">
                {formatCurrency(invoice.amountDue, invoice.currency)}
              </div>
              <small className="muted">
                {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                  Math.ceil(
                    (new Date(invoice.createdAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  ),
                  "day"
                )}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Overdue invoices requiring immediate attention
 */
export function OverdueInvoices({ invoices }: { invoices: InvoiceWithSchool[] }) {
  const overdueInvoices = invoices.filter((invoice) =>
    isInvoiceOverdue(invoice.periodEnd, invoice.status as InvoiceStatus)
  );

  if (overdueInvoices.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10 mx-auto">
          <TrendingUp className="size-6 text-green-600" />
        </div>
        <h5 className="mt-4">All invoices up to date</h5>
        <p className="muted mt-2">No overdue invoices at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-red-600" />
        <h4>Overdue Invoices</h4>
        <span className="rounded-full bg-red-500/10 px-2 py-1">
          <small className="text-red-600">{overdueInvoices.length}</small>
        </span>
      </div>

      <div className="space-y-3">
        {overdueInvoices.map((invoice) => {
          const daysPastDue = Math.abs(getDaysUntilDue(invoice.periodEnd));
          const outstanding = invoice.amountDue - invoice.amountPaid;

          return (
            <div
              key={invoice.id}
              className="flex items-start justify-between rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-red-500/10">
                  <FileText className="size-5 text-red-600" />
                </div>
                <div>
                  <h6>{invoice.stripeInvoiceId}</h6>
                  <small className="muted">{invoice.school.name}</small>
                  <div className="mt-2 space-y-1">
                    <small className="text-red-600">
                      ⚠ Overdue by {daysPastDue} {daysPastDue === 1 ? "day" : "days"}
                    </small>
                    <div className="font-medium tabular-nums">
                      {formatCurrency(outstanding, invoice.currency)} outstanding
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Invoices due soon (within 7 days)
 */
export function InvoicesDueSoon({ invoices, maxItems = 5 }: { invoices: InvoiceWithSchool[]; maxItems?: number }) {
  const dueSoonInvoices = invoices
    .filter((invoice) => {
      if (invoice.status !== "open") return false;
      const daysUntil = getDaysUntilDue(invoice.periodEnd);
      return daysUntil > 0 && daysUntil <= 7;
    })
    .sort((a, b) => getDaysUntilDue(a.periodEnd) - getDaysUntilDue(b.periodEnd))
    .slice(0, maxItems);

  if (dueSoonInvoices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="size-5 text-amber-600" />
        <h4>Due Soon</h4>
        <span className="rounded-full bg-amber-500/10 px-2 py-1">
          <small className="text-amber-600">{dueSoonInvoices.length}</small>
        </span>
      </div>

      <div className="space-y-2">
        {dueSoonInvoices.map((invoice) => {
          const daysUntil = getDaysUntilDue(invoice.periodEnd);

          return (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/10">
                  <FileText className="size-5 text-amber-600" />
                </div>
                <div>
                  <h6>{invoice.stripeInvoiceId}</h6>
                  <small className="muted">{invoice.school.name}</small>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium tabular-nums">
                  {formatCurrency(invoice.amountDue - invoice.amountPaid, invoice.currency)}
                </div>
                <small className="text-amber-600">
                  Due in {daysUntil} {daysUntil === 1 ? "day" : "days"}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Billing overview statistics
 */
export function BillingOverviewStats({ invoices }: { invoices: InvoiceWithSchool[] }) {
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amountPaid, 0);
  const outstandingAmount = invoices.reduce((sum, inv) => sum + (inv.amountDue - inv.amountPaid), 0);
  const overdueCount = invoices.filter((inv) =>
    isInvoiceOverdue(inv.periodEnd, inv.status as InvoiceStatus)
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <InvoiceStatsCard
        title="Total Invoices"
        value={totalInvoices}
        icon={FileText}
        description={`${invoices.filter((i) => i.status === "paid").length} paid`}
      />
      <InvoiceStatsCard
        title="Total Amount"
        value={formatCurrency(totalAmount)}
        icon={DollarSign}
        description="All invoices"
      />
      <InvoiceStatsCard
        title="Outstanding"
        value={formatCurrency(outstandingAmount)}
        icon={TrendingUp}
        description={`${((outstandingAmount / totalAmount) * 100 || 0).toFixed(1)}% of total`}
      />
      <InvoiceStatsCard
        title="Overdue"
        value={overdueCount}
        icon={AlertTriangle}
        description={overdueCount > 0 ? "Requires attention" : "All on track"}
      />
    </div>
  );
}

/**
 * Comprehensive billing dashboard
 */
export function BillingDashboard({ invoices }: { invoices: InvoiceWithSchool[] }) {
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amountPaid, 0);
  const outstandingAmount = invoices.reduce((sum, inv) => sum + (inv.amountDue - inv.amountPaid), 0);

  return (
    <div className="space-y-6">
      <BillingOverviewStats invoices={invoices} />

      <div className="grid gap-6 lg:grid-cols-2">
        <BillingSummaryCard
          totalInvoices={invoices.length}
          totalAmount={totalAmount}
          paidAmount={paidAmount}
          outstandingAmount={outstandingAmount}
        />
        <div className="space-y-4">
          <InvoicesDueSoon invoices={invoices} />
          <OverdueInvoices invoices={invoices} />
        </div>
      </div>

      <RecentInvoices invoices={invoices} />
    </div>
  );
}
