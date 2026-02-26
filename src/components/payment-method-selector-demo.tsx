// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PaymentMethodSelector } from "@/components/billingsdk/payment-method-selector"

export function PaymentMethodSelectorDemo() {
  return (
    <div className="bg-background-secondary flex h-full min-h-[500px] w-full flex-col gap-6 overflow-hidden rounded-lg border-2">
      <div className="flex flex-1 flex-col justify-center text-center">
        <PaymentMethodSelector
          onProceed={(method, data) => {
            console.log("Selected method:", method)
            console.log("Form data:", data)
          }}
        />
      </div>
    </div>
  )
}
