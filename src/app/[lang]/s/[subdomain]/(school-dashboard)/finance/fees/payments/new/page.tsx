// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import PaymentForm from "@/components/school-dashboard/finance/fees/payment-form"

export const metadata = { title: "Record Payment" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function RecordPaymentPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const assignments = await db.feeAssignment.findMany({
    where: { schoolId, status: { in: ["PENDING", "PARTIAL"] } },
    include: {
      student: { select: { givenName: true, surname: true } },
      feeStructure: { select: { name: true } },
      payments: { where: { status: "SUCCESS" }, select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const mapped = assignments.map((a: any) => {
    const totalPaid = (a.payments ?? []).reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0
    )
    const finalAmount = Number(a.finalAmount)
    return {
      id: a.id,
      studentName: [a.student?.givenName, a.student?.surname]
        .filter(Boolean)
        .join(" "),
      feeStructureName: a.feeStructure?.name ?? "Unnamed",
      finalAmount,
      totalPaid,
      remaining: finalAmount - totalPaid,
    }
  })

  return <PaymentForm lang={lang} assignments={mapped} />
}
