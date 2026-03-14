// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  acceptInvitation,
  declineInvitation,
} from "@/components/school-dashboard/school/membership/actions"

interface AcceptInviteFormProps {
  token: string
  schoolDomain: string
  lang: string
}

export function AcceptInviteForm({
  token,
  schoolDomain,
  lang,
}: AcceptInviteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading("accept")
    setError(null)
    try {
      const result = await acceptInvitation(token)
      if (result.success && result.data?.domain) {
        window.location.href = `https://${result.data.domain}.databayt.org/${lang}/dashboard`
      } else if (!result.success) {
        setError(result.error || "Failed to accept invitation")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  async function handleDecline() {
    setLoading("decline")
    setError(null)
    try {
      const result = await declineInvitation(token)
      if (result.success) {
        router.push(`/${lang}`)
      } else {
        setError(result.error || "Failed to decline invitation")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-4 flex w-full flex-col gap-3">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <button
        onClick={handleAccept}
        disabled={loading !== null}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium disabled:opacity-50"
      >
        {loading === "accept" ? "Accepting..." : "Accept Invitation"}
      </button>
      <button
        onClick={handleDecline}
        disabled={loading !== null}
        className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-full items-center justify-center rounded-md border text-sm font-medium disabled:opacity-50"
      >
        {loading === "decline" ? "Declining..." : "Decline"}
      </button>
    </div>
  )
}
