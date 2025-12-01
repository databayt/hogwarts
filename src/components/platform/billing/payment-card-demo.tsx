"use client";

import { PaymentCard } from "@/components/billingsdk/payment-card";

export function PaymentCardDemo() {
  return (
    <PaymentCard
      title="Complete your payment"
      description="Enter your card details to finalize your subscription"
      price="49"
      feature="Full Access"
      featuredescription="Access to all school management features"
      feature2="Priority Support"
      feature2description="Get help within 24 hours from our support team"
      finalText={[
        { text: "Secure payment" },
        { text: "256-bit encryption" },
        { text: "PCI compliant" },
      ]}
      onPay={async (data) => {
        console.log("Payment submitted:", data);
      }}
    />
  );
}
