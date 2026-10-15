"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { Link2, Link2Off, MessageCircle, Share2 } from "lucide-react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { revokeReportCardShare, shareReportCard } from "../actions/share"

/**
 * Share one published report card: a public read-only link (copied, or sent
 * straight to WhatsApp), and a way to switch the link off again.
 */
export function ReportCardShareButton({
  reportCardId,
  isPublic,
  studentName,
}: {
  reportCardId: string
  isPublic: boolean
  studentName: string
}) {
  const router = useRouter()
  const { lang } = useParams<{ lang: string }>()
  const { dictionary } = useDictionary()
  const t = dictionary?.results?.reportCards?.share
  const [busy, startTransition] = useTransition()
  const [shared, setShared] = useState(isPublic)

  const link = async () => {
    const res = await shareReportCard(reportCardId)
    if (!res.success || !res.data) {
      ErrorToast(actionErrorMessage(res.error, dictionary, t?.failed ?? ""))
      return null
    }
    setShared(true)
    return `${window.location.origin}/${lang}/report-card/${res.data.token}`
  }

  const copy = () =>
    startTransition(async () => {
      const url = await link()
      if (!url) return
      await navigator.clipboard.writeText(url)
      SuccessToast(t?.copied ?? "")
    })

  const whatsapp = () =>
    startTransition(async () => {
      const url = await link()
      if (!url) return
      const text = (t?.message ?? "{name}: {url}")
        .replace("{name}", studentName)
        .replace("{url}", url)
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      )
    })

  const revoke = () =>
    startTransition(async () => {
      const res = await revokeReportCardShare(reportCardId)
      if (!res.success) {
        ErrorToast(actionErrorMessage(res.error, dictionary, t?.failed ?? ""))
        return
      }
      setShared(false)
      SuccessToast(t?.revoked ?? "")
      router.refresh()
    })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={busy} aria-label={t?.label}>
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={copy}>
          <Link2 className="me-2 h-4 w-4" />
          {t?.copy}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={whatsapp}>
          <MessageCircle className="me-2 h-4 w-4" />
          {t?.whatsapp}
        </DropdownMenuItem>
        {shared && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={revoke} className="text-destructive">
              <Link2Off className="me-2 h-4 w-4" />
              {t?.revoke}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
