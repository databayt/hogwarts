"use client"

import { useEffect, useState } from "react"
import { InvoiceHistory, type InvoiceItem } from "@/components/billingsdk/invoice-history"
import { SectionHeading } from "./section-heading"
import { getInvoicesByRole } from "./actions"
import type { DashboardRole } from "./resource-usage-section"

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

function getHistoryTitleByRole(role: DashboardRole): string {
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
      return "Billing History"
  }
}

// ============================================================================
// DEFAULT DATA BY ROLE (Fallback when no real data available)
// ============================================================================

const defaultInvoicesByRole: Record<DashboardRole, InvoiceItem[]> = {
  // Fee Payments - Student's fee history
  STUDENT: [
    { id: "fee_001", date: "Dec 1, 2024", amount: "2,500 SAR", status: "paid", description: "Term 1 Tuition Fee" },
    { id: "fee_002", date: "Nov 15, 2024", amount: "350 SAR", status: "paid", description: "Library Subscription" },
    { id: "fee_003", date: "Oct 1, 2024", amount: "500 SAR", status: "open", description: "Lab Equipment Fee" },
    { id: "fee_004", date: "Sep 1, 2024", amount: "2,500 SAR", status: "paid", description: "Registration Fee" },
  ],
  // Expense Claims - Teacher reimbursements
  TEACHER: [
    { id: "exp_001", date: "Dec 5, 2024", amount: "450 SAR", status: "paid", description: "Classroom Supplies" },
    { id: "exp_002", date: "Nov 20, 2024", amount: "1,200 SAR", status: "open", description: "Conference Attendance" },
    { id: "exp_003", date: "Oct 15, 2024", amount: "280 SAR", status: "paid", description: "Teaching Materials" },
    { id: "exp_004", date: "Sep 30, 2024", amount: "150 SAR", status: "refunded", description: "Workshop (Cancelled)" },
  ],
  // Fee Payments - Guardian's children fees
  GUARDIAN: [
    { id: "chi_001", date: "Dec 1, 2024", amount: "5,000 SAR", status: "paid", description: "Ahmed - Term 1 Tuition" },
    { id: "chi_002", date: "Dec 1, 2024", amount: "4,800 SAR", status: "open", description: "Sara - Term 1 Tuition" },
    { id: "chi_003", date: "Nov 15, 2024", amount: "700 SAR", status: "paid", description: "Both - Library Fee" },
    { id: "chi_004", date: "Oct 1, 2024", amount: "1,000 SAR", status: "paid", description: "Both - Lab Fee" },
  ],
  // Expense Claims - Staff reimbursements
  STAFF: [
    { id: "stf_001", date: "Dec 10, 2024", amount: "320 SAR", status: "open", description: "Office Supplies" },
    { id: "stf_002", date: "Nov 25, 2024", amount: "850 SAR", status: "paid", description: "IT Equipment" },
    { id: "stf_003", date: "Oct 20, 2024", amount: "200 SAR", status: "paid", description: "Transportation" },
    { id: "stf_004", date: "Sep 15, 2024", amount: "450 SAR", status: "paid", description: "Training Materials" },
  ],
  // Recent Transactions - Accountant's view
  ACCOUNTANT: [
    { id: "inv_001", date: "Dec 15, 2024", amount: "125,000 SAR", status: "paid", description: "November Collection" },
    { id: "inv_002", date: "Dec 10, 2024", amount: "45,000 SAR", status: "open", description: "Vendor Payment" },
    { id: "inv_003", date: "Dec 5, 2024", amount: "8,500 SAR", status: "paid", description: "Staff Reimbursements" },
    { id: "inv_004", date: "Nov 30, 2024", amount: "15,200 SAR", status: "void", description: "Cancelled Order" },
  ],
  // Budget Allocations - Principal's budget tracking
  PRINCIPAL: [
    { id: "bud_001", date: "Dec 1, 2024", amount: "250,000 SAR", status: "paid", description: "Q4 Operating Budget" },
    { id: "bud_002", date: "Nov 15, 2024", amount: "75,000 SAR", status: "paid", description: "Infrastructure" },
    { id: "bud_003", date: "Oct 1, 2024", amount: "45,000 SAR", status: "paid", description: "Staff Development" },
    { id: "bud_004", date: "Sep 1, 2024", amount: "120,000 SAR", status: "paid", description: "Academic Supplies" },
  ],
  // Platform Billing - Admin subscription history
  ADMIN: [
    { id: "plt_001", date: "Dec 1, 2024", amount: "$299.00", status: "paid", description: "Pro Subscription" },
    { id: "plt_002", date: "Nov 1, 2024", amount: "$299.00", status: "paid", description: "Pro Subscription" },
    { id: "plt_003", date: "Oct 1, 2024", amount: "$299.00", status: "paid", description: "Pro Subscription" },
    { id: "plt_004", date: "Sep 1, 2024", amount: "$199.00", status: "refunded", description: "Starter (Upgraded)" },
  ],
  // License Revenue - Developer's revenue tracking
  DEVELOPER: [
    { id: "dev_001", date: "Dec 1, 2024", amount: "$2,499.00", status: "paid", description: "Enterprise - School A" },
    { id: "dev_002", date: "Dec 1, 2024", amount: "$1,999.00", status: "paid", description: "Pro - School B" },
    { id: "dev_003", date: "Nov 15, 2024", amount: "$499.00", status: "open", description: "Analytics Add-on" },
    { id: "dev_004", date: "Nov 1, 2024", amount: "$2,499.00", status: "paid", description: "Enterprise - School A" },
  ],
}

// ============================================================================
// INVOICE HISTORY SECTION COMPONENT
// ============================================================================

/**
 * Role-specific invoice history section for dashboards.
 * Shows relevant invoices based on user role.
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
  const [invoices, setInvoices] = useState<InvoiceItem[]>(
    defaultInvoicesByRole[role] || defaultInvoicesByRole.ADMIN
  )
  const [isLoading, setIsLoading] = useState(true)

  // Use provided title or derive from role
  const title = sectionTitle || getHistoryTitleByRole(role)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getInvoicesByRole(role)
        if (data && data.length > 0) {
          // Map server data to InvoiceItem format
          const mappedInvoices: InvoiceItem[] = data.map((item) => ({
            id: item.id,
            date: item.date,
            amount: item.amount,
            status: item.status as InvoiceItem["status"],
            description: item.description,
          }))
          setInvoices(mappedInvoices)
        }
      } catch (error) {
        console.error("Error fetching invoices:", error)
        // Keep default data on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [role])

  const handleDownload = (invoiceId: string) => {
    if (onDownload) {
      onDownload(invoiceId)
    } else {
      console.log("Download invoice:", invoiceId)
    }
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

// ============================================================================
// STATIC INVOICE HISTORY (For server components)
// ============================================================================

export interface StaticInvoiceHistorySectionProps {
  role: DashboardRole
  invoices?: InvoiceItem[]
  className?: string
  onDownload?: (invoiceId: string) => void
  sectionTitle?: string
}

/**
 * Static version of InvoiceHistorySection for server-side rendering.
 * Pass pre-fetched invoices data directly.
 */
export function StaticInvoiceHistorySection({
  role,
  invoices,
  className,
  onDownload,
  sectionTitle,
}: StaticInvoiceHistorySectionProps) {
  const data = invoices || defaultInvoicesByRole[role] || defaultInvoicesByRole.ADMIN
  const title = sectionTitle || getHistoryTitleByRole(role)

  return (
    <section className={className}>
      <SectionHeading title={title} />
      <InvoiceHistory
        invoices={data}
        title=""
        description=""
        onDownload={onDownload}
      />
    </section>
  )
}
