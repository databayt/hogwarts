"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { regenerateTripPlan } from "../actions/optimize"

interface Props {
  tripId: string
  dictionary: Dictionary
}

export function RegenerateTripPlanButton({ tripId, dictionary }: Props) {
  const t = dictionary.transportation
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await regenerateTripPlan(tripId)
      if (result.success) {
        SuccessToast(t.optimize.optimized)
        router.refresh()
      } else {
        toast.error(t.optimize.failed)
      }
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={pending}
    >
      {t.optimize.regenerate}
    </Button>
  )
}
