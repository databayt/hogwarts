// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { type PaymentRow } from "@/components/school-dashboard/finance/fees/payment-columns"
import { PaymentsTable } from "@/components/school-dashboard/finance/fees/payment-table"
import { getPaymentList } from "@/components/school-dashboard/finance/fees/queries"

export const metadata = { title: "Fee Payments" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function PaymentsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const { rows, count } = await getPaymentList(schoolId, {
    page: 1,
    perPage: 20,
  })

  const data: PaymentRow[] = rows.map((p: any) => ({
    id: p.id,
    paymentNumber: p.paymentNumber,
    studentName: [p.student?.givenName, p.student?.surname]
      .filter(Boolean)
      .join(" "),
    feeStructureName: p.feeAssignment?.feeStructure?.name || "-",
    amount: Number(p.amount),
    paymentDate:
      p.paymentDate instanceof Date
        ? p.paymentDate.toISOString()
        : String(p.paymentDate),
    paymentMethod: p.paymentMethod,
    status: p.status,
    receiptNumber: p.receiptNumber,
    createdAt:
      p.createdAt instanceof Date
        ? p.createdAt.toISOString()
        : String(p.createdAt),
  }))

  return <PaymentsTable initialData={data} total={count} lang={lang} />
}
