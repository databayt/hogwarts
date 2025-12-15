"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/marketing/pricing/shared/icons"

import { openCustomerPortal } from "./actions"

interface CustomerPortalButtonProps {
  userStripeId: string
}

export function CustomerPortalButton({
  userStripeId,
}: CustomerPortalButtonProps) {
  const [isPending, startTransition] = useTransition()
  const generateUserStripeSession = openCustomerPortal.bind(null, userStripeId)

  const stripeSessionAction = () => {
    startTransition(() => {
      void generateUserStripeSession()
    })
  }

  return (
    <Button disabled={isPending} onClick={stripeSessionAction}>
      {isPending ? (
        <Icons.spinner className="mr-2 size-4 animate-spin" />
      ) : null}
      Open Customer Portal
    </Button>
  )
}
