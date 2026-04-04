// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FineDetail } from "@/components/school-dashboard/finance/fees/fine-detail"

export const metadata = { title: "Fine Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function FineDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  if (!schoolId) notFound()

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
