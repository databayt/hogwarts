// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import PaymentForm from "@/components/school-dashboard/finance/fees/payment-form"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

export const metadata = { title: "Record Payment" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function RecordPaymentPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  const assignments = await db.feeAssignment.findMany({
    where: { schoolId, status: { in: ["PENDING", "PARTIAL"] } },
    include: {
      student: { select: { firstName: true, lastName: true } },
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
      studentName: [a.student?.firstName, a.student?.lastName]
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
