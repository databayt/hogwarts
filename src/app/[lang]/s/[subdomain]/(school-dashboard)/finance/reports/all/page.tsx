// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Financial Reports" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AllReportsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const reports = await db.financialReport.findMany({
    where: { schoolId },
    orderBy: { generatedAt: "desc" },
    take: 50,
    include: {
      fiscalYear: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Financial Reports</h3>
        <Link
          href={`/${lang}/finance/reports`}
          className={buttonVariants({ variant: "outline" })}
        >
          Back to Reports Dashboard
        </Link>
      </div>
      {reports.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No reports generated yet.
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{report.reportName}</p>
                  <p className="text-muted-foreground text-sm">
                    {report.fiscalYear?.name ?? "No fiscal year"} &mdash;{" "}
                    {report.generatedAt
                      ? formatDate(report.generatedAt, lang)
                      : "Pending"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{report.reportType}</Badge>
                  <Badge
                    variant={
                      report.status === "COMPLETED"
                        ? "default"
                        : report.status === "GENERATING"
                          ? "outline"
                          : "destructive"
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
