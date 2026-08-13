// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ShowcaseData } from "../../types"

const SHOT = "/features/shots"
const W = 1280
const H = 1000

export const learningShowcase: Record<string, ShowcaseData> = {
  "e-learning": {
    eyebrow: "Stream",
    heading: "A full LMS living inside\nyour school system",
    cards: [
      {
        tag: "COURSES",
        icon: "MonitorPlay",
        title: "Courses built from your curriculum",
        description:
          "Structured courses per grade and subject — lessons, materials and progress aligned to the same catalog as your timetable.",
        image: `${SHOT}/lumos-courses.png`,
        width: W,
        height: H,
      },
      {
        tag: "LEARN ANYWHERE",
        icon: "Video",
        title: "Lessons that travel",
        description:
          "Students continue at home on any device — low-bandwidth friendly for schools where connectivity is a daily variable.",
        image: `${SHOT}/lumos.png`,
        width: W,
        height: H,
      },
      {
        tag: "CURRICULUM",
        icon: "BookOpen",
        title: "One catalog behind everything",
        description:
          "Subjects and lessons come from the same curriculum powering exams and timetables — no duplicate content trees.",
        image: `${SHOT}/subjects.png`,
        width: W,
        height: H,
      },
    ],
  },

  qbank: {
    eyebrow: "Question Bank",
    heading: "Write once,\nexamine forever",
    cards: [
      {
        tag: "BANK",
        icon: "BookMarked",
        title: "Tagged, searchable, reusable",
        description:
          "Questions carry subject, grade, difficulty and Bloom level — the bank grows every term and never walks out with a teacher.",
        image: `${SHOT}/qbank.png`,
        width: W,
        height: H,
      },
      {
        tag: "GENERATE",
        icon: "Sparkles",
        title: "From bank to paper in minutes",
        description:
          "Blueprints draw balanced papers from the bank — difficulty mix enforced, answer keys included.",
        image: `${SHOT}/exams-generate.png`,
        width: W,
        height: H,
      },
      {
        tag: "AI ASSIST",
        icon: "PenTool",
        title: "AI drafts, teachers approve",
        description:
          "Generate candidate questions from a topic and keep only what you'd defend in a staff room.",
        image: `${SHOT}/exams.png`,
        width: W,
        height: H,
      },
    ],
  },

  library: {
    eyebrow: "Library",
    heading: "A catalog students\nactually browse",
    cards: [
      {
        tag: "CATALOG",
        icon: "Library",
        title: "Browse like a bookshop, borrow like a library",
        description:
          "Cover-first browsing with search and categories — circulation tracked per student, without the index cards.",
        image: `${SHOT}/library.png`,
        width: W,
        height: H,
      },
    ],
  },
}
