"use client"

import { plans } from "@/lib/billingsdk-config"
import { SubscriptionManagement } from "@/components/billingsdk/subscription-management"

const demoCurrentPlan = {
  plan: plans[1], // Pro plan
  type: "monthly" as const,
  price: "$20",
  nextBillingDate: "January 15, 2025",
  paymentMethod: "Visa **** 4242",
  status: "active" as const,
}

export function SubscriptionManagementDemo() {
  return (
    <SubscriptionManagement
      currentPlan={demoCurrentPlan}
      updatePlan={{
        currentPlan: plans[1],
        plans,
        triggerText: "Change Plan",
        onPlanChange: (id) => console.log("Plan changed:", id),
      }}
      cancelSubscription={{
        title: "Cancel Subscription",
        description:
          "We're sorry to see you go. Your subscription will remain active until the end of the billing period.",
        plan: plans[1],
        onCancel: async () => console.log("Subscription cancelled"),
      }}
    />
  )
}
