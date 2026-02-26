// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PaymentContent from "@/components/school-marketing/apply/payment/content"

export const metadata = {
  title: "Payment | Apply",
  description: "Pay your application fee.",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{
    number?: string
    cancelled?: string
  }>
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams

  const { subdomain, id: applicationId, lang } = resolvedParams

  // Resolve school
  const schoolResult = await getSchoolBySubdomain(subdomain)
  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  const schoolId = schoolResult.data.id
  const currency = schoolResult.data.currency ?? "USD"

  // Fetch application + campaign fee from DB (never trust URL params for these)
  const application = await db.application.findFirst({
    where: { id: applicationId, schoolId },
    select: {
      id: true,
      applicationNumber: true,
      campaign: {
        select: { applicationFee: true },
      },
    },
  })

  if (!application) {
    notFound()
  }

  const fee = Number(application.campaign.applicationFee ?? 0)

  // Resolve available payment gateways from admission settings
  const settings = await db.admissionSettings.findUnique({
    where: { schoolId },
    select: { paymentMethods: true },
  })

  const defaultMethods = ["stripe", "cash"]
  const methods = Array.isArray(settings?.paymentMethods)
    ? (settings.paymentMethods as string[])
    : defaultMethods

  const dictionary = await getDictionary(lang)

  return (
    <PaymentContent
      applicationNumber={resolvedSearch.number ?? application.applicationNumber}
      applicationId={application.id}
      fee={fee}
      currency={currency}
      methods={methods}
      locale={lang}
      dictionary={dictionary}
    />
  )
}
