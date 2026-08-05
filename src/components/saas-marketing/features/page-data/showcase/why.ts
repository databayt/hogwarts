// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Shared "Why Databayt" deck rendered on every feature detail page —
// the battle-card rows from content/docs-en/competitors.mdx compressed to
// apple-style value-prop cards. Concrete, checkable claims only: no
// superlatives, sell time and money, name the region.

import type { WhyCard } from "../../types"

export const WHY_HEADING = "Why Databayt is the best\nplace to run your school."

export const WHY_LINK = { label: "Compare plans", href: "/pricing" }

export const WHY_CARDS: WhyCard[] = [
  {
    id: "pricing",
    topic: "Pricing",
    headline: "Free for your first 200 students.",
    body: "A real free tier, not a 30-day trial — start on Hobby and upgrade only when your school outgrows it.",
    image: "/features/shots/why-pricing.png",
    href: "/pricing",
    objectPosition: "center 22%",
  },
  {
    id: "arabic",
    topic: "Arabic-First",
    headline: "Arabic isn't a translation. It's the default.",
    body: "Every screen is designed right-to-left first, English second — not an English product with RTL bolted on.",
    image: "/features/shots/why-arabic.png",
    href: "/features",
  },
  {
    id: "onboarding",
    topic: "Onboarding",
    headline: "Your school online in 24 hours.",
    body: "Pick a subdomain, import your students, and take applications the same week — no implementation team, no six-month rollout.",
    image: "/features/shots/why-onboarding.png",
    href: "/pricing",
  },
  {
    id: "payments",
    topic: "Payment Rails",
    headline: "Collect fees the way parents actually pay.",
    body: "Stripe, bankak, tap, cash, and bank transfer — every payment reconciles into the same ledger automatically.",
    image: "/features/shots/why-payments.png",
    href: "/features/payment",
  },
  {
    id: "data",
    topic: "Your Data",
    headline: "Leave anytime. Take everything.",
    body: "Export every record to CSV or JSON whenever you want. No exit fees, no proprietary formats, no hostage data.",
    image: "/features/shots/why-data.png",
    href: "/features/data-import-export",
  },
  {
    id: "time",
    topic: "Time Back",
    headline: "Reclaim hours every week.",
    body: "Attendance, fees, timetables, and messages in one system — not five spreadsheets and a WhatsApp group.",
    image: "/features/shots/why-time.png",
    href: "/features",
  },
  {
    id: "community",
    topic: "Community",
    headline: "Textbooks, mock exams and lessons — free for all.",
    body: "A public resource hub any school can use, no account required — and a direct line to the team that builds the platform.",
    image: "/features/shots/why-support.png",
    href: "/community",
    objectPosition: "center bottom",
  },
]
