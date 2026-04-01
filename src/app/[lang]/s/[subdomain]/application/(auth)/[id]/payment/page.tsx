// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PaymentContent from "@/components/school-marketing/application/payment/content"

export const metadata = {
  title: "Payment | Apply",
  description: "Pay your application fee.",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{
    number?: string
    cancelled?: string
    token?: string
  }>
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams

  const { subdomain, id: applicationId, lang } = resolvedParams
  const accessToken = resolvedSearch.token

  // Access token is required to prevent IDOR attacks
  if (!accessToken) {
    notFound()
  }

  // Resolve school
  const schoolResult = await getSchoolBySubdomain(subdomain)
  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  const schoolId = schoolResult.data.id
  const currency = schoolResult.data.currency ?? "USD"

  // Fetch application + campaign fee from DB (never trust URL params for these)
  // accessToken in where clause ensures the caller owns this application
  const application = await db.application.findFirst({
    where: { id: applicationId, schoolId, accessToken },
    select: {
      id: true,
      applicationNumber: true,
      applicationFeePaid: true,
      accessToken: true,
      status: true,
      campaign: {
        select: { applicationFee: true },
      },
    },
  })

  if (!application) {
    notFound()
  }

  const dictionary = await getDictionary(lang)

  // Already paid guard
  if (application.applicationFeePaid) {
    const isAr = lang === "ar"
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
          <svg
            className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">
          {isAr ? "تم الدفع بنجاح" : "Payment Successful"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? `تم دفع رسوم الطلب بالفعل. رقم الطلب: ${application.applicationNumber}`
            : `Application fee has already been paid. Application #: ${application.applicationNumber}`}
        </p>
      </div>
    )
  }

  const fee = Number(application.campaign.applicationFee ?? 0)

  // Resolve available payment gateways from admission settings
  const settings = await db.admissionSettings.findUnique({
    where: { schoolId },
    select: { paymentMethods: true, enableOnlinePayment: true },
  })

  const defaultMethods = ["stripe", "cash"]
  let methods = Array.isArray(settings?.paymentMethods)
    ? (settings.paymentMethods as string[])
    : defaultMethods

  // When online payment is disabled, filter out electronic gateways
  if (!settings?.enableOnlinePayment) {
    methods = methods.filter((m) => m !== "stripe" && m !== "tap")
    // Ensure at least cash is available
    if (methods.length === 0) methods = ["cash"]
  }

  return (
    <PaymentContent
      applicationNumber={resolvedSearch.number ?? application.applicationNumber}
      applicationId={application.id}
      accessToken={accessToken}
      fee={fee}
      currency={currency}
      methods={methods}
      locale={lang}
      dictionary={dictionary}
    />
  )
}
