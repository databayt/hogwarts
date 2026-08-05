// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ShowcaseData } from "../../types"

const SHOT = "/features/shots"
const W = 1280
const H = 1000

export const insightsShowcase: Record<string, ShowcaseData> = {
  dashboard: {
    eyebrow: "Dashboard",
    heading: "Walk in, glance,\nknow where the school stands",
    cards: [
      {
        tag: "OVERVIEW",
        icon: "LayoutDashboard",
        title: "The morning briefing, automated",
        description:
          "Announcements, events, messages and system health on one screen — the day starts oriented, not buried in tabs.",
        image: `${SHOT}/dashboard.png`,
        width: W,
        height: H,
      },
      {
        tag: "FINANCE",
        icon: "BarChart3",
        title: "Money charted monthly",
        description:
          "Revenue, expenses and unpaid invoices live on the dashboard — not discovered at month-end.",
        image: `${SHOT}/finance.png`,
        width: W,
        height: H,
      },
      {
        tag: "ARABIC-FIRST",
        icon: "Languages",
        title: "The same screen, right-to-left",
        description:
          "Every view is designed Arabic-first and mirrors perfectly — not an English product with RTL bolted on.",
        image: `${SHOT}/why-arabic.png`,
        width: W,
        height: H,
      },
    ],
  },

  reporting: {
    eyebrow: "Reports",
    heading: "Answers on screen,\nnot in a filing cabinet",
    cards: [
      {
        tag: "FINANCE",
        icon: "LineChart",
        title: "Financial reports, always current",
        description:
          "Revenue, expenses and outstanding balances charted from the live ledger — export when the board asks.",
        image: `${SHOT}/finance.png`,
        width: W,
        height: H,
      },
      {
        tag: "ACADEMIC",
        icon: "ScrollText",
        title: "Cohort results in one run",
        description:
          "Report cards and progress summaries generated per term, per class, per student — published, not printed.",
        image: `${SHOT}/report-cards.png`,
        width: W,
        height: H,
      },
      {
        tag: "ADMISSION",
        icon: "Award",
        title: "Intake analytics per campaign",
        description:
          "Ranked applicants, seat fill and average scores — know how the intake is going while it's still open.",
        image: `${SHOT}/merit.png`,
        width: W,
        height: H,
      },
    ],
  },

  "ai-powered": {
    eyebrow: "AI",
    heading: "AI where it saves hours,\nnot where it shows off",
    cards: [
      {
        tag: "EXAM GENERATION",
        icon: "Sparkles",
        title: "Papers drafted from a prompt",
        description:
          "Blueprint or topic in, balanced paper out — teachers approve, the AI does the typing.",
        image: `${SHOT}/exams-generate.png`,
        width: W,
        height: H,
      },
      {
        tag: "AUTO-MARKING",
        icon: "CheckCircle",
        title: "Marking assistance built in",
        description:
          "MCQs grade themselves and structured answers get AI help — teachers stay the final word.",
        image: `${SHOT}/exams.png`,
        width: W,
        height: H,
      },
      {
        tag: "ADMISSION",
        icon: "Award",
        title: "Applications scored consistently",
        description:
          "Documents classified and applicants ranked by the same criteria, every time — merit without the marathon.",
        image: `${SHOT}/merit.png`,
        width: W,
        height: H,
      },
    ],
  },
}
