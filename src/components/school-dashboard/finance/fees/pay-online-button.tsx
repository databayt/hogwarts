// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useTransition } from "react"
import { CreditCard, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

import { createFeePaymentCheckout } from "./actions"

interface PayOnlineButtonProps {
  feeAssignmentId: string
  lang: string
  remaining: number
  disabled?: boolean
  dictionary?: {
    payOnline?: string
    redirecting?: string
  }
}

export function PayOnlineButton({
  feeAssignmentId,
  lang,
  remaining,
  disabled,
  dictionary,
}: PayOnlineButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createFeePaymentCheckout(feeAssignmentId, lang)
      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
      }
    })
  }

  if (remaining <= 0 || disabled) return null

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <Loader2 className="me-2 h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="me-2 h-4 w-4" />
      )}
      {isPending
        ? dictionary?.redirecting || "Redirecting..."
        : dictionary?.payOnline || "Pay Online"}
    </Button>
  )
}
