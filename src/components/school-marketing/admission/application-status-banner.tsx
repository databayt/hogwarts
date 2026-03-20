// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"

import { ApplicationStatusBannerClient } from "./application-status-banner-client"

interface ApplicationStatusBannerProps {
  schoolId: string
  locale: Locale
}

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
    },
  })

  if (!application) {
    return null
  }

  return (
    <ApplicationStatusBannerClient application={application} locale={locale} />
  )
}
