// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSchoolGradeCountry } from "@/lib/grade/school"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getOfferDetails,
  verifyRegistrationFeeReturn,
} from "@/components/school-marketing/application/offer/actions"
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
    /** Tap appends `tap_id=chg_…` on success AND failure alike. */
    tap_id?: string | string[]
  }>
}

export default async function OfferPage({ params, searchParams }: Props) {
  const { lang, id: applicationId } = await params
  const {
    token: accessToken,
    cancelled,
    registration,
    tap_id: rawTapId,
  } = await searchParams

  if (!accessToken) {
    notFound()
  }

  // Tap sends the payer back to the "success" URL whatever happened, so a Tap
  // return is read back from Tap (and settled if captured) before the page
  // says anything — and before the offer is read, so it reflects the result.
  const tapId = Array.isArray(rawTapId) ? rawTapId[0] : rawTapId
  let registrationState = registration
  if (tapId) {
    const verified = await verifyRegistrationFeeReturn(
      applicationId,
      accessToken,
      tapId
    )
    registrationState = verified.success ? verified.data?.state : undefined
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
      registrationParam={registrationState}
      accessToken={accessToken}
      gradeCountry={gradeCountry}
    />
  )
}
