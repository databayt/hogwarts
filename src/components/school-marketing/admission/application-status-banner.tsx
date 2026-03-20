// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/components/internationalization/config"

interface ApplicationStatusBannerProps {
  schoolId: string
  locale: Locale
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "تم التقديم",
  UNDER_REVIEW: "قيد المراجعة",
  SHORTLISTED: "في القائمة المختصرة",
  ENTRANCE_SCHEDULED: "موعد اختبار القبول",
  INTERVIEW_SCHEDULED: "موعد المقابلة",
  SELECTED: "تم القبول",
  WAITLISTED: "قائمة الانتظار",
  REJECTED: "مرفوض",
  ADMITTED: "تم التسجيل",
  WITHDRAWN: "تم السحب",
}

const STATUS_BADGE_VARIANT: Record<
  string,
  "outline" | "secondary" | "default" | "destructive"
> = {
  SUBMITTED: "outline",
  UNDER_REVIEW: "outline",
  SHORTLISTED: "secondary",
  ENTRANCE_SCHEDULED: "secondary",
  INTERVIEW_SCHEDULED: "secondary",
  SELECTED: "default",
  WAITLISTED: "outline",
  REJECTED: "destructive",
  ADMITTED: "default",
  WITHDRAWN: "destructive",
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

  const status = application.status
  const variant = STATUS_BADGE_VARIANT[status] ?? "outline"
  const label = STATUS_LABELS[status] ?? status

  const isTrackable = status === "SUBMITTED" || status === "UNDER_REVIEW"
  const needsPayment = status === "SELECTED" && !application.applicationFeePaid
  const isAdmitted = status === "ADMITTED"
  const isDismissed = status === "REJECTED" || status === "WITHDRAWN"

  return (
    <div className="bg-muted border-b px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            {locale === "ar" ? "طلب رقم" : "Application"}{" "}
            <span className="font-mono font-medium">
              {application.applicationNumber}
            </span>
          </span>
          <Badge variant={variant}>{label}</Badge>
        </div>

        <div className="text-sm">
          {isTrackable && (
            <Link
              href={`/${locale}/application/${application.campaignId}/status`}
              className="text-primary hover:underline"
            >
              {locale === "ar" ? "تتبع الطلب" : "Track Application"}
            </Link>
          )}

          {needsPayment && (
            <Link
              href={`/${locale}/application/${application.campaignId}/payment`}
              className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-sm font-medium hover:opacity-90"
            >
              {locale === "ar" ? "ادفع الآن" : "Pay Now"}
            </Link>
          )}

          {isAdmitted && (
            <span className="font-medium text-green-600 dark:text-green-400">
              {locale === "ar" ? "تم القبول" : "Enrollment Confirmed"}
            </span>
          )}

          {isDismissed && (
            <span className="text-muted-foreground">{label}</span>
          )}
        </div>
      </div>
    </div>
  )
}
