"use client"

import { UpcomingCharges } from "@/components/billingsdk/upcoming-charges"

const demoCharges = [
  {
    id: "1",
    description: "Pro Plan (Monthly)",
    amount: "$20.00",
    date: "Jan 15, 2025",
    type: "recurring" as const,
  },
  {
    id: "2",
    description: "Additional Storage (2GB)",
    amount: "$5.00",
    date: "Jan 15, 2025",
    type: "one-time" as const,
  },
  {
    id: "3",
    description: "Plan Upgrade Credit",
    amount: "-$3.50",
    date: "Jan 15, 2025",
    type: "prorated" as const,
  },
]

export function UpcomingChargesDemo() {
  return (
    <UpcomingCharges
      title="Upcoming Charges"
      description="Preview of your next billing cycle"
      nextBillingDate="January 15, 2025"
      totalAmount="$21.50"
      charges={demoCharges}
    />
  )
}
