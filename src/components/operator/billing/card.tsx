"use client"

/**
 * Billing card components for displaying invoice and receipt information
 *
 * Reusable card components for showing billing details in various layouts.
 */
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { INVOICE_STATUS_VARIANTS, RECEIPT_STATUS_VARIANTS } from "./config"
import type {
  InvoiceStatus,
  InvoiceWithSchool,
  ReceiptStatus,
  ReceiptWithInvoice,
} from "./types"
import {
  formatBillingPeriod,
  formatCurrency,
  formatDueStatus,
  getInvoiceHealth,
  getInvoiceStatusLabel,
  getReceiptStatusLabel,
  isInvoiceOverdue,
} from "./util"

interface InvoiceCardProps {
  invoice: InvoiceWithSchool
  showActions?: boolean
  onViewDetails?: (invoiceId: string) => void
  onMarkPaid?: (invoiceId: string) => void
}

/**
 * Basic invoice card with essential information
 */
export function InvoiceCard({
  invoice,
  showActions = false,
  onViewDetails,
  onMarkPaid,
}: InvoiceCardProps) {
  const outstanding = invoice.amountDue - invoice.amountPaid
  const isOverdue = isInvoiceOverdue(
    invoice.periodEnd,
    invoice.status as InvoiceStatus
  )

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Invoice {invoice.stripeInvoiceId}
            </CardTitle>
            <CardDescription>{invoice.school.name}</CardDescription>
          </div>
          <Badge
            variant={INVOICE_STATUS_VARIANTS[invoice.status as InvoiceStatus]}
          >
            {getInvoiceStatusLabel(invoice.status as InvoiceStatus)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <small className="muted">Period</small>
          <div className="font-medium">
            {formatBillingPeriod(invoice.periodStart, invoice.periodEnd)}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <small className="muted">Amount</small>
          <div className="font-medium tabular-nums">
            {formatCurrency(invoice.amountDue, invoice.currency)}
          </div>
        </div>
        {outstanding > 0 && (
          <div className="flex items-center justify-between">
            <small className="muted">Outstanding</small>
            <div className="font-medium text-amber-600 tabular-nums">
              {formatCurrency(outstanding, invoice.currency)}
            </div>
          </div>
        )}
        {isOverdue && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-2 dark:bg-red-950/10">
            <AlertCircle className="size-4 text-red-600" />
            <small className="text-red-600">
              {formatDueStatus(
                invoice.periodEnd,
                invoice.status as InvoiceStatus
              )}
            </small>
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(invoice.id)}
            className="flex-1"
          >
            View Details
          </Button>
          {invoice.status === "open" && outstanding > 0 && (
            <Button
              size="sm"
              onClick={() => onMarkPaid?.(invoice.id)}
              className="flex-1"
            >
              Mark Paid
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

/**
 * Compact invoice card for list views
 */
export function InvoiceCompactCard({
  invoice,
}: {
  invoice: InvoiceWithSchool
}) {
  const outstanding = invoice.amountDue - invoice.amountPaid

  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
          <FileText className="text-primary size-5" />
        </div>
        <div>
          <h6>{invoice.stripeInvoiceId}</h6>
          <small className="muted">{invoice.school.name}</small>
        </div>
      </div>
      <div className="text-end">
        <div className="font-medium tabular-nums">
          {formatCurrency(outstanding, invoice.currency)}
        </div>
        <Badge
          variant={INVOICE_STATUS_VARIANTS[invoice.status as InvoiceStatus]}
          className="mt-1"
        >
          {invoice.status}
        </Badge>
      </div>
    </Card>
  )
}

/**
 * Invoice statistics card
 */
export function InvoiceStatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description?: string
  trend?: { value: number; label: string }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>
          <small>{title}</small>
        </CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <h2 className="font-bold">{value}</h2>
        {description && <small className="muted">{description}</small>}
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <small
              className={trend.value >= 0 ? "text-green-600" : "text-red-600"}
            >
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </small>
            <small className="muted">{trend.label}</small>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Receipt card
 */
export function ReceiptCard({
  receipt,
  showActions = false,
  onApprove,
  onReject,
}: {
  receipt: ReceiptWithInvoice
  showActions?: boolean
  onApprove?: (receiptId: string) => void
  onReject?: (receiptId: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              {receipt.fileName}
            </CardTitle>
            <CardDescription>
              {receipt.school.name} • Invoice {receipt.invoice.number}
            </CardDescription>
          </div>
          <Badge
            variant={RECEIPT_STATUS_VARIANTS[receipt.status as ReceiptStatus]}
          >
            {getReceiptStatusLabel(receipt.status as ReceiptStatus)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <small className="muted">Amount</small>
          <div className="font-medium tabular-nums">
            ${(receipt.amount / 100).toFixed(2)}
          </div>
        </div>
      </CardContent>

      {showActions && receipt.status === "pending" && (
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject?.(receipt.id)}
            className="flex-1"
          >
            Reject
          </Button>
          <Button
            size="sm"
            onClick={() => onApprove?.(receipt.id)}
            className="flex-1"
          >
            Approve
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

/**
 * Billing summary card
 */
export function BillingSummaryCard({
  totalInvoices,
  totalAmount,
  paidAmount,
  outstandingAmount,
  currency = "USD",
}: {
  totalInvoices: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  currency?: string
}) {
  const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Summary</CardTitle>
        <CardDescription>Overview of all invoices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <small className="muted">Total Invoices</small>
            <div className="font-medium">{totalInvoices}</div>
          </div>
          <div>
            <small className="muted">Collection Rate</small>
            <div className="font-medium">{collectionRate.toFixed(1)}%</div>
          </div>
          <div>
            <small className="muted">Total Billed</small>
            <div className="font-medium tabular-nums">
              {formatCurrency(totalAmount, currency)}
            </div>
          </div>
          <div>
            <small className="muted">Total Paid</small>
            <div className="font-medium text-green-600 tabular-nums">
              {formatCurrency(paidAmount, currency)}
            </div>
          </div>
          <div className="col-span-2">
            <small className="muted">Outstanding</small>
            <div className="font-medium text-amber-600 tabular-nums">
              {formatCurrency(outstandingAmount, currency)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Invoice health indicator card
 */
export function InvoiceHealthCard({ invoice }: { invoice: InvoiceWithSchool }) {
  const health = getInvoiceHealth(
    invoice.status as InvoiceStatus,
    invoice.periodEnd
  )
  const healthConfig = {
    healthy: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/10",
      label: "On track",
    },
    warning: {
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/10",
      label: "Due soon",
    },
    critical: {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/10",
      label: "Needs attention",
    },
  }

  const config = healthConfig[health]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 rounded-lg ${config.bg} p-4`}>
      <Icon className={`size-5 ${config.color}`} />
      <div>
        <div className={`font-medium ${config.color}`}>{config.label}</div>
        <small className="muted">
          {formatDueStatus(invoice.periodEnd, invoice.status as InvoiceStatus)}
        </small>
      </div>
    </div>
  )
}
