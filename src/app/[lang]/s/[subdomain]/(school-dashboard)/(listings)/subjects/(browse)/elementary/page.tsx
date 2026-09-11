// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SubjectsContent from "@/components/school-dashboard/listings/subjects/content"

export const metadata = { title: "Dashboard: Elementary Subjects" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams?: Promise<{ studentId?: string; teacherId?: string }>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const { studentId, teacherId } = (await searchParams) ?? {}

  return (
    <SubjectsContent
      lang={lang}
      level="ELEMENTARY"
      studentId={studentId}
      teacherId={teacherId}
    />
  )
}
