// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ClassroomsLayout({ children, params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.classrooms

  const base = `/${lang}/s/${subdomain}/classrooms`

  const classroomPages: PageNavItem[] = [
    {
      name: d?.navigation?.rooms || "Rooms",
      href: base,
      exact: true,
    },
    {
      name: d?.navigation?.configure || "Configure",
      href: `${base}/configure`,
    },
    {
      name: d?.navigation?.capacity || "Capacity",
      href: `${base}/capacity`,
    },
    {
      name: d?.navigation?.subjects || "Subjects",
      href: `${base}/subjects`,
    },
    {
      name: d?.navigation?.schedule || "Schedule",
      href: `${base}/schedule`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Classrooms"} />
      <PageNav pages={classroomPages} />
      {children}
    </div>
  )
}
