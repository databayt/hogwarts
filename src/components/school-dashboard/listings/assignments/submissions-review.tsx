"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Paperclip } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"

import { gradeSubmission } from "./actions"
import type { SubmissionReview, SubmissionReviewRow } from "./submissions-core"

type Labels = Record<string, unknown> & {
  score?: string
  feedback?: string
  graded?: string
  submittedLate?: string
  handedIn?: string
  noSubmissions?: string
  saveGrade?: string
  gradeSaved?: string
  gradeFailed?: string
  attachments?: string
}

/**
 * The teacher's Submissions tab: each hand-in with its text and files, and a
 * score + feedback form on `gradeSubmission`. Grading used to exist only on
 * the phone; this tab was a placeholder.
 */
export function SubmissionsReview({
  review,
  totalPoints,
  labels,
  locale,
}: {
  review: SubmissionReview
  totalPoints: number
  labels: Labels
  locale: Locale
}) {
  const handed = (labels.handedIn ?? "{count} of {total} handed in")
    .replace("{count}", String(review.handedIn))
    .replace("{total}", String(review.rosterCount))

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{handed}</p>
      {review.rows.length === 0 ? (
        <p className="text-muted-foreground">
          {labels.noSubmissions ?? "No one has handed in yet."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {review.rows.map((row) => (
            <SubmissionRow
              key={row.id}
              row={row}
              totalPoints={totalPoints}
              labels={labels}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function SubmissionRow({
  row,
  totalPoints,
  labels,
  locale,
}: {
  row: SubmissionReviewRow
  totalPoints: number
  labels: Labels
  locale: Locale
}) {
  const router = useRouter()
  const [score, setScore] = useState(row.score?.toString() ?? "")
  const [feedback, setFeedback] = useState(row.feedback ?? "")
  const [pending, startTransition] = useTransition()
  const graded = row.status === "GRADED" || row.status === "RETURNED"
  const value = Number(score)
  const valid =
    score.trim() !== "" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= totalPoints

  function save() {
    if (!valid) return
    startTransition(async () => {
      const res = await gradeSubmission({
        submissionId: row.id,
        score: value,
        feedback: feedback.trim() || undefined,
      })
      if (res.success) {
        SuccessToast(labels.gradeSaved ?? "Grade saved")
        router.refresh()
      } else {
        ErrorToast(labels.gradeFailed ?? "Couldn't save the grade")
      }
    })
  }

  return (
    <li className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{row.studentName}</span>
        <span className="flex items-center gap-2">
          {row.status === "LATE_SUBMITTED" && (
            <Badge variant="destructive">
              {labels.submittedLate ?? "Late"}
            </Badge>
          )}
          {graded && (
            <Badge variant="secondary">{labels.graded ?? "Graded"}</Badge>
          )}
          {row.submittedAt && (
            <span className="text-muted-foreground text-xs">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(row.submittedAt))}
            </span>
          )}
        </span>
      </div>

      {row.content && (
        <p dir="auto" className="text-sm whitespace-pre-wrap">
          {row.content}
        </p>
      )}

      {row.attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {row.attachments.map((a, i) =>
            a.url ? (
              <li key={i}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:underline"
                >
                  <Paperclip className="h-3 w-3" aria-hidden />
                  <span dir="auto">{a.name}</span>
                </a>
              </li>
            ) : null
          )}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="text-muted-foreground text-xs">
            {labels.score ?? "Score"} / {totalPoints}
          </span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={totalPoints}
            step="0.5"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-24"
            aria-invalid={score !== "" && !valid}
          />
        </label>
        <label className="min-w-48 flex-1 space-y-1">
          <span className="text-muted-foreground text-xs">
            {labels.feedback ?? "Feedback"}
          </span>
          <Textarea
            rows={1}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            dir="auto"
          />
        </label>
        <Button onClick={save} disabled={!valid || pending} size="sm">
          {labels.saveGrade ?? "Save"}
        </Button>
      </div>
    </li>
  )
}
