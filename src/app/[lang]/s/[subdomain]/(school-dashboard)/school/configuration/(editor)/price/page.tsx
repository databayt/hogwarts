// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigPriceForm } from "@/components/school-dashboard/school/configuration/config-price-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.price?.title ||
      "Configuration: Price",
  }
}

export default async function PricePage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()
  const dictionary = await getDictionary(lang)

  const school = schoolId
    ? await db.school
        .findUnique({
          where: { id: schoolId },
          select: {
            tuitionFee: true,
            currency: true,
            registrationFee: true,
            applicationFee: true,
            paymentSchedule: true,
            country: true,
          },
        })
        .catch(() => null)
    : null

  return (
    <ConfigPriceForm
      schoolId={schoolId || ""}
      initial={{
        tuitionFee:
          school?.tuitionFee != null ? Number(school.tuitionFee) : null,
        currency: school?.currency ?? null,
        registrationFee:
          school?.registrationFee != null
            ? Number(school.registrationFee)
            : null,
        applicationFee:
          school?.applicationFee != null ? Number(school.applicationFee) : null,
        paymentSchedule: school?.paymentSchedule ?? null,
        country: school?.country ?? null,
      }}
      lang={lang}
      t={dictionary.schoolBilling}
    />
  )
}
