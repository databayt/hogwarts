"use client"

import { useState } from "react"

import { UsageBasedPricing } from "@/components/billingsdk/usage-based-pricing"

export function UsageBasedPricingDemo() {
  const [credits, setCredits] = useState(4000)

  return (
    <UsageBasedPricing
      min={0}
      max={10000}
      value={credits}
      onChange={setCredits}
      onChangeEnd={(val) => console.log("Credits set to:", val)}
      currency="$"
      basePrice={20}
      includedCredits={1000}
      title="Additional Credits"
      subtitle="Add more API credits to your plan as needed."
    />
  )
}
