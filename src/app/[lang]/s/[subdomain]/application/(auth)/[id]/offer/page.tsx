// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolGradeCountry } from "@/lib/grade/school"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getOfferDetails } from "@/components/school-marketing/application/offer/actions"
import OfferContent from "@/components/school-marketing/application/offer/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  return {
    title:
      lang === "ar" ? "عرض القبول | التقديم" : "Admission Offer | Application",
    description:
      lang === "ar"
        ? "راجع عرض القبول وجدول الرسوم"
        : "Review your admission offer and fee schedule",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{
    token?: string
    cancelled?: string
    registration?: string
  }>
}

export default async function OfferPage({ params, searchParams }: Props) {
  const { lang, id: applicationId } = await params
  const { token: accessToken, cancelled, registration } = await searchParams

  if (!accessToken) {
    notFound()
  }

  const result = await getOfferDetails(applicationId, accessToken)

  if (!result.success || !result.data) {
    notFound()
  }

  const [dictionary, gradeCountry] = await Promise.all([
    getDictionary(lang),
    getSchoolGradeCountry(result.data.school.id).catch(() => null),
  ])

  return (
    <OfferContent
      offer={result.data}
      locale={lang}
      dictionary={dictionary}
      cancelled={cancelled === "true"}
      registrationParam={registration}
      accessToken={accessToken}
      gradeCountry={gradeCountry}
    />
  )
}
