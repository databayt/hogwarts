"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import {
  InvoiceHistory,
  type InvoiceItem,
} from "@/components/billingsdk/invoice-history"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getInvoicesByRole } from "./actions"
import type { DashboardRole } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"

// ============================================================================
// TYPES
// ============================================================================

export interface InvoiceHistorySectionProps {
  role: DashboardRole
  className?: string
  onDownload?: (invoiceId: string) => void
  sectionTitle?: string
}

// ============================================================================
// ROLE-SPECIFIC TITLES
// ============================================================================

function getHistoryTitleByRole(
  role: DashboardRole,
  dict?: Record<string, string>
): string {
  const roleKey = role.toLowerCase()
  if (dict?.[roleKey]) return dict[roleKey]

  switch (role) {
    case "STUDENT":
      return "Fee Payments"
    case "TEACHER":
      return "Expense Claims"
    case "GUARDIAN":
      return "Fee Payments"
    case "STAFF":
      return "Expense Claims"
    case "ACCOUNTANT":
      return "Recent Transactions"
    case "PRINCIPAL":
      return "Budget Allocations"
    case "ADMIN":
      return "Platform Billing"
    case "DEVELOPER":
      return "License Revenue"
    default:
      return dict?.default || "Billing History"
  }
}

// ============================================================================
// INVOICE HISTORY SECTION COMPONENT
// ============================================================================

/**
 * Role-specific invoice history section for dashboards.
 * Shows the caller's real invoices/transactions; when the account has none,
 * InvoiceHistory renders its own dictionary-driven empty state. Never shows
 * fabricated placeholder rows — a student must not see charges that don't
 * exist.
 *
 * @example
 * <InvoiceHistorySection role="STUDENT" />
 */
export function InvoiceHistorySection({
  role,
  className,
  onDownload,
  sectionTitle,
}: InvoiceHistorySectionProps) {
  const { dictionary } = useDictionary()
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const dict = dictionary?.school?.dashboard?.invoiceHistory as
    | Record<string, string>
    | undefined

  // Use provided title or derive from role
  const title = sectionTitle || getHistoryTitleByRole(role, dict)

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const data = await getInvoicesByRole(role)
        if (cancelled) return
        const mappedInvoices: InvoiceItem[] = (data ?? []).map((item) => ({
          id: item.id,
          date: item.date,
          amount: item.amount,
          status: item.status as InvoiceItem["status"],
          description: item.description,
        }))
        setInvoices(mappedInvoices)
      } catch (error) {
        console.error("Error fetching invoices:", error)
        if (!cancelled) setInvoices([])
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [role])

  const handleDownload = (invoiceId: string) => {
    onDownload?.(invoiceId)
  }

  return (
    <section className={className}>
      <SectionHeading title={title} />
      <InvoiceHistory
        invoices={invoices}
        title=""
        description=""
        onDownload={handleDownload}
      />
    </section>
  )
}
