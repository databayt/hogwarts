// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { FinanceAccessDenied } from "@/components/school-dashboard/finance/access-denied"
import { resolveFinanceAccess } from "@/components/school-dashboard/finance/guard"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary?.finance?.payrollPage?.payrollRuns }
}

export default async function PayrollRunsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.payrollPage
  const c = dictionary?.finance?.common
  const runStatus = dictionary?.finance?.payrollStatus as
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

  const [runs, schoolForCurrency] = await Promise.all([
    db.payrollRun.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: { select: { salarySlips: true } },
      },
    }),
    db.school.findUnique({
      where: { id: schoolId },
      select: { currency: true },
    }),
  ])
  const currency = schoolForCurrency?.currency ?? "USD"

  const statusConfig: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    DRAFT: { variant: "outline" },
    PROCESSING: { variant: "secondary" },
    PENDING_APPROVAL: { variant: "secondary" },
    APPROVED: { variant: "default" },
    PAID: { variant: "default" },
    CANCELLED: { variant: "destructive" },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{d?.payrollRuns}</h3>
        <Link
          href={`/${lang}/finance/payroll/runs/new`}
          className={buttonVariants()}
        >
          {d?.createRun}
        </Link>
      </div>
      {runs.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {d?.noPayrollRunsYet}
        </p>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <Link key={run.id} href={`/${lang}/finance/payroll/runs/${run.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{run.runNumber}</p>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(run.payPeriodStart, lang)} —{" "}
                      {formatDate(run.payPeriodEnd, lang)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <p className="font-medium">
                        {formatCurrency(Number(run.totalNet), lang, currency)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {run._count.salarySlips} {c?.slips || "slips"}
                      </p>
                    </div>
                    <Badge
                      variant={statusConfig[run.status]?.variant || "outline"}
                    >
                      {runStatus?.[run.status] ?? run.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
