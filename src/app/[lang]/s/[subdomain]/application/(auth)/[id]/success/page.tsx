// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SuccessContent from "@/components/school-marketing/application/success/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const steps = d?.school?.admission?.apply?.steps
  return {
    title: `${steps?.success?.title ?? (lang === "ar" ? "تم تقديم الطلب" : "Application Submitted")} | ${lang === "ar" ? "التقديم" : "Apply"}`,
    description:
      steps?.success?.description ??
      (lang === "ar"
        ? "تم تقديم طلبك بنجاح"
        : "Your application has been submitted successfully."),
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{ number?: string }>
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { lang, subdomain } = await params
  const { number: applicationNumber } = await searchParams
  const dictionary = await getDictionary(lang)
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  // Fetch payment status if we have an application number
  let paymentMethod: string | null = null
  let paymentReference: string | null = null
  let applicationFeePaid = false
  let requiresPayment = false

  if (applicationNumber) {
    const application = await db.application.findFirst({
      where: {
        applicationNumber,
        schoolId: schoolResult.data.id,
      },
      select: {
        paymentMethod: true,
        paymentReference: true,
        applicationFeePaid: true,
        campaign: {
          select: { applicationFee: true },
        },
      },
    })
    if (application) {
      paymentMethod = application.paymentMethod
      paymentReference = application.paymentReference
      applicationFeePaid = application.applicationFeePaid
      requiresPayment =
        !!application.campaign.applicationFee &&
        Number(application.campaign.applicationFee) > 0
    }
  }

  return (
    <SuccessContent
      dictionary={dictionary}
      applicationNumber={applicationNumber}
      schoolName={
        (lang === "ar" ? schoolResult.data.name : schoolResult.data.nameEn) ||
        subdomain.charAt(0).toUpperCase() + subdomain.slice(1)
      }
      paymentMethod={paymentMethod}
      paymentReference={paymentReference}
      applicationFeePaid={applicationFeePaid}
      requiresPayment={requiresPayment}
      accessToken={null}
    />
  )
}
