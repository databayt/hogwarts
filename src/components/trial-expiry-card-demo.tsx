"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { TrialExpiryCard } from "@/components/billingsdk/trial-expiry-card"

export default function TrialExpiryCardDemo() {
  // Set trial to expire in 5 days
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 5)

  return (
    <div className="bg-background flex h-full min-h-[500px] w-full items-center justify-center rounded-lg border-2 p-6">
      <TrialExpiryCard
        trialEndDate={trialEndDate}
        onUpgrade={() => {
          console.log("Upgrade clicked")
        }}
        features={[
          "Unlimited API requests",
          "Advanced analytics dashboard",
          "Priority email support",
          "Custom domain integration",
        ]}
        className="w-full max-w-md"
      />
    </div>
  )
}
