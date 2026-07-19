// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import FeeStructureForm from "@/components/school-dashboard/finance/fees/form"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.feesPage?.feeStructures || "Fee Structure Details",
  }
}

export default async function FeeStructureDetailPage({ params }: Props) {
  const { lang, id } = await params
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

  const feeStructure = await db.feeStructure.findFirst({
    where: { id, schoolId },
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { feeAssignments: true } },
    },
  })

  if (!feeStructure) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{feeStructure.name}</h3>
        <p className="text-muted-foreground text-sm">
          {feeStructure.academicYear} — {feeStructure._count.feeAssignments}{" "}
          assignments
        </p>
      </div>
      <FeeStructureForm
        lang={lang}
        initialData={JSON.parse(JSON.stringify(feeStructure))}
      />
    </div>
  )
}
