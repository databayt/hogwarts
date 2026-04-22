"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

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

function BannerMessage({
  status,
  applicationNumber,
  applicationFeePaid,
  applicationId,
  locale,
}: {
  status: string
  applicationNumber: string
  applicationFeePaid: boolean
  applicationId: string
  locale: string
}) {
  const isAr = locale === "ar"

  // SUBMITTED / UNDER_REVIEW / SHORTLISTED / ENTRANCE_SCHEDULED / INTERVIEW_SCHEDULED
  if (
    status === "SUBMITTED" ||
    status === "UNDER_REVIEW" ||
    status === "SHORTLISTED" ||
    status === "ENTRANCE_SCHEDULED" ||
    status === "INTERVIEW_SCHEDULED"
  ) {
    return (
      <span className="text-sm text-white">
        {isAr ? "طلب رقم" : "Application"}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {isAr ? "بانتظار الموافقة" : "waiting for approval"}
      </span>
    )
  }

  // SELECTED (approved) — needs payment
  if (status === "SELECTED" && !applicationFeePaid) {
    return (
      <span className="flex items-center gap-2 text-sm text-white">
        {isAr ? "طلب رقم" : "Application"}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {isAr ? "تمت الموافقة، أكمل الدفع" : "approved, continue with payment"}
        <Link
          href={`/${locale}/application/${applicationId}/payment`}
          className="rounded-md bg-white px-3 py-1 text-sm font-medium text-[#E8704E] hover:bg-white/90"
        >
          {isAr ? "ادفع الآن" : "Pay Now"}
        </Link>
      </span>
    )
  }

  // SELECTED + paid
  if (status === "SELECTED" && applicationFeePaid) {
    return (
      <span className="text-sm text-white">
        {isAr ? "طلب رقم" : "Application"}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {isAr ? "تمت الموافقة، تم الدفع" : "approved, payment received"}
      </span>
    )
  }

  // ADMITTED
  if (status === "ADMITTED") {
    return (
      <span className="text-sm text-white">
        {isAr ? "طلب رقم" : "Application"}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {isAr ? "تم التسجيل" : "enrolled"}
      </span>
    )
  }

  // REJECTED / WITHDRAWN / WAITLISTED
  if (status === "REJECTED") {
    return (
      <span className="text-sm text-white/80">
        {isAr ? "طلب رقم" : "Application"}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {isAr ? "لم يتم القبول" : "not accepted"}
      </span>
    )
  }

  if (status === "WITHDRAWN") {
    return (
      <span className="text-sm text-white/80">
        {isAr ? "طلب رقم" : "Application"}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {isAr ? "تم السحب" : "withdrawn"}
      </span>
    )
  }

  // Fallback
  return (
    <span className="text-sm text-white">
      {isAr ? "طلب رقم" : "Application"}{" "}
      <span className="font-mono font-medium">{applicationNumber}</span>
    </span>
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

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true")
    setDismissed(true)
  }

  return (
    <div className="breakout bg-[#E8704E]">
      <div className="mx-auto flex items-center justify-center gap-3 py-2.5">
        <BannerMessage
          status={application.status}
          applicationNumber={application.applicationNumber}
          applicationFeePaid={application.applicationFeePaid}
          applicationId={application.id}
          locale={locale}
        />

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
