// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import Link from "next/link"

import { getTenantContext } from "@/lib/tenant-context"
import { buttonVariants } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.timesheetPage?.recordTimeEntry ||
      "Record Time Entry",
  }
}

export default async function NewTimesheetEntryPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const tp = dictionary?.finance?.timesheetPage
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return (
      <p className="text-muted-foreground">
        {dictionary?.finance?.common?.schoolNotFound ||
          "School context not found"}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">
          {tp?.recordTimeEntry || "Record Time Entry"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {tp?.logHoursForTeacher || "Log hours worked for a teacher"}
        </p>
      </div>
      <p className="text-muted-foreground">
        {tp?.timeEntryFormComingSoon || "Time entry form coming soon."}
      </p>
      <Link
        href={`/${lang}/finance/timesheet/entries`}
        className={buttonVariants({ variant: "outline" })}
      >
        {tp?.backToEntries || "Back to Entries"}
      </Link>
    </div>
  )
}
