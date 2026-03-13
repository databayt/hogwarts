// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import FeeStructureForm from "@/components/school-dashboard/finance/fees/form"

export const metadata = { title: "Fee Structure Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function FeeStructureDetailPage({ params }: Props) {
  const { lang, id } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
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
