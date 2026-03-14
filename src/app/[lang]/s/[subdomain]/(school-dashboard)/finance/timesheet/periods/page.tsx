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

export const metadata = { title: "Timesheet Periods" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TimesheetPeriodsPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const periods = await db.timesheetPeriod.findMany({
    where: { schoolId },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { entries: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Timesheet Periods</h3>
        <Link
          href={`/${lang}/finance/timesheet/entries`}
          className={buttonVariants({ variant: "outline" })}
        >
          View Entries
        </Link>
      </div>
      {periods.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No timesheet periods yet.
        </p>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <Card
              key={period.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{period.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDate(period.startDate, lang)} &mdash;{" "}
                    {formatDate(period.endDate, lang)} &mdash;{" "}
                    {period._count.entries} entries
                  </p>
                </div>
                <Badge
                  variant={
                    period.status === "OPEN"
                      ? "default"
                      : period.status === "CLOSED"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {period.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
