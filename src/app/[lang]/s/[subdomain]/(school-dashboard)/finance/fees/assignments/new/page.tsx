// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { FeeAssignmentForm } from "@/components/school-dashboard/finance/fees/assignment-form"

export const metadata = {
  title: "Assign Fee",
}

export default async function AssignFeePage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const [students, feeStructures] = await Promise.all([
    db.student.findMany({
      where: { schoolId },
      select: { id: true, givenName: true, surname: true },
      orderBy: { givenName: "asc" },
      take: 500,
    }),
    db.feeStructure.findMany({
      where: { schoolId, isActive: true },
      select: { id: true, name: true, totalAmount: true },
      orderBy: { name: "asc" },
    }),
  ])

  const serializedFeeStructures = feeStructures.map((fs) => ({
    ...fs,
    totalAmount: Number(fs.totalAmount),
  }))

  return (
    <FeeAssignmentForm
      lang={lang}
      feeStructures={serializedFeeStructures}
      students={students}
    />
  )
}
