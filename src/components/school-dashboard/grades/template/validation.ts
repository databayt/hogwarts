// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

const scoreColumn = z.enum([
  "subject",
  "score",
  "maxScore",
  "percentage",
  "grade",
  "gpa",
  "credits",
  "comments",
])

export const reportCardTemplateSchema = z.object({
  header: z.object({
    showLogo: z.boolean(),
    showSchoolName: z.boolean(),
    title: z.string().max(120),
    showTerm: z.boolean(),
    showStudentName: z.boolean(),
    showStudentId: z.boolean(),
    showClass: z.boolean(),
  }),
  scores: z.object({
    columns: z.array(scoreColumn).min(1),
    showOverallRow: z.boolean(),
    showRank: z.boolean(),
  }),
  footer: z.object({
    showAttendance: z.boolean(),
    showGpa: z.boolean(),
    showTeacherComments: z.boolean(),
    showPrincipalComments: z.boolean(),
    showSignatures: z.boolean(),
    note: z.string().max(280),
  }),
})

export type ReportCardTemplateInput = z.infer<typeof reportCardTemplateSchema>
