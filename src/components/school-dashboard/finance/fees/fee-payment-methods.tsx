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
}: FeePaymentMethodsProps) {
  const isRTL = lang === "ar"
  const [loading, setLoading] = useState<PaymentGateway | null>(null)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Only render online methods (Tap / Stripe / Bankak) — offline methods
  // are recorded by the admin via the manual /payments/new flow.
  const onlineMethods = methods.filter(
    (m) => m === "tap" || m === "stripe" || m === "bankak"
  )

  if (remaining <= 0 || onlineMethods.length === 0) return null

  function handleClick(gateway: PaymentGateway) {
    setLoading(gateway)
    setError(null)
    startTransition(async () => {
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
          {onlineMethods.map((method) => {
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
    </Card>
  )
}
