"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { Check, Copy } from "lucide-react"

import { CelebrationAnimation } from "@/components/atom/celebration-animation"
import { Modal } from "@/components/atom/modal"

interface ApplicationSuccessModalProps {
  applicationNumber: string
  applicantEmail?: string
  /** @deprecated use trackingCode — kept for legacy in-flight data compatibility */
  password?: string
  /** Application Tracking Code (accessToken) shown prominently to applicant */
  trackingCode?: string
  schoolUrl?: string
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
  isRTL?: boolean
  locale?: string
  dictionary?: Record<string, unknown>
}

export default function ApplicationSuccessModal({
  applicationNumber,
  applicantEmail,
  password,
  trackingCode,
  schoolUrl,
  showModal,
  setShowModal,
  isRTL = false,
  locale = "en",
  dictionary,
}: ApplicationSuccessModalProps) {
  // Resolve the tracking code: prefer the explicit prop, fall back to the
  // legacy `password` prop so in-flight data still renders correctly.
  const resolvedTrackingCode = trackingCode ?? password
  const [copied, setCopied] = useState(false)

  const dict = useMemo(() => {
    const d = dictionary as Record<string, unknown> | undefined
    const school = d?.school as Record<string, unknown> | undefined
    const admission = school?.admission as Record<string, unknown> | undefined
    const apply = admission?.apply as Record<string, unknown> | undefined
    return (apply?.successModal as Record<string, string>) ?? {}
  }, [dictionary])

  const handleCopy = useCallback(() => {
    const lines = [
      `${dict.applicationNo || "Application No"}: ${applicationNumber}`,
    ]
    if (applicantEmail) {
      lines.push(`${dict.email || "Email"}: ${applicantEmail}`)
    }
    if (resolvedTrackingCode) {
      lines.push(
        `${dict.trackingCode || "Application Tracking Code"}: ${resolvedTrackingCode}`
      )
    }
    if (schoolUrl) {
      lines.push(`${dict.school || "School"}: ${schoolUrl}`)
    }
    lines.push(`${dict.docs || "Docs"}: ed.databayt.org/docs`)

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [applicationNumber, applicantEmail, resolvedTrackingCode, schoolUrl, dict])

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="md:max-w-sm"
      preventDefaultClose
      title={dict.submitted || "Application submitted"}
      description={dict.submitted || "Application submitted"}
    >
      <div className="px-4 py-8 text-center sm:px-8 sm:py-12">
        <CelebrationAnimation className="mb-4" />

        {/* Success Message */}
        <p className="text-muted-foreground mb-6">
          {dict.submitted || "Application submitted"}
        </p>

        {/* Copy details */}
        <div className="flex items-center justify-center gap-1.5">
          {copied ? (
            <>
              <span className="text-xs text-green-700">
                {dict.copied || "Copied to clipboard"}
              </span>
              <Check className="h-3 w-3 text-green-700" />
            </>
          ) : (
            <>
              <span className="text-muted-foreground text-xs">
                {dict.copyDetails || "Copy details to clipboard"}
              </span>
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground -m-2 p-2 transition-colors"
                aria-label={dict.copyDetails || "Copy details to clipboard"}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Home link */}
        <div className="mt-6">
          <Link
            href={`/${locale}`}
            className="text-primary text-sm underline transition-colors hover:opacity-80"
          >
            {dict.backToHome || "Back to Home"}
          </Link>
        </div>
      </div>
    </Modal>
  )
}
