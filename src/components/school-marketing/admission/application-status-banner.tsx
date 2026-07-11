// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import {
  ApplicationStatusBannerClient,
  type BannerMessages,
} from "./application-status-banner-client"

interface ApplicationStatusBannerProps {
  schoolId: string
  locale: Locale
}

// Dictionary path: dictionary.school.admission.statusBanner.* — not yet in
// school-en.json / school-ar.json (new keys staged for the dictionary owner),
// so every lookup is optional-chained with a locale-aware fallback, matching
// the pattern used elsewhere in this block (see fees/content.tsx).
export async function ApplicationStatusBanner({
  schoolId,
  locale,
}: ApplicationStatusBannerProps) {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const application = await db.application.findFirst({
    where: {
      schoolId,
      userId: session.user.id,
      status: { not: "DRAFT" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      applicationNumber: true,
      status: true,
      campaignId: true,
      applicationFeePaid: true,
      accessToken: true,
      accessTokenExpiry: true,
    },
  })

  if (!application) {
    return null
  }

  const dictionary = await getDictionary(locale)
  const bannerDict =
    (
      dictionary as unknown as {
        school?: { admission?: { statusBanner?: Record<string, string> } }
      }
    )?.school?.admission?.statusBanner ?? {}
  const isAr = locale === "ar"

  // Only send the applicant to the offer page when there is a live, unexpired
  // access token — otherwise the link would 404. The dead `/payment` route
  // (retired 2026-06-12 — applying is free) must never be linked again.
  const offerUrl =
    application.status === "SELECTED" &&
    application.accessToken &&
    application.accessTokenExpiry &&
    application.accessTokenExpiry > new Date()
      ? `/${locale}/application/${application.id}/offer?token=${encodeURIComponent(application.accessToken)}`
      : undefined

  const messages: BannerMessages = {
    applicationLabel:
      bannerDict.applicationLabel || (isAr ? "طلب رقم" : "Application"),
    waitingApproval:
      bannerDict.waitingApproval ||
      (isAr ? "بانتظار الموافقة" : "waiting for approval"),
    approvedContinuePayment:
      bannerDict.approvedContinuePayment ||
      (isAr ? "تمت الموافقة، أكمل الدفع" : "approved, continue with payment"),
    payNow: bannerDict.payNow || (isAr ? "ادفع الآن" : "Pay Now"),
    approvedPaymentReceived:
      bannerDict.approvedPaymentReceived ||
      (isAr ? "تمت الموافقة، تم الدفع" : "approved, payment received"),
    enrolled: bannerDict.enrolled || (isAr ? "تم التسجيل" : "enrolled"),
    notAccepted:
      bannerDict.notAccepted || (isAr ? "لم يتم القبول" : "not accepted"),
    withdrawn: bannerDict.withdrawn || (isAr ? "تم السحب" : "withdrawn"),
    dismiss: bannerDict.dismiss || (isAr ? "إغلاق" : "Dismiss"),
  }

  return (
    <ApplicationStatusBannerClient
      application={application}
      locale={locale}
      offerUrl={offerUrl}
      messages={messages}
    />
  )
}
