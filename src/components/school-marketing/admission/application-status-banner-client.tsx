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

// All banner copy is resolved server-side (dictionary lookup + locale-aware
// fallback — see application-status-banner.tsx) so this client component
// never has to branch on `locale` itself. Every field defaults to English
// here too so the component still renders sensibly if a caller omits
// `messages` (e.g. a test rendering the component in isolation).
export interface BannerMessages {
  applicationLabel?: string
  waitingApproval?: string
  approvedContinuePayment?: string
  payNow?: string
  approvedPaymentReceived?: string
  enrolled?: string
  notAccepted?: string
  withdrawn?: string
  dismiss?: string
}

const DEFAULT_MESSAGES: Required<BannerMessages> = {
  applicationLabel: "Application",
  waitingApproval: "waiting for approval",
  approvedContinuePayment: "approved, continue with payment",
  payNow: "Pay Now",
  approvedPaymentReceived: "approved, payment received",
  enrolled: "enrolled",
  notAccepted: "not accepted",
  withdrawn: "withdrawn",
  dismiss: "Dismiss",
}

interface ApplicationStatusBannerClientProps {
  application: BannerApplication
  locale: string
  // Present only when the application is SELECTED and its access token is
  // still valid — the dead `/payment` route must never be linked.
  offerUrl?: string
  messages?: BannerMessages
}

function BannerMessage({
  status,
  applicationNumber,
  applicationFeePaid,
  offerUrl,
  messages,
}: {
  status: string
  applicationNumber: string
  applicationFeePaid: boolean
  offerUrl?: string
  messages: Required<BannerMessages>
}) {
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
        {messages.applicationLabel}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {messages.waitingApproval}
      </span>
    )
  }

  // SELECTED (approved) — needs payment
  if (status === "SELECTED" && !applicationFeePaid) {
    return (
      <span className="flex items-center gap-2 text-sm text-white">
        {messages.applicationLabel}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {messages.approvedContinuePayment}
        {offerUrl && (
          <Link
            href={offerUrl}
            className="rounded-md bg-white px-3 py-1 text-sm font-medium text-[#E8704E] hover:bg-white/90"
          >
            {messages.payNow}
          </Link>
        )}
      </span>
    )
  }

  // SELECTED + paid
  if (status === "SELECTED" && applicationFeePaid) {
    return (
      <span className="text-sm text-white">
        {messages.applicationLabel}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {messages.approvedPaymentReceived}
      </span>
    )
  }

  // ADMITTED
  if (status === "ADMITTED") {
    return (
      <span className="text-sm text-white">
        {messages.applicationLabel}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {messages.enrolled}
      </span>
    )
  }

  // REJECTED / WITHDRAWN / WAITLISTED
  if (status === "REJECTED") {
    return (
      <span className="text-sm text-white/80">
        {messages.applicationLabel}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {messages.notAccepted}
      </span>
    )
  }

  if (status === "WITHDRAWN") {
    return (
      <span className="text-sm text-white/80">
        {messages.applicationLabel}{" "}
        <span className="font-mono font-medium">{applicationNumber}</span>
        {" — "}
        {messages.withdrawn}
      </span>
    )
  }

  // Fallback
  return (
    <span className="text-sm text-white">
      {messages.applicationLabel}{" "}
      <span className="font-mono font-medium">{applicationNumber}</span>
    </span>
  )
}

export function ApplicationStatusBannerClient({
  application,
  offerUrl,
  messages,
}: ApplicationStatusBannerClientProps) {
  const [dismissed, setDismissed] = useState(false)
  const resolvedMessages: Required<BannerMessages> = {
    ...DEFAULT_MESSAGES,
    ...messages,
  }

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
          offerUrl={offerUrl}
          messages={resolvedMessages}
        />

        <button
          onClick={handleDismiss}
          className="ms-2 text-white/70 hover:text-white"
          aria-label={resolvedMessages.dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
