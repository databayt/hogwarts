// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Report-card / grade template config — stored as JSON on
 * SchoolGradingConfig.reportCardTemplate. Authored via the compact builder
 * where each step edits exactly ONE band (header / scores grid / footer),
 * rendered as a small table-grid, never a full A4 page.
 */

export type ScoreColumn =
  | "subject"
  | "score"
  | "maxScore"
  | "percentage"
  | "grade"
  | "gpa"
  | "credits"
  | "comments"

export interface ReportCardHeaderBand {
  showLogo: boolean
  showSchoolName: boolean
  title: string
  showTerm: boolean
  showStudentName: boolean
  showStudentId: boolean
  showClass: boolean
}

export interface ReportCardScoresBand {
  columns: ScoreColumn[]
  showOverallRow: boolean
  showRank: boolean
}

export interface ReportCardFooterBand {
  showAttendance: boolean
  showGpa: boolean
  showTeacherComments: boolean
  showPrincipalComments: boolean
  showSignatures: boolean
  note: string
}

export interface ReportCardTemplate {
  header: ReportCardHeaderBand
  scores: ReportCardScoresBand
  footer: ReportCardFooterBand
}

export const ALL_SCORE_COLUMNS: ScoreColumn[] = [
  "subject",
  "score",
  "maxScore",
  "percentage",
  "grade",
  "gpa",
  "credits",
  "comments",
]

export const DEFAULT_REPORT_CARD_TEMPLATE: ReportCardTemplate = {
  header: {
    showLogo: true,
    showSchoolName: true,
    title: "Report Card",
    showTerm: true,
    showStudentName: true,
    showStudentId: true,
    showClass: true,
  },
  scores: {
    columns: ["subject", "score", "maxScore", "percentage", "grade"],
    showOverallRow: true,
    showRank: false,
  },
  footer: {
    showAttendance: true,
    showGpa: true,
    showTeacherComments: true,
    showPrincipalComments: false,
    showSignatures: true,
    note: "",
  },
}
