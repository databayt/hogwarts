// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ShowcaseData } from "../../types"

const SHOT = "/features/shots"
const W = 1280
const H = 1000

export const operationsShowcase: Record<string, ShowcaseData> = {
  faculty: {
    eyebrow: "Faculty",
    heading: "Your staff room,\nstructured",
    cards: [
      {
        tag: "TEACHERS",
        icon: "Users",
        title: "Every teacher, subject and load",
        description:
          "Profiles with assignments and availability — who teaches what is never a mystery again.",
        image: `${SHOT}/teachers.png`,
        width: W,
        height: H,
      },
      {
        tag: "TIMETABLE",
        icon: "Calendar",
        title: "Loads balanced automatically",
        description:
          "The generator respects availability and spreads periods fairly — any teacher's week is one click away.",
        image: `${SHOT}/timetable.png`,
        width: W,
        height: H,
      },
      {
        tag: "PAYROLL",
        icon: "Briefcase",
        title: "From contract to salary slip",
        description:
          "Salary structures per role flow into monthly runs — HR and finance share one record.",
        image: `${SHOT}/payroll.png`,
        width: W,
        height: H,
      },
    ],
  },

  transportation: {
    eyebrow: "Transport",
    heading: "Every bus, route and student\naccounted for",
    cards: [
      {
        tag: "FLEET",
        icon: "Bus",
        title: "Vehicles, drivers, routes — one view",
        description:
          "Fleet and driver records with route assignments per student, boarding tracked per trip, and expiring-document alerts before renewals become surprises.",
        image: `${SHOT}/transportation.png`,
        width: W,
        height: H,
      },
    ],
  },

  events: {
    eyebrow: "Events",
    heading: "The school year,\nscheduled and shared",
    cards: [
      {
        tag: "CALENDAR",
        icon: "CalendarDays",
        title: "Every event with its audience",
        description:
          "Trips, meetings, exams, vacations — typed, dated and targeted to the people they concern.",
        image: `${SHOT}/events.png`,
        width: W,
        height: H,
      },
      {
        tag: "ANNOUNCE",
        icon: "Megaphone",
        title: "From calendar to noticeboard",
        description:
          "Publishing an event notifies its audience in-app and by email — no separate circular to draft.",
        image: `${SHOT}/announcements.png`,
        width: W,
        height: H,
      },
    ],
  },

  documents: {
    eyebrow: "Documents",
    heading: "Paperwork that generates itself\nfrom live records",
    cards: [
      {
        tag: "RECORDS",
        icon: "FileText",
        title: "Report cards, transcripts and letters",
        description:
          "Generated from live records and published as PDFs — one template serves the whole cohort.",
        image: `${SHOT}/report-cards.png`,
        width: W,
        height: H,
      },
    ],
  },
}
