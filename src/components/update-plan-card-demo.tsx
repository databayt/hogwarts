"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { plans } from "@/lib/billingsdk-config"
import { UpdatePlanCard } from "@/components/billingsdk/update-plan-card"

export function UpdatePlanCardDemo() {
  return (
    <main className="flex w-full flex-1 flex-col justify-center text-center">
      <UpdatePlanCard
        currentPlan={plans[0]}
        plans={plans}
        onPlanChange={(planId) => {
          console.log("Upgrade plan to", planId)
        }}
      />
    </main>
  )
}
