// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

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
  const isAdminOrTeacher = ["ADMIN", "TEACHER", "DEVELOPER"].includes(
    role || ""
  )

  // Exams page navigation — hide admin-only tabs for STUDENT/GUARDIAN
  const examsPages: PageNavItem[] = [
    { name: d?.nav?.overview || "Overview", href: `/${lang}/exams` },
    { name: d?.nav?.qbank || "QBank", href: `/${lang}/exams/qbank` },
    {
      name: d?.nav?.generate || "Generate",
      href: `/${lang}/exams/generate`,
      hidden: !isAdminOrTeacher,
    },
    {
      name: d?.nav?.mark || "Mark",
      href: `/${lang}/exams/mark`,
      hidden: !isAdminOrTeacher,
    },
    { name: d?.nav?.record || "Results", href: `/${lang}/exams/result` },
    { name: d?.nav?.quiz || "Quiz", href: `/${lang}/exams/quiz` },
    { name: d?.nav?.mock || "Mock", href: `/${lang}/exams/mock` },
    { name: "Upcoming", href: `/${lang}/exams/upcoming` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.pageTitle || "Examinations"} />
      <PageNav pages={examsPages} />

      {children}
    </div>
  )
}
