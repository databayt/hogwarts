// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { FineDetail } from "@/components/school-dashboard/finance/fees/fine-detail"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

export const metadata = { title: "Fine Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function FineDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId, can } = await resolveFinanceAccess("fees", ["view"])

  if (!schoolId) notFound()

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="fees" />
  }

  const fine = await db.fine.findFirst({
    where: { id, schoolId },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  if (!fine) notFound()

  const data = {
    id: fine.id,
    studentName: [fine.student.firstName, fine.student.lastName]
      .filter(Boolean)
      .join(" "),
    studentId: fine.student.id,
    fineType: fine.fineType,
    amount: Number(fine.amount),
    reason: fine.reason,
    dueDate: fine.dueDate.toISOString(),
    isPaid: fine.isPaid,
    paidAmount: fine.paidAmount ? Number(fine.paidAmount) : null,
    paidDate: fine.paidDate ? fine.paidDate.toISOString() : null,
    isWaived: fine.isWaived,
    waivedBy: fine.waivedBy,
    waivedDate: fine.waivedDate ? fine.waivedDate.toISOString() : null,
    waiverReason: fine.waiverReason,
    createdAt: fine.createdAt.toISOString(),
  }

  return <FineDetail fine={data} lang={lang} />
}
