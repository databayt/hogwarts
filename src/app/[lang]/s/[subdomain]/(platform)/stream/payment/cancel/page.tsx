import PaymentCancelContent from "@/components/stream/payment/cancel-content"

export const metadata = {
  title: "Payment Cancelled - Marshal LMS",
  description: "Your payment was cancelled",
}

export default function StreamPaymentCancelPage() {
  return <PaymentCancelContent />
}
