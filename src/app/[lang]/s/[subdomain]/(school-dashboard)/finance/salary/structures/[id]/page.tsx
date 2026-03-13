// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Salary Structure Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function SalaryStructureDetailPage({ params }: Props) {
  const { lang, id } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const structure = await db.salaryStructure.findFirst({
    where: { id, schoolId },
    include: {
      teacher: {
        select: { id: true, givenName: true, surname: true, employeeId: true },
      },
      allowances: { orderBy: { createdAt: "desc" } },
      deductions: { orderBy: { createdAt: "desc" } },
      _count: { select: { salarySlips: true } },
    },
  })

  if (!structure) notFound()

  const teacherName = [structure.teacher?.givenName, structure.teacher?.surname]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-lg font-medium">{teacherName}</h3>
          <p className="text-muted-foreground text-sm">
            {structure.teacher?.employeeId || "No ID"} —{" "}
            {structure.payFrequency}
          </p>
        </div>
        <Badge variant={structure.isActive ? "default" : "secondary"}>
          {structure.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Base Salary</CardTitle>
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
            <CardTitle className="text-sm font-medium">Allowances</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{structure.allowances.length}</p>
            <p className="text-muted-foreground text-xs">
              Total: {structure.currency}{" "}
              {structure.allowances
                .reduce((sum, a) => sum + Number(a.amount), 0)
                .toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{structure.deductions.length}</p>
            <p className="text-muted-foreground text-xs">
              Total: {structure.currency}{" "}
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
