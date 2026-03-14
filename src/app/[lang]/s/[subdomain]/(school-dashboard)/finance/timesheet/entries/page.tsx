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

export const metadata = { title: "Timesheet Entries" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TimesheetEntriesPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  const entries = await db.timesheetEntry.findMany({
    where: { schoolId },
    orderBy: { entryDate: "desc" },
    take: 100,
    include: {
      teacher: { select: { givenName: true, surname: true } },
      period: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Timesheet Entries</h3>
        <Link
          href={`/${lang}/finance/timesheet/entries/new`}
          className={buttonVariants()}
        >
          Record Time Entry
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No timesheet entries yet.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="hover:bg-muted/50 transition-colors"
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {entry.teacher.givenName} {entry.teacher.surname}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {entry.period.name} &mdash;{" "}
                    {formatDate(entry.entryDate, lang)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>{Number(entry.hoursWorked)}h worked</span>
                  <span>{Number(entry.overtimeHours)}h OT</span>
                  <span>{Number(entry.leaveHours)}h leave</span>
                  <Badge
                    variant={
                      entry.status === "DRAFT"
                        ? "outline"
                        : entry.status === "SUBMITTED"
                          ? "secondary"
                          : entry.status === "APPROVED"
                            ? "default"
                            : "destructive"
                    }
                  >
                    {entry.status}
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
