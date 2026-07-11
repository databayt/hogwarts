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
  if (!flags.enablePublicPortal) {
    return (
      <div className="school-content" data-school-id={school.id}>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="mb-3 text-2xl font-semibold">
            {lang === "ar" ? "القبول مغلق حالياً" : "Admissions are closed"}
          </h1>
          <p className="text-muted-foreground">
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
      className="school-content"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      <AdmissionContent school={school} dictionary={dictionary} lang={lang} />
    </div>
  )
}
