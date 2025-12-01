"use client";

import { PaymentMethodSelector } from "@/components/billingsdk/payment-method-selector";

export function PaymentMethodSelectorDemo() {
  return (
    <PaymentMethodSelector
      onProceed={(method, data) =>
        console.log("Payment method selected:", method, data)
      }
    />
  );
}
