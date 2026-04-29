"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { cancelTrip, finishTrip, startTrip } from "../actions/trips"

interface Props {
  tripId: string
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  dictionary: Dictionary
}

export function TripBoardingControls({ tripId, status, dictionary }: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<{ success: boolean }>, successMsg: string) {
    startTransition(async () => {
      const result = await fn()
      if (result.success) {
        toast.success(successMsg)
        router.refresh()
      } else {
        toast.error(t.errors.internalError)
      }
    })
  }

  if (status === "COMPLETED" || status === "CANCELLED") {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 pb-2">
      {status === "SCHEDULED" ? (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() => startTrip({ id: tripId }), t.trips.toasts.started)
            }
          >
            {t.trips.actions.start}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(() => cancelTrip({ id: tripId }), t.trips.toasts.cancelled)
            }
          >
            {t.trips.actions.cancel}
          </Button>
        </>
      ) : null}
      {status === "IN_PROGRESS" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            run(() => finishTrip({ id: tripId }), t.trips.toasts.finished)
          }
        >
          {t.trips.actions.finish}
        </Button>
      ) : null}
    </div>
  )
}
