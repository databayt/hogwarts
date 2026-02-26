"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { formatCurrency } from "@/lib/payment/currency"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PaymentSummaryProps {
  amount: number
  currency: string
  locale: string
  referenceId?: string
  contextLabel?: string
}

export function PaymentSummary({
  amount,
  currency,
  locale,
  referenceId,
  contextLabel,
}: PaymentSummaryProps) {
  const isRTL = locale === "ar"
  const formattedAmount = formatCurrency(amount, currency, isRTL ? "ar" : "en")

  return (
    <Card className="mb-6">
      <CardHeader className="text-center">
        {contextLabel && <CardDescription>{contextLabel}</CardDescription>}
        <CardTitle className="text-3xl">{formattedAmount}</CardTitle>
        {referenceId && (
          <CardDescription>
            {isRTL ? "المرجع: " : "Ref: "}
            <span className="font-mono">{referenceId}</span>
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  )
}
