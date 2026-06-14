// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getReportCardTemplate } from "./actions"
import { ReportCardTemplateBuilder, type BuilderLabels } from "./builder"
import { DEFAULT_REPORT_CARD_TEMPLATE } from "./types"

/**
 * Build the builder's label set from the dictionary with English fallbacks.
 * Accessed loosely so a missing `gradeTemplate` namespace never breaks the
 * build (keys are added to school-{en,ar}.json as a follow-up).
 */
function buildLabels(dictionary: Dictionary): BuilderLabels {
  const gt = ((dictionary?.school as Record<string, any>)?.gradeTemplate ??
    {}) as Record<string, any>
  return {
    steps: {
      header: gt.steps?.header ?? "Header",
      scores: gt.steps?.scores ?? "Scores",
      footer: gt.steps?.footer ?? "Footer",
      preview: gt.steps?.preview ?? "Preview",
    },
    header: {
      title: gt.header?.title ?? "Header band",
      titleField: gt.header?.titleField ?? "Title",
      logo: gt.header?.logo ?? "School logo",
      schoolName: gt.header?.schoolName ?? "School name",
      term: gt.header?.term ?? "Term",
      studentName: gt.header?.studentName ?? "Student name",
      studentId: gt.header?.studentId ?? "Student ID",
      studentClass: gt.header?.studentClass ?? "Class",
    },
    scores: {
      title: gt.scores?.title ?? "Scores grid",
      columns: gt.scores?.columns ?? "Columns",
      overallRow: gt.scores?.overallRow ?? "Overall row",
      rank: gt.scores?.rank ?? "Class rank",
      columnLabels: {
        subject: gt.scores?.columnLabels?.subject ?? "Subject",
        score: gt.scores?.columnLabels?.score ?? "Score",
        maxScore: gt.scores?.columnLabels?.maxScore ?? "Max",
        percentage: gt.scores?.columnLabels?.percentage ?? "Percentage",
        grade: gt.scores?.columnLabels?.grade ?? "Grade",
        gpa: gt.scores?.columnLabels?.gpa ?? "GPA",
        credits: gt.scores?.columnLabels?.credits ?? "Credits",
        comments: gt.scores?.columnLabels?.comments ?? "Comments",
      },
    },
    footer: {
      title: gt.footer?.title ?? "Footer band",
      attendance: gt.footer?.attendance ?? "Attendance summary",
      gpa: gt.footer?.gpa ?? "Overall GPA",
      teacherComments: gt.footer?.teacherComments ?? "Teacher comments",
      principalComments: gt.footer?.principalComments ?? "Principal comments",
      signatures: gt.footer?.signatures ?? "Signature lines",
      note: gt.footer?.note ?? "Footer note",
    },
    preview: { title: gt.preview?.title ?? "Preview" },
    back: gt.back ?? "Back",
    next: gt.next ?? "Next",
    save: gt.save ?? "Save template",
    saving: gt.saving ?? "Saving…",
    saved: gt.saved ?? "Template saved",
    saveError: gt.saveError ?? "Failed to save template",
  }
}

export async function ReportCardTemplateContent({
  dictionary,
}: {
  dictionary: Dictionary
}) {
  const result = await getReportCardTemplate()
  const initial =
    result.success && result.data ? result.data : DEFAULT_REPORT_CARD_TEMPLATE
  const labels = buildLabels(dictionary)
  const gt = (dictionary?.school as Record<string, any>)?.gradeTemplate ?? {}

  return (
    <div className="space-y-4 py-4">
      <div>
        <h2 className="font-semibold">{gt.pageTitle ?? "Grade template"}</h2>
        <p className="text-muted-foreground text-sm">
          {gt.pageDescription ??
            "Design the printable report card — one band per step."}
        </p>
      </div>
      <ReportCardTemplateBuilder initial={initial} labels={labels} />
    </div>
  )
}
