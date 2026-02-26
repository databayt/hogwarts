// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../../types"

interface Props {
  school: School
  dictionary: Dictionary
  lang: Locale
  subdomain: string
}

export function EnrollmentClosed({
  school,
  dictionary,
  lang,
  subdomain,
}: Props) {
  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { portal?: Record<string, string> } }
      }
    )?.school?.admission?.portal ?? {}

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 py-16 text-center">
      <div className="text-6xl">{"📋"}</div>
      <h2 className="font-heading text-2xl font-bold">
        {dict.enrollmentClosed || "Enrollment is Currently Closed"}
      </h2>
      <p className="text-muted-foreground">
        {(
          dict.enrollmentClosedDesc ||
          "{schoolName} is not accepting applications at this time. Please visit the admissions page for upcoming enrollment dates."
        ).replace("{schoolName}", school.name)}
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/${lang}/s/${subdomain}/admissions`}
          className={cn(buttonVariants({ variant: "default" }))}
        >
          {dict.viewAdmissions || "View Admissions"}
        </Link>
        <Link
          href={`/${lang}/s/${subdomain}/inquiry`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {dict.contactUs || "Contact Us"}
        </Link>
      </div>
    </div>
  )
}
