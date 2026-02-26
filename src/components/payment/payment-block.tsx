"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

import { GATEWAY_DISPLAY } from "@/lib/payment/constants"
import type {
  BankDetails,
  CheckoutResult,
  PaymentContext,
  PaymentGateway,
} from "@/lib/payment/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { initiatePayment } from "./payment-block-actions"
import { PaymentConfirmation } from "./payment-confirmation"
import { PaymentMethodCard } from "./payment-method-card"
import { PaymentSummary } from "./payment-summary"

interface PaymentBlockProps {
  context: PaymentContext
  amount: number
  currency: string
  methods: PaymentGateway[]
  referenceId: string
  schoolId: string
  locale: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  bankDetails?: BankDetails
  cashInstructions?: string
  contextLabel?: string
  onSuccess?: (result: CheckoutResult) => void
  onError?: (error: string) => void
}

export function PaymentBlock({
  context,
  amount,
  currency,
  methods,
  referenceId,
  locale,
  successUrl,
  cancelUrl,
  customerEmail,
  contextLabel,
  onSuccess,
  onError,
}: PaymentBlockProps) {
  const isRTL = locale === "ar"
  const [loading, setLoading] = useState<PaymentGateway | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<CheckoutResult | null>(null)

  const handlePayment = async (gateway: PaymentGateway) => {
    setLoading(gateway)
    setError(null)

    try {
      const result = await initiatePayment({
        gateway,
        amount,
        currency,
        context,
        referenceId,
        successUrl,
        cancelUrl,
        customerEmail,
      })

      if (!result.success || !result.data) {
        const errMsg = result.error ?? (isRTL ? "فشل الدفع" : "Payment failed")
        setError(errMsg)
        onError?.(errMsg)
        return
      }

      const data = result.data

      // Redirect gateways: navigate to checkout URL
      if (
        (data.gateway === "stripe" || data.gateway === "tap") &&
        data.checkoutUrl
      ) {
        onSuccess?.(data)
        window.location.href = data.checkoutUrl
        return
      }

      // Offline gateways: show confirmation
      setConfirmation(data)
      onSuccess?.(data)
    } catch {
      const errMsg = isRTL
        ? "حدث خطأ أثناء معالجة الدفع"
        : "Error processing payment"
      setError(errMsg)
      onError?.(errMsg)
    } finally {
      setLoading(null)
    }
  }

  // Show confirmation for offline methods
  if (confirmation) {
    return (
      <div className="space-y-6">
        <PaymentConfirmation
          result={confirmation}
          locale={locale}
          amount={amount}
          currency={currency}
        />
        <div className="text-center">
          <Button variant="outline" onClick={() => setConfirmation(null)}>
            {isRTL ? "اختيار طريقة أخرى" : "Choose another method"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PaymentSummary
        amount={amount}
        currency={currency}
        locale={locale}
        contextLabel={contextLabel}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {isRTL ? "اختر طريقة الدفع:" : "Choose a payment method:"}
        </p>

        {methods.map((method) => {
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
              onClick={() => handlePayment(method)}
            />
          )
        })}
      </div>
    </div>
  )
}
