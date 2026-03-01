// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { SearchParams } from "nuqs/server"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getInvoicesWithFilters } from "@/components/school-dashboard/finance/invoice/actions"
import type { InvoiceRow } from "@/components/school-dashboard/finance/invoice/columns"
import { invoiceSearchParams } from "@/components/school-dashboard/finance/invoice/list-params"
import { InvoiceTable } from "@/components/school-dashboard/finance/invoice/table"

import { checkCurrentUserPermission } from "../lib/permissions"

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string
  email?: string | null
  role?: string
  schoolId?: string | null
}

// Extended session type
type ExtendedSession = {
  user: ExtendedUser
}

interface Props {
  searchParams: Promise<SearchParams>
  lang?: Locale
}

export async function InvoiceContent({ searchParams, lang = "ar" }: Props) {
  const dictionary = await getDictionary(lang)
  const fd = (dictionary as any)?.finance
  const il = fd?.invoiceList as Record<string, string> | undefined

  const session = (await auth()) as ExtendedSession | null

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (!session.user.schoolId) {
    redirect("/onboarding")
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(
    session.user.schoolId,
    "invoice",
    "view"
  )

  // If user can't view invoices, show permission denied
  if (!canView) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {il?.invoices || "Invoices"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {il?.noPermissionInvoices ||
              "You don't have permission to view invoices"}
          </p>
        </div>
      </div>
    )
  }

  const sp = await invoiceSearchParams.parse(await searchParams)
  let data: InvoiceRow[] = []
  let total = 0

  try {
    const result = await getInvoicesWithFilters(sp)
    if (result.success) {
      data = result.data
      total = result.total
    }
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <InvoiceTable initialData={data} total={total} perPage={sp.perPage} />
    </div>
  )
}

export default InvoiceContent
