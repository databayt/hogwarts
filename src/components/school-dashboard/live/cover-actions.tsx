"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The two buttons of the cover page: «ادخل كمعلم الحصة» takes the class over and
// walks into its room; «احجز حصة تعويضية» opens the make-up sheet for it. The
// room link is built from the server's answer — the viewer is never trusted.
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorToast } from "@/components/atom/toast"

import { coverSessionAction } from "./actions/cover"
import type { MakeupLabels } from "./makeup-badge"
import { MakeupSheet } from "./makeup-sheet"

export interface CoverActionsLabels {
  enter: string
  entering: string
  makeup: string
  error: string
  taken: string
}

export function CoverActions({
  sessionId,
  lang,
  state,
  labels,
  makeupLabels,
  description,
}: {
  sessionId: string
  lang: string
  /** `taken` (someone else covers) and `over` hide the enter button. */
  state: "ok" | "mine" | "taken" | "over"
  labels: CoverActionsLabels
  makeupLabels: MakeupLabels
  description: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function enter() {
    startTransition(async () => {
      try {
        const res = await coverSessionAction(sessionId)
        if ("success" in res && res.success) {
          // An external class has no room of ours: go to its meeting link.
          if (res.data.external) {
            window.location.assign(res.data.external)
            return
          }
          router.push(`/${lang}/live/${sessionId}/room`)
          return
        }
        ErrorToast(
          "error" in res && res.error === "LIVE_CLASS_INVALID_STATE"
            ? labels.taken
            : labels.error
        )
        router.refresh()
      } catch {
        ErrorToast(labels.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {state === "ok" || state === "mine" ? (
        <Button
          type="button"
          size="lg"
          className="min-h-11 w-full sm:w-auto"
          disabled={pending}
          aria-busy={pending}
          onClick={enter}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {labels.entering}
            </>
          ) : (
            labels.enter
          )}
        </Button>
      ) : null}
      {state !== "taken" ? (
        <MakeupSheet
          missedId={sessionId}
          labels={makeupLabels}
          lang={lang}
          triggerLabel={labels.makeup}
          description={description}
          variant="outline"
          className="w-full sm:w-auto"
        />
      ) : null}
    </div>
  )
}
