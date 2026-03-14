// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Payroll Runs" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function PayrollRunsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const runs = await db.payrollRun.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      _count: { select: { salarySlips: true } },
    },
  })

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
        <h3 className="text-lg font-medium">Payroll Runs</h3>
        <Link
          href={`/${lang}/finance/payroll/runs/new`}
          className={buttonVariants()}
        >
          Create Run
        </Link>
      </div>
      {runs.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No payroll runs yet.
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
                        {formatCurrency(Number(run.totalNet), lang)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {run._count.salarySlips} slips
                      </p>
                    </div>
                    <Badge
                      variant={statusConfig[run.status]?.variant || "outline"}
                    >
                      {run.status}
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
