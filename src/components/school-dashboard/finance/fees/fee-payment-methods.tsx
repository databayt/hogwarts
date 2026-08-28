"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { GATEWAY_DISPLAY } from "@/lib/payment/constants"
import type { PaymentGateway } from "@/lib/payment/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { PaymentMethodCard } from "@/components/payment/payment-method-card"

import { createFeePaymentCheckout } from "./actions"
import {
  ManualPaymentRail,
  type ManualRailDictionary,
} from "./manual-payment-rail"

type WalletGateway = Extract<PaymentGateway, "bankak" | "cashi">

export interface GatewayPickerDictionary {
  title?: string
  chooseMethod?: string
  redirecting?: string
  paymentFailed?: string
  /** Label for the compact "Pay" trigger used by the family portal. */
  pay?: string
  /** Per-gateway label/description overrides (else GATEWAY_DISPLAY). */
  labels?: Partial<
    Record<PaymentGateway, { label?: string; description?: string }>
  >
}

interface GatewayPickerProps {
  feeAssignmentId: string
  lang: Locale
  methods: PaymentGateway[]
  dictionary?: GatewayPickerDictionary
  /** Copy for the Bankak/Cashi transfer dialog. */
  manualRailDictionary?: ManualRailDictionary
  /** Called after a wallet proof is submitted (so a parent can refresh). */
  onWalletSubmitted?: () => void
}

/**
 * Split the school's resolved rails into what a payer can act on here.
 *
 * Two kinds of rail, two interactions:
 *  - redirect rails (Tap/Stripe) hand off to a hosted checkout page;
 *  - wallet rails (Bankak/Cashi) have no merchant API, so they open a dialog
 *    showing the school's account and take a transfer reference + receipt.
 * cash / bank_transfer stay admin-recorded via /payments/new.
 */
export function payableGateways(methods: PaymentGateway[]): PaymentGateway[] {
  const redirect = methods.filter((m) => m === "tap" || m === "stripe")
  const wallet = methods.filter((m) => m === "bankak" || m === "cashi")
  return [...redirect, ...wallet]
}

/**
 * The gateway grid itself — one card per rail the school offers. Shared by
 * the admin assignment page (inside a Card) and the family portal (inside a
 * per-row dialog), so both surfaces offer exactly the same rails and go
 * through exactly the same server action.
 */
export function GatewayPicker({
  feeAssignmentId,
  lang,
  methods,
  dictionary,
  manualRailDictionary,
  onWalletSubmitted,
}: GatewayPickerProps) {
  const isRTL = lang === "ar"
  const router = useRouter()
  const [loading, setLoading] = useState<PaymentGateway | null>(null)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [walletGateway, setWalletGateway] = useState<WalletGateway | null>(null)
  const [walletSubmitted, setWalletSubmitted] = useState(false)

  const payable = payableGateways(methods)

  function handleClick(gateway: PaymentGateway) {
    setError(null)

    if (gateway === "bankak" || gateway === "cashi") {
      setWalletGateway(gateway)
      return
    }

    setLoading(gateway)
    startTransition(async () => {
      // Pass the clicked rail: the action re-resolves it server-side against
      // the school's own list, so this is intent, not a trusted value.
      const result = await createFeePaymentCheckout(
        feeAssignmentId,
        lang,
        gateway
      )
      if (result.success && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl
        return
      }
      setError(
        dictionary?.paymentFailed ??
          (isRTL
            ? "تعذر بدء الدفع. حاول مرة أخرى."
            : "Could not start payment. Please try again.")
      )
      setLoading(null)
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {dictionary?.chooseMethod ??
          (isRTL ? "اختر طريقة الدفع المناسبة:" : "Choose a payment method:")}
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {payable.map((method) => {
          const display = GATEWAY_DISPLAY[method]
          if (!display) return null
          const override = dictionary?.labels?.[method]
          return (
            <PaymentMethodCard
              key={method}
              iconName={display.icon}
              label={
                override?.label ?? (isRTL ? display.label.ar : display.label.en)
              }
              description={
                override?.description ??
                (isRTL ? display.description.ar : display.description.en)
              }
              isLoading={loading === method}
              disabled={loading !== null}
              onClick={() => handleClick(method)}
            />
          )
        })}
      </div>

      {walletGateway && (
        <ManualPaymentRail
          feeAssignmentId={feeAssignmentId}
          gateway={walletGateway}
          lang={lang}
          open={walletGateway !== null}
          onOpenChange={(open) => {
            if (open) return
            setWalletGateway(null)
            // Only once the payer has read the "submitted" confirmation and
            // closed the wallet dialog does the host surface get told — a
            // parent dialog that closes underneath the confirmation would
            // unmount it mid-read.
            if (walletSubmitted) {
              setWalletSubmitted(false)
              onWalletSubmitted?.()
            }
          }}
          onSubmitted={() => {
            setWalletSubmitted(true)
            router.refresh()
          }}
          dictionary={manualRailDictionary}
        />
      )}
    </div>
  )
}

interface FeePaymentMethodsProps extends GatewayPickerProps {
  remaining: number
}

/**
 * Parent-side gateway picker for fee payments, as a titled card. Renders one
 * card per available gateway (e.g. AE schools see Tap + Stripe — Tap surfaces
 * Apple Pay + mada + KNET via its hosted page; SD schools see Bankak + Cashi).
 *
 * The `methods` list MUST be resolved server-side via
 * {@link resolveAvailableMethods}(school.country, school.timezone, currency)
 * + {@link filterConfiguredManualRails} so a gateway never appears when its
 * API key is missing or the school has not published a wallet account.
 */
export function FeePaymentMethods({
  remaining,
  methods,
  dictionary,
  lang,
  ...rest
}: FeePaymentMethodsProps) {
  const isRTL = lang === "ar"
  if (remaining <= 0 || payableGateways(methods).length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {dictionary?.title ?? (isRTL ? "ادفع الرسوم" : "Pay Fees")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GatewayPicker
          methods={methods}
          dictionary={dictionary}
          lang={lang}
          {...rest}
        />
      </CardContent>
    </Card>
  )
}
