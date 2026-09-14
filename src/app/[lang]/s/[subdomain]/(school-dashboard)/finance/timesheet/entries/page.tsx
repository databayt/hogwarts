// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { db } from "@/lib/db"
import { formatDate } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
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
  return {
    title:
      dictionary?.finance?.timesheetPage?.timesheetEntries ||
      "Timesheet Entries",
  }
}

export default async function TimesheetEntriesPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const tp = dictionary?.finance?.timesheetPage
  const entryStatusLabels = dictionary?.finance?.timesheetConfig?.entryStatus
  const { schoolId, can } = await resolveFinanceAccess("timesheet", ["view"])

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  if (!can.view) {
    return <FinanceAccessDenied dictionary={dictionary} module="timesheet" />
  }

  const entries = await db.timesheetEntry.findMany({
    where: { schoolId },
    orderBy: { entryDate: "desc" },
    take: 100,
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      period: { select: { name: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {tp?.timesheetEntries || "Timesheet Entries"}
        </h3>
        <Link
          href={`/${lang}/finance/timesheet/entries/new`}
          className={cn(buttonVariants(), "max-md:rounded-full")}
        >
          {tp?.recordTimeEntry || "Record Time Entry"}
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {tp?.noTimesheetEntriesYet || "No timesheet entries yet."}
        </p>
      ) : (
        // Phone: one grey grouped list; the hour figures and status drop
        // under the name instead of being squeezed into a half-width column
        // (which wrapped each "0h worked" onto two lines).
        <div className="max-md:bg-muted space-y-3 max-md:space-y-0 max-md:divide-y max-md:overflow-hidden max-md:rounded-xl">
          {entries.map((entry) => (
            <Card
              key={entry.id}
              className="hover:bg-muted/50 transition-colors max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none"
            >
              <CardContent className="flex items-center justify-between py-4 max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:px-4 max-md:py-3">
                <div className="max-md:min-w-0">
                  <p className="font-medium">
                    {entry.teacher.firstName} {entry.teacher.lastName}
                  </p>
                  <p className="text-muted-foreground text-sm max-md:text-xs">
                    {entry.period.name} &mdash;{" "}
                    {formatDate(entry.entryDate, lang)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm max-md:w-full max-md:flex-wrap max-md:gap-x-4 max-md:gap-y-1">
                  <span>
                    {Number(entry.hoursWorked)}
                    {tp?.hoursWorked || "h worked"}
                  </span>
                  <span>
                    {Number(entry.overtimeHours)}
                    {tp?.hoursOT || "h OT"}
                  </span>
                  <span>
                    {Number(entry.leaveHours)}
                    {tp?.hoursLeave || "h leave"}
                  </span>
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
                    {entryStatusLabels?.[entry.status] ?? entry.status}
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
