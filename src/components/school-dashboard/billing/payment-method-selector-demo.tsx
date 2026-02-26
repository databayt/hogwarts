"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { PaymentMethodSelector } from "@/components/billingsdk/payment-method-selector"

export function PaymentMethodSelectorDemo() {
  return (
    <PaymentMethodSelector
      onProceed={(method, data) =>
        console.log("Payment method selected:", method, data)
      }
    />
  )
}
