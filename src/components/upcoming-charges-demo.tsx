"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { UpcomingCharges } from "@/components/billingsdk/upcoming-charges"

export function UpcomingChargesDemo() {
  return (
    <UpcomingCharges
      title="Upcoming Charges"
      description="Your upcoming charges for the next billing period"
      nextBillingDate="November 1, 2025"
      totalAmount="$149.99"
      charges={[
        {
          id: "ch_001",
          description: "Enterprise Plan (Annual)",
          amount: "$119.99",
          date: "Nov 1, 2025",
          type: "recurring",
        },
        {
          id: "ch_002",
          description: "Additional Team Seats (5 seats)",
          amount: "$30.00",
          date: "Nov 1, 2025",
          type: "prorated",
        },
      ]}
    />
  )
}
