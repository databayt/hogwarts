"use client"

import { TrialExpiryCard } from "@/components/billingsdk/trial-expiry-card"

// Set trial end date 7 days from now for demo
const trialEndDate = new Date()
trialEndDate.setDate(trialEndDate.getDate() + 7)

const features = [
  "Full access to all premium features",
  "Unlimited students and teachers",
  "Advanced analytics dashboard",
  "Priority customer support",
]

export function TrialExpiryCardDemo() {
  return (
    <TrialExpiryCard
      trialEndDate={trialEndDate}
      onUpgrade={() => console.log("Upgrade clicked")}
      title="Trial Period"
      description="Your trial is ending soon. Upgrade to keep access to all features."
      upgradeButtonText="Upgrade Now"
      features={features}
    />
  )
}
