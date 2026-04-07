"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"

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
// DEFAULT DATA BY ROLE (Fallback when no real data available)
// ============================================================================

type InvoiceDefaults = Record<string, string> | undefined

function getDefaultInvoicesByRole(
  t?: InvoiceDefaults
): Record<DashboardRole, InvoiceItem[]> {
  return {
    // Fee Payments - Student's fee history
    STUDENT: [
      {
        id: "fee_001",
        date: "2024/12/01",
        amount: "2,500 SAR",
        status: "paid",
        description: t?.term1Tuition || "Term 1 Tuition Fee",
      },
      {
        id: "fee_002",
        date: "2024/11/15",
        amount: "350 SAR",
        status: "paid",
        description: t?.librarySubscription || "Library Subscription",
      },
      {
        id: "fee_003",
        date: "2024/10/01",
        amount: "500 SAR",
        status: "open",
        description: t?.labEquipmentFee || "Lab Equipment Fee",
      },
      {
        id: "fee_004",
        date: "2024/09/01",
        amount: "2,500 SAR",
        status: "paid",
        description: t?.registrationFee || "Registration Fee",
      },
    ],
    // Expense Claims - Teacher reimbursements
    TEACHER: [
      {
        id: "exp_001",
        date: "2024/12/05",
        amount: "450 SAR",
        status: "paid",
        description: t?.classroomSupplies || "Classroom Supplies",
      },
      {
        id: "exp_002",
        date: "2024/11/20",
        amount: "1,200 SAR",
        status: "open",
        description: t?.conferenceAttendance || "Conference Attendance",
      },
      {
        id: "exp_003",
        date: "2024/10/15",
        amount: "280 SAR",
        status: "paid",
        description: t?.teachingMaterials || "Teaching Materials",
      },
      {
        id: "exp_004",
        date: "2024/09/30",
        amount: "150 SAR",
        status: "refunded",
        description: t?.workshopCancelled || "Workshop (Cancelled)",
      },
    ],
    // Fee Payments - Guardian's children fees
    GUARDIAN: [
      {
        id: "chi_001",
        date: "2024/12/01",
        amount: "5,000 SAR",
        status: "paid",
        description: t?.childTerm1Tuition || "Ahmed - Term 1 Tuition",
      },
      {
        id: "chi_002",
        date: "2024/12/01",
        amount: "4,800 SAR",
        status: "open",
        description: t?.childTerm1TuitionB || "Sara - Term 1 Tuition",
      },
      {
        id: "chi_003",
        date: "2024/11/15",
        amount: "700 SAR",
        status: "paid",
        description: t?.bothLibraryFee || "Both - Library Fee",
      },
      {
        id: "chi_004",
        date: "2024/10/01",
        amount: "1,000 SAR",
        status: "paid",
        description: t?.bothLabFee || "Both - Lab Fee",
      },
    ],
    // Expense Claims - Staff reimbursements
    STAFF: [
      {
        id: "stf_001",
        date: "2024/12/10",
        amount: "320 SAR",
        status: "open",
        description: t?.officeSupplies || "Office Supplies",
      },
      {
        id: "stf_002",
        date: "2024/11/25",
        amount: "850 SAR",
        status: "paid",
        description: t?.itEquipment || "IT Equipment",
      },
      {
        id: "stf_003",
        date: "2024/10/20",
        amount: "200 SAR",
        status: "paid",
        description: t?.transportation || "Transportation",
      },
      {
        id: "stf_004",
        date: "2024/09/15",
        amount: "450 SAR",
        status: "paid",
        description: t?.trainingMaterials || "Training Materials",
      },
    ],
    // Recent Transactions - Accountant's view
    ACCOUNTANT: [
      {
        id: "inv_001",
        date: "2024/12/15",
        amount: "125,000 SAR",
        status: "paid",
        description: t?.novemberCollection || "November Collection",
      },
      {
        id: "inv_002",
        date: "2024/12/10",
        amount: "45,000 SAR",
        status: "open",
        description: t?.vendorPayment || "Vendor Payment",
      },
      {
        id: "inv_003",
        date: "2024/12/05",
        amount: "8,500 SAR",
        status: "paid",
        description: t?.staffReimbursements || "Staff Reimbursements",
      },
      {
        id: "inv_004",
        date: "2024/11/30",
        amount: "15,200 SAR",
        status: "void",
        description: t?.cancelledOrder || "Cancelled Order",
      },
    ],
    // Budget Allocations - Principal's budget tracking
    PRINCIPAL: [
      {
        id: "bud_001",
        date: "2024/12/01",
        amount: "250,000 SAR",
        status: "paid",
        description: t?.q4OperatingBudget || "Q4 Operating Budget",
      },
      {
        id: "bud_002",
        date: "2024/11/15",
        amount: "75,000 SAR",
        status: "paid",
        description: t?.infrastructure || "Infrastructure",
      },
      {
        id: "bud_003",
        date: "2024/10/01",
        amount: "45,000 SAR",
        status: "paid",
        description: t?.staffDevelopment || "Staff Development",
      },
      {
        id: "bud_004",
        date: "2024/09/01",
        amount: "120,000 SAR",
        status: "paid",
        description: t?.academicSupplies || "Academic Supplies",
      },
    ],
    // Platform Billing - Admin subscription history
    ADMIN: [
      {
        id: "plt_001",
        date: "2024/12/01",
        amount: "$299.00",
        status: "paid",
        description: t?.proSubscription || "Pro Subscription",
      },
      {
        id: "plt_002",
        date: "2024/11/01",
        amount: "$299.00",
        status: "paid",
        description: t?.proSubscription || "Pro Subscription",
      },
      {
        id: "plt_003",
        date: "2024/10/01",
        amount: "$299.00",
        status: "paid",
        description: t?.proSubscription || "Pro Subscription",
      },
      {
        id: "plt_004",
        date: "2024/09/01",
        amount: "$199.00",
        status: "refunded",
        description: t?.starterUpgraded || "Starter (Upgraded)",
      },
    ],
    // License Revenue - Developer's revenue tracking
    DEVELOPER: [
      {
        id: "dev_001",
        date: "2024/12/01",
        amount: "$2,499.00",
        status: "paid",
        description: t?.enterpriseSchoolA || "Enterprise - School A",
      },
      {
        id: "dev_002",
        date: "2024/12/01",
        amount: "$1,999.00",
        status: "paid",
        description: t?.proSchoolB || "Pro - School B",
      },
      {
        id: "dev_003",
        date: "2024/11/15",
        amount: "$499.00",
        status: "open",
        description: t?.analyticsAddon || "Analytics Add-on",
      },
      {
        id: "dev_004",
        date: "2024/11/01",
        amount: "$2,499.00",
        status: "paid",
        description: t?.enterpriseSchoolA || "Enterprise - School A",
      },
    ],
  }
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
  const { dictionary } = useDictionary()
  const defaults = useMemo(() => {
    const t = dictionary?.school?.dashboard?.invoiceTable?.defaults as
      | Record<string, string>
      | undefined
    return getDefaultInvoicesByRole(t)
  }, [dictionary])
  const [invoices, setInvoices] = useState<InvoiceItem[]>(
    defaults[role] || defaults.ADMIN
  )
  const [isLoading, setIsLoading] = useState(true)
  const dict = dictionary?.school?.dashboard?.invoiceHistory as
    | Record<string, string>
    | undefined

  // Use provided title or derive from role
  const title = sectionTitle || getHistoryTitleByRole(role, dict)

  // Sync defaults when dictionary loads/changes
  useEffect(() => {
    if (!isLoading) return
    setInvoices(defaults[role] || defaults.ADMIN)
  }, [defaults, role, isLoading])

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
  const staticDefaults = getDefaultInvoicesByRole()
  const data = invoices || staticDefaults[role] || staticDefaults.ADMIN
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
