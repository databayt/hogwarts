// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import PaymentCancelContent from "@/components/stream/payment/cancel-content"

export const metadata = {
  title: "Payment Cancelled - Marshal LMS",
  description: "Your payment was cancelled",
}

export default function StreamPaymentCancelPage() {
  return <PaymentCancelContent />
}
