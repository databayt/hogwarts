// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { getTenantContext } from "@/lib/tenant-context"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  return { title: dictionary.school.grades.title }
}

export default async function GradesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary.school.grades
  const { role } = await getTenantContext()
  // Students and guardians reach only the listing — every sub-page is
  // staff-only in routes.ts, so the tab row would be all dead links.
  const selfView = role === "STUDENT" || role === "GUARDIAN"

  // One tab per step of the school's grade workflow: record the marks, turn
  // them into report cards and transcripts, promote, certify, then the
  // templates the documents are filled from.
  const gradesPages: PageNavItem[] = [
    {
      name: d.navAll,
      href: `/${lang}/grades`,
      // The gradebook owns its record pages and the add-grade wizard.
      matchPrefix: `/${lang}/grades`,
    },
    { name: d.navReports, href: `/${lang}/grades/reports` },
    { name: d.navTranscripts, href: `/${lang}/grades/transcripts` },
    { name: d.navPromotion, href: `/${lang}/grades/promotion` },
    { name: d.navCertificates, href: `/${lang}/grades/certificates` },
    { name: d.navTemplates, href: `/${lang}/grades/templates` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d.title} />
      {!selfView && <PageNav pages={gradesPages} />}
      {children}
    </div>
  )
}
