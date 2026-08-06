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
   * Two route-scoped rules, the same pair /admissions carries -- this page has
   * to read as one surface with the zenda nav above it and the zenda footer
   * below.
   *
   * 1. Cream. The chrome paints zenda's cream edge to edge. The content sits
   *    inside `.marketing-container` (max-width + gutters), so a background on
   *    the content itself can never reach the viewport edge -- paint
   *    `.main-wrapper` instead, scoped the same way the homepage scopes its
   *    opacity gate. Value must equal zenda's `.bg-beige-home` (.band-cream).
   *
   * 2. Rail. `.marketing-container` adds its own inner padding on top of the
   *    shared max-width, which lands content inside the nav logo rather than on
   *    the same vertical. The nav's rail is `.nav_component{padding-inline:5%}`
   *    plus `.nav_wrap{max-width:80rem;margin-inline:auto}`, so reproduce
   *    exactly that here and every section lines up with the logo at every
   *    width, both directions. Scoped to this route: `.marketing-container` is
   *    shared with every other marketing page and their gutters are unchanged.
   */
  const zendaSurface = (
    <style>
      {`.main-wrapper{background-color:#f5f4ee}` +
        `.school-content.marketing-container{max-width:none;margin-inline:0;padding-inline:5%}` +
        `.school-content.marketing-container>main{width:100%;max-width:80rem;margin-inline:auto}`}
    </style>
  )

  return (
    <div
      className="school-content marketing-container"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      {zendaSurface}
      <AcademicContent school={school} dictionary={dictionary} lang={lang} />
    </div>
  )
}
