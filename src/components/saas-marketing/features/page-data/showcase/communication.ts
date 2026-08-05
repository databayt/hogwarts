// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ShowcaseData } from "../../types"

const SHOT = "/features/shots"
const W = 1280
const H = 1000

export const communicationShowcase: Record<string, ShowcaseData> = {
  announcement: {
    eyebrow: "Announcements",
    heading: "Say it once.\nEveryone actually hears it.",
    cards: [
      {
        tag: "PUBLISH",
        icon: "Megaphone",
        title: "Role-targeted announcements",
        description:
          "Publish to the whole school or a single class — drafts, templates and archives keep the noticeboard tidy.",
        image: `${SHOT}/announcements.png`,
        width: W,
        height: H,
      },
      {
        tag: "NOTIFY",
        icon: "MailPlus",
        title: "Notifications that follow up",
        description:
          "Reports ready, admissions submitted, fees due — the right people get pinged in-app and by email.",
        image: `${SHOT}/notifications.png`,
        width: W,
        height: H,
      },
      {
        tag: "REACH HOME",
        icon: "MessagesSquare",
        title: "Parents in the loop",
        description:
          "Guardians read announcements in their own portal, in their own language — no photocopies in schoolbags.",
        image: `${SHOT}/parents.png`,
        width: W,
        height: H,
      },
    ],
  },

  "parent-login": {
    eyebrow: "Parent Portal",
    heading: "Parents see everything that matters,\nwithout calling the office",
    cards: [
      {
        tag: "ONE LOGIN",
        icon: "Users",
        title: "One login per family",
        description:
          "Guardians link to each of their children — fees, attendance and results in one place, on any device.",
        image: `${SHOT}/parents.png`,
        width: W,
        height: H,
      },
      {
        tag: "CHILD 360",
        icon: "Contact",
        title: "The child's page, the parent's view",
        description:
          "Profile, subjects and progress visible from home — parent evenings start informed instead of surprised.",
        image: `${SHOT}/students-profile.png`,
        width: W,
        height: H,
      },
      {
        tag: "FEES",
        icon: "Wallet",
        title: "Bills without the paper chase",
        description:
          "Invoices and receipts live in the portal, payable on the rails parents actually use.",
        image: `${SHOT}/fees.png`,
        width: W,
        height: H,
      },
    ],
  },

  transcript: {
    eyebrow: "Transcripts",
    heading: "Records that leave school\nas cleanly as your students do",
    cards: [
      {
        tag: "REPORT CARDS",
        icon: "ScrollText",
        title: "A whole term published in one run",
        description:
          "Report cards generated for every enrolled student and published to parents — bilingual templates included.",
        image: `${SHOT}/report-cards.png`,
        width: W,
        height: H,
      },
      {
        tag: "HISTORY",
        icon: "FileText",
        title: "Every result preserved",
        description:
          "Exams and grades accumulate into a transcript that exports whenever a student needs it — no vault, no fees.",
        image: `${SHOT}/exams.png`,
        width: W,
        height: H,
      },
    ],
  },
}
