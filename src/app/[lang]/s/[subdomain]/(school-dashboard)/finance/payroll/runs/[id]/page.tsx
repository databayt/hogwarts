// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.payrollPage?.payrollRunDetails }
}

export default async function PayrollRunDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.payrollPage
  const c = dictionary?.finance?.common
  const runStatus = dictionary?.finance?.payrollStatus as
    | Record<string, string>
    | undefined
  const slipStatus = dictionary?.finance?.slipStatus as
    | Record<string, string>
    | undefined
  const { schoolId, can } = await resolveFinanceAccess("payroll", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="payroll" />
  }

  const [run, schoolForCurrency] = await Promise.all([
    db.payrollRun.findFirst({
      where: { id, schoolId },
      include: {
        salarySlips: {
          include: {
            teacher: {
              select: { firstName: true, lastName: true, employeeId: true },
            },
          },
          orderBy: { teacher: { lastName: "asc" } },
        },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])

  if (!run) notFound()

  const currency = schoolForCurrency?.currency ?? "USD"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{run.runNumber}</h3>
          <p className="text-muted-foreground text-sm">
            {formatDate(run.payPeriodStart, lang)} —{" "}
            {formatDate(run.payPeriodEnd, lang)}
          </p>
        </div>
        <Badge>{runStatus?.[run.status] ?? run.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.grossTotal || "Gross Total"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(run.totalGross), lang, currency)}
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
            <p className="text-2xl font-bold">
              {formatCurrency(Number(run.totalDeductions), lang, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.netTotal || "Net Total"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(run.totalNet), lang, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="mb-3 font-medium">
          {d?.salarySlips || "Salary Slips"} ({run.salarySlips.length})
        </h4>
        <div className="space-y-2">
          {run.salarySlips.map((slip) => (
            <Card key={slip.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {[slip.teacher?.firstName, slip.teacher?.lastName]
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
                      {formatCurrency(Number(slip.netSalary), lang, currency)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {c?.gross || "Gross"}:{" "}
                      {formatCurrency(Number(slip.grossSalary), lang, currency)}
                    </p>
                  </div>
                  <Badge
                    variant={slip.status === "PAID" ? "default" : "secondary"}
                  >
                    {slipStatus?.[slip.status] ?? slip.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
