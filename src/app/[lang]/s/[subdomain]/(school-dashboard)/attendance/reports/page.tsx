// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"
import { SearchParams } from "nuqs/server"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ReportsContent } from "@/components/school-dashboard/attendance/reports/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.attendance?.reports || "Attendance Reports",
    description: "Generate and export attendance reports",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  // Parallel data fetching
  const [{ lang }, dictionary, sp, session] = await Promise.all([
    params,
    getDictionary((await params).lang),
    searchParams,
    auth(),
  ])

  // Staff only
  const staffRoles = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]
  if (!staffRoles.includes(session?.user?.role ?? "")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to access attendance reports.
        </p>
      </div>
    )
  }

  return (
    <ReportsContent
      dictionary={dictionary}
      locale={lang}
      initialFilters={{
        classId: sp.classId as string | undefined,
        studentId: sp.studentId as string | undefined,
        status: sp.status as string | undefined,
        from: sp.from as string | undefined,
        to: sp.to as string | undefined,
      }}
    />
  )
}
