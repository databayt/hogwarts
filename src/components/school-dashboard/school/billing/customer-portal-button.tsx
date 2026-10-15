"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { Icons } from "@/components/saas-marketing/pricing/shared/icons"

import { openCustomerPortal } from "./actions"

interface CustomerPortalButtonProps {
  userStripeId: string
  /** Overrides the dictionary label (for callers outside the dashboard). */
  label?: string
}

export function CustomerPortalButton({
  userStripeId,
  label,
}: CustomerPortalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const dictionary = useDictionaryFallback()
  const generateUserStripeSession = openCustomerPortal.bind(null, userStripeId)

  const stripeSessionAction = () => {
    startTransition(() => {
      void generateUserStripeSession()
    })
  }

  return (
    <Button disabled={isPending} onClick={stripeSessionAction}>
      {isPending ? (
        <Icons.spinner className="me-2 size-4 animate-spin" />
      ) : null}
      {label ?? dictionary?.schoolConsole?.billing?.openPortal}
    </Button>
  )
}
