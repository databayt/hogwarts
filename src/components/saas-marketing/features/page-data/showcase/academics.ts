// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Academics showcase decks. Copy rules (from content/docs-en/competitors.mdx):
// concrete and checkable, sell the hours saved (Arbor's angle), no
// superlatives. Screenshots are real demo-school captures at 1280x1000.

import type { ShowcaseData } from "../../types"

const SHOT = "/features/shots"
const W = 1280
const H = 1000

export const academicsShowcase: Record<string, ShowcaseData> = {
  student: {
    eyebrow: "Student",
    heading: "One record per student,\nfrom first application to alumni",
    cards: [
      {
        tag: "DIRECTORY",
        icon: "Users",
        title: "The whole school in one searchable list",
        description:
          "Every student with grade, classroom, guardians and status — search, filter and act without opening a spreadsheet.",
        image: `${SHOT}/students.png`,
        width: W,
        height: H,
      },
      {
        tag: "360° PROFILE",
        icon: "Contact",
        title: "The full story before every meeting",
        description:
          "Subjects, activity and enrollment on a single page — the rich picture you want walking into any parent conversation.",
        image: `${SHOT}/students-profile.png`,
        width: W,
        height: H,
      },
      {
        tag: "GUARDIANS",
        icon: "UserPlus",
        title: "Guardians linked to every child",
        description:
          "Parents connect to their children once and see fees, results and attendance from their own portal — no photocopied circulars.",
        image: `${SHOT}/parents.png`,
        width: W,
        height: H,
      },
    ],
  },

  admission: {
    eyebrow: "Admission",
    heading: "Fill every seat\nwithout drowning in paper",
    cards: [
      {
        tag: "CAMPAIGNS",
        icon: "ClipboardList",
        title: "Open a campaign, set the seats",
        description:
          "Run each intake as a campaign with seats, dates and status — applications land in one pipeline the moment they arrive.",
        image: `${SHOT}/admission.png`,
        width: W,
        height: H,
      },
      {
        tag: "PIPELINE",
        icon: "CheckSquare",
        title: "Review applications in one queue",
        description:
          "Documents, guardians and academics attached to every application — approve, waitlist or request more with one click.",
        image: `${SHOT}/applications.png`,
        width: W,
        height: H,
      },
      {
        tag: "MERIT",
        icon: "Award",
        title: "Rank on merit, not on memory",
        description:
          "Score every applicant against the same criteria — selected, waitlisted and average score visible at a glance.",
        image: `${SHOT}/merit.png`,
        width: W,
        height: H,
      },
    ],
  },

  application: {
    eyebrow: "Application",
    heading: "Applying takes minutes,\nnot a morning in a queue",
    cards: [
      {
        tag: "SELF-SERVICE",
        icon: "PenLine",
        title: "Parents apply from their phone",
        description:
          "A five-step online application with document upload — start from scratch or auto-fill from existing documents. Applying is always free.",
        image: `${SHOT}/application.png`,
        width: W,
        height: H,
      },
      {
        tag: "ONE PIPELINE",
        icon: "ClipboardList",
        title: "Every application, instantly filed",
        description:
          "Submissions appear in the admission pipeline the second they arrive — numbered, tracked and answered within two weeks.",
        image: `${SHOT}/applications.png`,
        width: W,
        height: H,
      },
      {
        tag: "AI REVIEW",
        icon: "Sparkles",
        title: "Documents read themselves",
        description:
          "AI classifies uploaded documents and extracts the details, so your team verifies instead of retyping.",
        image: `${SHOT}/merit.png`,
        width: W,
        height: H,
      },
    ],
  },

  attendance: {
    eyebrow: "Attendance",
    heading: "Registers in seconds,\nfollow-ups on autopilot",
    cards: [
      {
        tag: "DAILY REGISTER",
        icon: "CalendarCheck",
        title: "Mark a class in seconds",
        description:
          "Tap through present, late, excused or absent — digital registers with no paper and no end-of-week data entry.",
        image: `${SHOT}/attendance.png`,
        width: W,
        height: H,
      },
      {
        tag: "BY PERIOD",
        icon: "Clock",
        title: "Registers that follow the timetable",
        description:
          "Every period knows its section, teacher and room, so attendance is taken where teaching happens — not reconstructed later.",
        image: `${SHOT}/timetable.png`,
        width: W,
        height: H,
      },
      {
        tag: "SIGNALS",
        icon: "AlertCircle",
        title: "Patterns surface while there's time",
        description:
          "Absence streaks and late patterns show up on the overview while a phone call home can still change the term.",
        image: `${SHOT}/dashboard.png`,
        width: W,
        height: H,
      },
    ],
  },

  exam: {
    eyebrow: "Exams",
    heading: "From blueprint to report card\nwithout the late nights",
    cards: [
      {
        tag: "GENERATE",
        icon: "Sparkles",
        title: "A print-ready paper in minutes",
        description:
          "Adopt a blueprint, prompt the AI, or build from scratch — three ways to a paper with marking scheme and answer key.",
        image: `${SHOT}/exams-generate.png`,
        width: W,
        height: H,
      },
      {
        tag: "QUESTION BANK",
        icon: "BookMarked",
        title: "Write a question once, reuse it forever",
        description:
          "Questions tagged by subject, difficulty and Bloom level — assemble balanced papers from your bank instead of retyping last year's.",
        image: `${SHOT}/qbank.png`,
        width: W,
        height: H,
      },
      {
        tag: "AUTO-MARKING",
        icon: "CheckCircle",
        title: "Marking that keeps up with teaching",
        description:
          "MCQs grade themselves, structured answers get AI assistance, and results flow straight into the gradebook.",
        image: `${SHOT}/exams.png`,
        width: W,
        height: H,
      },
      {
        tag: "REPORT CARDS",
        icon: "ScrollText",
        title: "A term's report cards in one run",
        description:
          "Generate and publish report cards for the whole school in one pass — bilingual PDFs parents actually read.",
        image: `${SHOT}/report-cards.png`,
        width: W,
        height: H,
      },
    ],
  },

  gradebook: {
    eyebrow: "Gradebook",
    heading: "Marks go in once.\nInsight comes out everywhere.",
    cards: [
      {
        tag: "RESULTS",
        icon: "TrendingUp",
        title: "Every result in its place",
        description:
          "Exam and assignment marks land in one gradebook per class and term — no parallel spreadsheets to reconcile.",
        image: `${SHOT}/exams.png`,
        width: W,
        height: H,
      },
      {
        tag: "REPORT CARDS",
        icon: "ScrollText",
        title: "Report cards without the mail-merge",
        description:
          "Pick a template, generate the term, publish to parents — transcripts and report cards from the same record.",
        image: `${SHOT}/report-cards.png`,
        width: W,
        height: H,
      },
    ],
  },

  timetable: {
    eyebrow: "Timetable",
    heading: "A week that builds itself,\nconflicts caught before Sunday",
    cards: [
      {
        tag: "WEEK GRID",
        icon: "Calendar",
        title: "The whole week at a glance",
        description:
          "Color-coded periods per section with subject and teacher in every cell — filter by class, teacher or room.",
        image: `${SHOT}/timetable.png`,
        width: W,
        height: H,
      },
      {
        tag: "ROOMS",
        icon: "DoorOpen",
        title: "Rooms that never double-book",
        description:
          "Capacity-aware allocation puts every section in a real room — clashes are flagged before they reach the corridor.",
        image: `${SHOT}/classrooms.png`,
        width: W,
        height: H,
      },
      {
        tag: "TEACHERS",
        icon: "Users",
        title: "Teacher loads you can defend",
        description:
          "Availability and constraints are respected while the generator fills the grid — see any teacher's week in one click.",
        image: `${SHOT}/teachers.png`,
        width: W,
        height: H,
      },
    ],
  },

  classroom: {
    eyebrow: "Classrooms",
    heading: "Rooms, sections and seats\nthat actually add up",
    cards: [
      {
        tag: "ROOMS",
        icon: "Building2",
        title: "Every room, capacity and facility",
        description:
          "A live register of physical rooms with capacity and equipment — allocation stops being a whiteboard argument.",
        image: `${SHOT}/classrooms.png`,
        width: W,
        height: H,
      },
      {
        tag: "SECTIONS",
        icon: "GraduationCap",
        title: "Sections tied to real subjects",
        description:
          "Grade sections map to the curriculum catalog, so timetables, exams and attendance all speak the same structure.",
        image: `${SHOT}/subjects.png`,
        width: W,
        height: H,
      },
      {
        tag: "SCHEDULE",
        icon: "Calendar",
        title: "See a room's whole week",
        description:
          "Pick any room and read its week — free periods become bookable, clashes become visible.",
        image: `${SHOT}/timetable.png`,
        width: W,
        height: H,
      },
    ],
  },
}
