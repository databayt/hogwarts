"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { plans } from "@/lib/billingsdk-config"
import { UpdatePlanCard } from "@/components/billingsdk/update-plan-card"

export function UpdatePlanCardDemo() {
  return (
    <UpdatePlanCard
      currentPlan={plans[1]} // Pro plan
      plans={plans}
      onPlanChange={(planId) => console.log("Plan selected:", planId)}
      title="Upgrade Your Plan"
    />
  )
}
