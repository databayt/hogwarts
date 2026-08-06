// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Shared "Why Balqalam" deck rendered on every feature detail page —
// the battle-card rows from content/docs-en/competitors.mdx compressed to
// one-line headlines with a two-line body. Concrete, checkable claims only:
// no superlatives, sell time and money, name the region. The art is zenda's
// hand-drawn category line illustrations, not product screenshots.

import type { WhyCard } from "../../types"

export const WHY_HEADING = "Why schools choose Balqalam."

export const WHY_LINK = { label: "Compare plans", href: "/pricing" }

export const WHY_CARDS: WhyCard[] = [
  {
    id: "pricing",
    topic: "Pricing",
    headline: "Free to 100 students",
    body: "Then $1.50 per student a month.",
    image: "/imported/zenda/why/tuition.webp",
    href: "/pricing",
  },
  {
    id: "arabic",
    topic: "Arabic-First",
    headline: "Arabic first",
    body: "Every screen is right-to-left by design.",
    image: "/imported/zenda/why/counselling.webp",
    href: "/features",
  },
  {
    id: "onboarding",
    topic: "Onboarding",
    headline: "Live in 24 hours",
    body: "Pick a subdomain, import students, take applications.",
    image: "/imported/zenda/why/supplies.webp",
    href: "/pricing",
  },
  {
    id: "payments",
    topic: "Payment Rails",
    headline: "Every way parents pay",
    body: "Stripe, bankak, tap, cash and transfer — one ledger.",
    image: "/imported/zenda/why/canteen.webp",
    href: "/features/payment",
  },
  {
    id: "data",
    topic: "Your Data",
    headline: "Your data, portable",
    body: "Export every record to CSV or JSON. No exit fees.",
    image: "/imported/zenda/why/exams.webp",
    href: "/features/data-import-export",
  },
  {
    id: "time",
    topic: "Time Back",
    headline: "Hours back every week",
    body: "Attendance, fees and timetables in one system.",
    image: "/imported/zenda/why/activities.webp",
    href: "/features",
  },
  {
    id: "community",
    topic: "Community",
    headline: "Free study library",
    body: "Textbooks and mock exams, no account required.",
    image: "/imported/zenda/why/events.webp",
    href: "/community",
  },
]
