"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorToast } from "@/components/atom/toast"
import { type Locale } from "@/components/internationalization/config"
import { createLiveClassFromTimetable } from "@/components/school-dashboard/conference/actions/sessions"

/**
 * "Start live class" button on the teacher's Current/Next timetable card.
 * Provisions (or reuses) a LiveKit session for the slot and routes to the
 * in-app room. Shown only when there is no session/link to join yet; the
 * server action enforces host ownership.
 */
export function StartLiveClassButton({
  timetableId,
  lang,
  label,
  startingLabel,
  errorLabel,
}: {
  timetableId: string | null | undefined
  lang: Locale
  label: string
  startingLabel: string
  errorLabel: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (!timetableId) return null

  function onStart() {
    startTransition(async () => {
      const res = await createLiveClassFromTimetable({
        timetableId: timetableId!,
      })
      if ("success" in res && res.success) {
        router.push(`/${lang}/conference/${res.data.id}/room`)
      } else {
        ErrorToast(errorLabel)
      }
    })
  }

  return (
    <Button
      size="sm"
      className="gap-2"
      disabled={pending}
      aria-busy={pending}
      onClick={onStart}
    >
      <Video className="h-4 w-4" />
      {pending ? startingLabel : label}
    </Button>
  )
}
