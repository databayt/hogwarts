"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

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

interface FeePaymentMethodsProps {
  feeAssignmentId: string
  lang: Locale
  remaining: number
  methods: PaymentGateway[]
  dictionary?: {
    title?: string
    chooseMethod?: string
    redirecting?: string
    paymentFailed?: string
  }
  /** Copy for the Bankak/Cashi transfer dialog. */
  manualRailDictionary?: ManualRailDictionary
}

/**
 * Parent-side gateway picker for fee payments. Replaces the legacy single
 * "Pay Online" button. Renders one card per available gateway (e.g. AE
 * schools see Tap + Stripe — Tap surfaces Apple Pay + mada + KNET via its
 * hosted page). Clicking a card POSTs to {@link createFeePaymentCheckout}
 * with the chosen gateway and redirects to the provider's checkout URL.
 *
 * The `methods` list MUST be resolved server-side via
 * {@link resolveAvailableMethods}(school.country, school.timezone, currency)
 * so a gateway never appears when its API key is missing.
 */
export function FeePaymentMethods({
  feeAssignmentId,
  lang,
  remaining,
  methods,
  dictionary,
  manualRailDictionary,
}: FeePaymentMethodsProps) {
  const isRTL = lang === "ar"
  const [loading, setLoading] = useState<PaymentGateway | null>(null)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [walletGateway, setWalletGateway] = useState<WalletGateway | null>(null)

  // Two kinds of rail, two interactions:
  //  - redirect rails (Tap/Stripe) hand off to a hosted checkout page;
  //  - wallet rails (Bankak/Cashi) have no merchant API, so they open a dialog
  //    showing the school's account and take a transfer reference + receipt.
  // Bankak used to sit in the redirect list, which was doubly wrong: it has no
  // checkout URL, and its provider was permanently unconfigured — so this
  // filter resolved to [] and a Sudan school's parents saw no way to pay at all.
  const redirectMethods = methods.filter((m) => m === "tap" || m === "stripe")
  const walletMethods = methods.filter(
    (m): m is WalletGateway => m === "bankak" || m === "cashi"
  )
  const payableMethods = [...redirectMethods, ...walletMethods]

  // cash / bank_transfer stay admin-recorded via /payments/new, as before.
  if (remaining <= 0 || payableMethods.length === 0) return null

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
    <Card>
      <CardHeader>
        <CardTitle>
          {dictionary?.title ?? (isRTL ? "ادفع الرسوم" : "Pay Fees")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
          {payableMethods.map((method) => {
            const display = GATEWAY_DISPLAY[method]
            if (!display) return null
            return (
              <PaymentMethodCard
                key={method}
                iconName={display.icon}
                label={isRTL ? display.label.ar : display.label.en}
                description={
                  isRTL ? display.description.ar : display.description.en
                }
                isLoading={loading === method}
                disabled={loading !== null}
                onClick={() => handleClick(method)}
              />
            )
          })}
        </div>
      </CardContent>

      {walletGateway && (
        <ManualPaymentRail
          feeAssignmentId={feeAssignmentId}
          gateway={walletGateway}
          lang={lang}
          open={walletGateway !== null}
          onOpenChange={(open) => {
            if (!open) setWalletGateway(null)
          }}
          dictionary={manualRailDictionary}
        />
      )}
    </Card>
  )
}
