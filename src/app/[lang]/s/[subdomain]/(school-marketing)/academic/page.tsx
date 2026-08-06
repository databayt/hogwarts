// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// 1 hour — school marketing pages change infrequently

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AcademicContent from "@/components/school-marketing/academic/content"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/school-marketing/metadata"
import { getCurrentDomain } from "@/components/school-marketing/utils"

export const revalidate = 3600

interface AcademicProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: AcademicProps): Promise<Metadata> {
  const { subdomain, lang } = await params
  const result = await getSchoolBySubdomain(subdomain)
  const { rootDomain } = await getCurrentDomain()

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain)
  }

  return generateSchoolMetadata({
    school: result.data,
    subdomain,
    rootDomain,
    locale: lang,
  })
}

export default async function Academic({ params }: AcademicProps) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)
  const result = await getSchoolBySubdomain(subdomain)

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data

  /*
   * The zenda chrome (nav above, footer below) paints its cream edge to edge
   * and this page must flow seamlessly between them. The content sits inside
   * `.marketing-container` (max-width + gutters), so a background on the
   * content itself can never reach the viewport edge -- paint `.main-wrapper`
   * instead, route-scoped the same way the homepage scopes its opacity gate.
   * Value must equal zenda's `.bg-beige-home` cream (see .band-cream).
   */
  const creamGate = <style>{`.main-wrapper{background-color:#f5f4ee}`}</style>

  return (
    <div
      className="school-content marketing-container"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      {creamGate}
      <AcademicContent school={school} dictionary={dictionary} lang={lang} />
    </div>
  )
}
