"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface BannerApplication {
  id: string
  applicationNumber: string
  status: string
  campaignId: string
  applicationFeePaid: boolean
}

interface ApplicationStatusBannerClientProps {
  application: BannerApplication
  locale: string
}

const STATUS_LABELS: Record<string, Record<string, string>> = {
  SUBMITTED: { ar: "تم التقديم", en: "Submitted" },
  UNDER_REVIEW: { ar: "قيد المراجعة", en: "Under Review" },
  SHORTLISTED: { ar: "في القائمة المختصرة", en: "Shortlisted" },
  ENTRANCE_SCHEDULED: { ar: "موعد اختبار القبول", en: "Entrance Scheduled" },
  INTERVIEW_SCHEDULED: { ar: "موعد المقابلة", en: "Interview Scheduled" },
  SELECTED: { ar: "تم القبول", en: "Accepted" },
  WAITLISTED: { ar: "قائمة الانتظار", en: "Waitlisted" },
  REJECTED: { ar: "مرفوض", en: "Not Selected" },
  ADMITTED: { ar: "تم التسجيل", en: "Enrolled" },
  WITHDRAWN: { ar: "تم السحب", en: "Withdrawn" },
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

// Timeline steps for the progress indicator
const TIMELINE_STEPS = ["SUBMITTED", "UNDER_REVIEW", "SELECTED", "ADMITTED"]

function getTimelineIndex(status: string): number {
  if (status === "SUBMITTED") return 0
  if (
    status === "UNDER_REVIEW" ||
    status === "SHORTLISTED" ||
    status === "ENTRANCE_SCHEDULED" ||
    status === "INTERVIEW_SCHEDULED"
  )
    return 1
  if (status === "SELECTED") return 2
  if (status === "ADMITTED") return 3
  return -1 // REJECTED, WAITLISTED, WITHDRAWN — not on the happy path
}

function StatusMessage({
  status,
  applicationNumber,
  applicationFeePaid,
  locale,
}: {
  status: string
  applicationNumber: string
  applicationFeePaid: boolean
  locale: string
}) {
  const isAr = locale === "ar"

  if (status === "SELECTED" && applicationFeePaid) {
    return (
      <span className="text-sm text-white">
        {isAr
          ? "تهانينا! تم قبولك — تم الدفع"
          : "Congratulations! Accepted — Payment received"}
      </span>
    )
  }

  if (status === "SELECTED") {
    return (
      <span className="text-sm text-white">
        {isAr ? "تهانينا! تم قبولك" : "Congratulations! You've been accepted"}
      </span>
    )
  }

  if (status === "ADMITTED") {
    return (
      <span className="text-sm text-white">
        {isAr ? "مرحبًا! تم تأكيد التسجيل" : "Welcome! Enrollment confirmed"}
      </span>
    )
  }

  const label = STATUS_LABELS[status]?.[locale] ?? status
  return (
    <span className="text-sm text-white">
      {isAr ? "طلب رقم" : "Application"}{" "}
      <span className="font-mono font-medium">{applicationNumber}</span>
      {" — "}
      {label}
    </span>
  )
}

function TimelineIndicator({ status }: { status: string }) {
  const currentIndex = getTimelineIndex(status)
  if (currentIndex < 0) return null

  return (
    <div className="hidden items-center gap-1 sm:flex">
      {TIMELINE_STEPS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-6 rounded-full transition-colors ${
            i <= currentIndex ? "bg-white" : "bg-white/30"
          }`}
        />
      ))}
    </div>
  )
}

export function ApplicationStatusBannerClient({
  application,
  locale,
}: ApplicationStatusBannerClientProps) {
  const [dismissed, setDismissed] = useState(false)

  const storageKey = `banner-dismissed-${application.id}`

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDismissed(localStorage.getItem(storageKey) === "true")
    }
  }, [storageKey])

  if (dismissed) return null

  const { status, applicationNumber, campaignId, applicationFeePaid } =
    application
  const variant = STATUS_BADGE_VARIANT[status] ?? "outline"

  const needsPayment = status === "SELECTED" && !applicationFeePaid
  const isAdmitted = status === "ADMITTED"
  const selectedAndPaid = status === "SELECTED" && applicationFeePaid

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true")
    setDismissed(true)
  }

  return (
    <div className="w-full bg-[#E8704E] px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4">
        <StatusMessage
          status={status}
          applicationNumber={applicationNumber}
          applicationFeePaid={applicationFeePaid}
          locale={locale}
        />

        <Badge variant={variant} className="hidden sm:inline-flex">
          {STATUS_LABELS[status]?.[locale] ?? status}
        </Badge>

        <TimelineIndicator status={status} />

        <div className="flex items-center gap-2 text-sm">
          {needsPayment && (
            <Link
              href={`/${locale}/application/${campaignId}/payment`}
              className="rounded-md bg-white px-3 py-1 text-sm font-medium text-[#E8704E] hover:bg-white/90"
            >
              {locale === "ar" ? "إكمال الدفع" : "Complete Payment"}
            </Link>
          )}

          {(isAdmitted || selectedAndPaid) && (
            <Link
              href={`/${locale}/dashboard`}
              className="rounded-md bg-white px-3 py-1 text-sm font-medium text-[#E8704E] hover:bg-white/90"
            >
              {locale === "ar" ? "لوحة التحكم" : "Go to Dashboard"}
            </Link>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="ms-2 text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
