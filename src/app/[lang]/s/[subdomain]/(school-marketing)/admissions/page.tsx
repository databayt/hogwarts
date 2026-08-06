// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAdmissionPortalFlags } from "@/components/school-marketing/admission/actions/portal-flags"
import AdmissionContent from "@/components/school-marketing/admission/content"
import {
  generateDefaultMetadata,
  generateSchoolMetadata,
} from "@/components/school-marketing/metadata"
import { getCurrentDomain } from "@/components/school-marketing/utils"

// 1 hour — school marketing pages change infrequently
export const revalidate = 3600

interface AdmissionProps {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({
  params,
}: AdmissionProps): Promise<Metadata> {
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

export default async function Admission({ params }: AdmissionProps) {
  const { lang, subdomain } = await params
  // Parallelize independent async operations to avoid request waterfalls
  const [dictionary, result] = await Promise.all([
    getDictionary(lang),
    getSchoolBySubdomain(subdomain),
  ])

  if (!result.success || !result.data) {
    notFound()
  }

  const school = result.data

  // Honor the school's public-portal master switch (default on when unset).
  const flags = await getAdmissionPortalFlags(school.id)

  /*
   * Two route-scoped rules, both of which exist because this page has to read
   * as one surface with the zenda nav above it and the zenda footer below.
   *
   * 1. Cream. The chrome paints zenda's cream edge to edge. The content sits
   *    inside `.marketing-container` (max-width + gutters), so a background on
   *    the content itself can never reach the viewport edge -- paint
   *    `.main-wrapper` instead, scoped the same way the homepage scopes its
   *    opacity gate. Value must equal zenda's `.bg-beige-home` (.band-cream).
   *
   * 2. Rail. `.marketing-container` puts content on a different vertical than
   *    the nav does -- it adds its own inner padding on top of the shared
   *    max-width, which landed the hero 48px inside the nav logo at 1440 and
   *    12px inside it at 390. The nav's rail is `.nav_component{padding: 5%}`
   *    plus `.nav_wrap{max-width:80rem;margin-inline:auto}`, so reproduce
   *    exactly that on the page's own wrapper and every section lines up with
   *    the logo at every width. Scoped to this route: `.marketing-container` is
   *    shared with every other marketing page and their gutters are unchanged.
   */
  const zendaSurface = (
    <style>
      {`.main-wrapper{background-color:#f5f4ee}` +
        `.school-content.marketing-container{max-width:none;margin-inline:0;padding-inline:5%}` +
        `.school-content.marketing-container>main{width:100%;max-width:80rem;margin-inline:auto}`}
    </style>
  )

  if (!flags.enablePublicPortal) {
    return (
      <div
        className="school-content marketing-container band-cream"
        data-school-id={school.id}
      >
        {zendaSurface}
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="mb-3 text-2xl font-semibold">
            {lang === "ar" ? "القبول مغلق حالياً" : "Admissions are closed"}
          </h1>
          <p className="band-muted">
            {lang === "ar"
              ? "بوابة القبول غير متاحة في الوقت الحالي. يرجى التحقق لاحقاً."
              : "The admissions portal is not open right now. Please check back later."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="school-content marketing-container"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      {zendaSurface}
      <AdmissionContent school={school} dictionary={dictionary} lang={lang} />
    </div>
  )
}
