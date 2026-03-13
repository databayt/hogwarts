// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Payroll Run Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function PayrollRunDetailPage({ params }: Props) {
  const { lang, id } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const run = await db.payrollRun.findFirst({
    where: { id, schoolId },
    include: {
      salarySlips: {
        include: {
          teacher: {
            select: { givenName: true, surname: true, employeeId: true },
          },
        },
        orderBy: { teacher: { surname: "asc" } },
      },
    },
  })

  if (!run) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{run.runNumber}</h3>
          <p className="text-muted-foreground text-sm">
            {new Date(run.payPeriodStart).toLocaleDateString()} —{" "}
            {new Date(run.payPeriodEnd).toLocaleDateString()}
          </p>
        </div>
        <Badge>{run.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $
              {Number(run.totalGross).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $
              {Number(run.totalDeductions).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              $
              {Number(run.totalNet).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="mb-3 font-medium">
          Salary Slips ({run.salarySlips.length})
        </h4>
        <div className="space-y-2">
          {run.salarySlips.map((slip) => (
            <Link
              key={slip.id}
              href={`/${lang}/finance/payroll/slips/${slip.id}`}
            >
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">
                      {[slip.teacher?.givenName, slip.teacher?.surname]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {slip.slipNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <p className="font-medium">
                        $
                        {Number(slip.netSalary).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Gross: $
                        {Number(slip.grossSalary).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={slip.status === "PAID" ? "default" : "secondary"}
                    >
                      {slip.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
