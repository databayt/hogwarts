"use client"

import { useState } from "react"

import type { PaymentCard as PaymentCardType } from "@/lib/billingsdk-config"
import { PaymentCard } from "@/components/billingsdk/payment-card"
import { PaymentMethodSelector } from "@/components/billingsdk/payment-method-selector"
import { PaymentSuccessDialog } from "@/components/billingsdk/payment-success-dialog"

type PaymentMethod = "cards" | "digital-wallets" | "upi" | "bnpl-services"

interface FormData {
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  cardholderName?: string
  email?: string
  phone?: string
  upiId?: string
  income?: string
}

interface PaymentSectionProps {
  savedCards: PaymentCardType[]
  showPaymentForm?: boolean
  paymentAmount?: string
  paymentTitle?: string
  paymentDescription?: string
  onPaymentMethodSelect?: (method: PaymentMethod, data: FormData) => void
  onPay?: (data: {
    cardNumber: string
    expiry: string
    cvc: string
  }) => Promise<void>
  onPaymentSuccess?: () => void
}

export function PaymentSection({
  savedCards,
  showPaymentForm = false,
  paymentAmount = "0",
  paymentTitle = "Complete Payment",
  paymentDescription = "Enter your payment details to complete the transaction",
  onPaymentMethodSelect,
  onPay,
  onPaymentSuccess,
}: PaymentSectionProps) {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  const handlePaymentComplete = async (data: {
    cardNumber: string
    expiry: string
    cvc: string
  }) => {
    if (onPay) {
      await onPay(data)
      setShowSuccessDialog(true)
      onPaymentSuccess?.()
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2>Payment Methods</h2>
        <p className="muted">
          Manage your payment methods and complete transactions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Method Selector */}
        <PaymentMethodSelector onProceed={onPaymentMethodSelect} />

        {/* Payment Card Form - shown when making a payment */}
        {showPaymentForm && (
          <PaymentCard
            title={paymentTitle}
            description={paymentDescription}
            price={paymentAmount}
            feature="Secure Payment"
            featuredescription="Your payment is processed securely with industry-standard encryption"
            feature2="Instant Processing"
            feature2description="Payments are processed immediately and receipts sent to your email"
            finalText={[
              { text: "Automated billing & invoices" },
              { text: "Priority support" },
              { text: "Exclusive member benefits" },
            ]}
            onPay={handlePaymentComplete}
          />
        )}
      </div>

      {/* Saved Cards Display */}
      {savedCards.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-4">Saved Payment Methods</h3>
          <div className="space-y-3">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-background rounded p-2">
                    <span className="text-sm font-semibold">{card.brand}</span>
                  </div>
                  <div>
                    <p className="font-mono text-sm">•••• {card.last4}</p>
                    <p className="text-muted-foreground text-xs">
                      Expires {card.expiry}
                    </p>
                  </div>
                </div>
                {card.primary && (
                  <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <PaymentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Payment Successful!"
        subtitle="Your payment has been processed successfully. A receipt has been sent to your email."
        price={paymentAmount}
        productName="School Subscription"
        proceedButtonText="Continue"
        backButtonText="View Receipt"
        onProceed={() => setShowSuccessDialog(false)}
        onBack={() => setShowSuccessDialog(false)}
      />
    </section>
  )
}
