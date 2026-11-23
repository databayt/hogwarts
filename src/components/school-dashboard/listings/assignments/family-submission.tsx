// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { formatAssignmentDate } from "./date"
import type { StudentSubmission } from "./submit-core"

/**
 * What a guardian sees where the student sees the hand-in card: whether the
 * child handed it in, when, and the mark and feedback once graded. Read-only.
 */
export function FamilySubmissionStatus({
  submission,
  labels,
  lang,
  totalPoints,
  timeZone,
}: {
  submission: StudentSubmission | null
  labels: Record<string, unknown>
  lang: string
  totalPoints: number
  /** The school's IANA zone (server component: no hook). */
  timeZone?: string
}) {
  const t = (k: string) => (labels?.[k] as string | undefined) ?? ""
  const graded =
    submission?.status === "GRADED" || submission?.status === "RETURNED"
  return (
    <div className="bg-muted space-y-1.5 rounded-xl p-4 text-sm">
      <p className="font-medium">{t("childSubmission")}</p>
      {!submission?.submittedAt ? (
        <p className="text-muted-foreground">{t("notHandedIn")}</p>
      ) : (
        <>
          <p className="text-muted-foreground">
            {submission.status === "LATE_SUBMITTED"
              ? t("submittedLate")
              : t("submitted")}
            {" · "}
            {formatAssignmentDate(submission.submittedAt, lang, "datetime", timeZone)}
          </p>
          {graded && submission.score != null ? (
            <p className="font-medium tabular-nums">
              {t("score")}: {submission.score}/{totalPoints}
            </p>
          ) : null}
          {graded && submission.feedback ? (
            <p className="text-muted-foreground break-words">
              <span className="font-medium">{t("feedback")}: </span>
              {submission.feedback}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
