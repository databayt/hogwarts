// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

export const metadata = { title: "Salary Structure Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function SalaryStructureDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.salaryPage
  const c = dictionary?.finance?.common
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  const structure = await db.salaryStructure.findFirst({
    where: { id, schoolId },
    include: {
      teacher: {
        select: { id: true, firstName: true, lastName: true, employeeId: true },
      },
      allowances: { orderBy: { createdAt: "desc" } },
      deductions: { orderBy: { createdAt: "desc" } },
      _count: { select: { salarySlips: true } },
    },
  })

  if (!structure) notFound()

  const teacherName = [
    structure.teacher?.firstName,
    structure.teacher?.lastName,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-lg font-medium">{teacherName}</h3>
          <p className="text-muted-foreground text-sm">
            {structure.teacher?.employeeId || c?.noId || "No ID"} —{" "}
            {structure.payFrequency}
          </p>
        </div>
        <Badge variant={structure.isActive ? "default" : "secondary"}>
          {structure.isActive
            ? c?.active || "Active"
            : c?.inactive || "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.baseSalary || "Base Salary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {structure.currency}{" "}
              {Number(structure.baseSalary).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.allowances || "Allowances"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{structure.allowances.length}</p>
            <p className="text-muted-foreground text-xs">
              {c?.total || "Total"}: {structure.currency}{" "}
              {structure.allowances
                .reduce((sum, a) => sum + Number(a.amount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.deductions || "Deductions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{structure.deductions.length}</p>
            <p className="text-muted-foreground text-xs">
              {c?.total || "Total"}: {structure.currency}{" "}
              {structure.deductions
                .reduce((sum, d) => sum + Number(d.amount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
