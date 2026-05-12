// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

/**
 * Client-side wrapper. Hogwarts has SessionProvider mounted globally
 * (src/app/[lang]/layout.tsx:101) so useSession() works in every consumer
 * regardless of whether the caller is a server or client component.
 *
 * External code keeps importing `@/components/report-issue` as before —
 * the public API (`<ReportIssue variant />`) is unchanged.
 */
import * as React from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

import { reportIssue } from "@/lib/actions/report-issue"

import { ReportIssueDialog } from "./dialog"

export interface ReportIssueProps {
  variant?: "text" | "icon"
}

export function ReportIssue({ variant }: ReportIssueProps = {}) {
  const { status } = useSession()
  const pathname = usePathname()
  const lang = pathname?.startsWith("/ar") ? "ar" : "en"
  const hasSession = status === "authenticated"

  return (
    <ReportIssueDialog
      variant={variant}
      lang={lang}
      hasSession={hasSession}
      onSubmit={reportIssue}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      signInHref="/login"
    />
  )
}

export type {
  ReportIssueDialogProps,
  ReportIssueSubmitInput,
  ReportIssueSubmitResult,
} from "./dialog"
