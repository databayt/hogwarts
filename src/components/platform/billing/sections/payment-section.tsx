"use client";

import { useState } from "react";
import { PaymentMethodSelector } from "@/components/billingsdk/payment-method-selector";
import { PaymentCard } from "@/components/billingsdk/payment-card";
import { PaymentSuccessDialog } from "@/components/billingsdk/payment-success-dialog";
import type { PaymentCard as PaymentCardType } from "@/lib/billingsdk-config";

type PaymentMethod = "cards" | "digital-wallets" | "upi" | "bnpl-services";

interface FormData {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
  email?: string;
  phone?: string;
  upiId?: string;
  income?: string;
}

interface PaymentSectionProps {
  savedCards: PaymentCardType[];
  showPaymentForm?: boolean;
  paymentAmount?: string;
  paymentTitle?: string;
  paymentDescription?: string;
  onPaymentMethodSelect?: (method: PaymentMethod, data: FormData) => void;
  onPay?: (data: { cardNumber: string; expiry: string; cvc: string }) => Promise<void>;
  onPaymentSuccess?: () => void;
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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handlePaymentComplete = async (data: { cardNumber: string; expiry: string; cvc: string }) => {
    if (onPay) {
      await onPay(data);
      setShowSuccessDialog(true);
      onPaymentSuccess?.();
    }
  };

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
        <PaymentMethodSelector
          onProceed={onPaymentMethodSelect}
        />

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
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded bg-background p-2">
                    <span className="text-sm font-semibold">{card.brand}</span>
                  </div>
                  <div>
                    <p className="font-mono text-sm">•••• {card.last4}</p>
                    <p className="text-xs text-muted-foreground">Expires {card.expiry}</p>
                  </div>
                </div>
                {card.primary && (
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
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
  );
}
