// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { getExamTabsForRole } from "@/components/school-dashboard/exams/lib/permissions"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ExamsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.exams

  const session = await auth()
  const role = session?.user?.role

  const examsPages = getExamTabsForRole(role, lang, d?.nav)

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.pageTitle || "Examinations"} />
      <PageNav pages={examsPages} />

      {children}
    </div>
  )
}
