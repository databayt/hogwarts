"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { CheckCircle2, Clock, Send, WifiOff } from "lucide-react"
import { toast } from "sonner"

import { enqueue } from "@/lib/offline/outbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

import { submitAssignment } from "./submit-actions"
import type { OwnSubmission } from "./submit-core"

interface SubmissionCardProps {
  assignmentId: string
  existing: OwnSubmission | null
  /** The `school.assignments.detail` subtree — nested groups are skipped. */
  labels?: Record<string, unknown>
  locale?: string
}

/**
 * The student's side of an assignment: write, hand in, see the mark. Online
 * it calls the action; with no connection it queues the text in the outbox
 * and the sync route hands it in later — status (on time / late) is decided
 * by when the student pressed submit, not when the network came back.
 */
export function StudentSubmissionCard({
  assignmentId,
  existing,
  labels,
  locale = "en",
}: SubmissionCardProps) {
  const t = (k: string, fallback: string) => {
    const v = labels?.[k]
    return typeof v === "string" ? v : fallback
  }
  const [content, setContent] = useState(existing?.content ?? "")
  const [state, setState] = useState<OwnSubmission | null>(existing)
  const [queued, setQueued] = useState(false)
  const [pending, startTransition] = useTransition()

  const graded = state?.status === "GRADED" || state?.status === "RETURNED"

  const handleSubmit = () => {
    const text = content.trim()
    if (!text) return

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      void enqueue({
        kind: "assignment",
        coalesceKey: `assignment:${assignmentId}`,
        payload: { assignmentId, content: text },
      }).then(() => setQueued(true))
      return
    }

    startTransition(async () => {
      const res = await submitAssignment({ assignmentId, content: text })
      if (!res.success || !res.data) {
        toast.error(t("submitFailed", "Couldn't submit — please try again"))
        return
      }
      setState({
        status: res.data.status,
        submittedAt: new Date(),
        content: text,
        score: null,
        feedback: null,
      })
      toast.success(t("submitted", "Submitted"))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 rtl:-scale-x-100" aria-hidden />
          {t("yourSubmission", "Your submission")}
          {state?.submittedAt && (
            <Badge
              variant={
                state.status === "LATE_SUBMITTED" ? "destructive" : "secondary"
              }
              className="ms-auto"
            >
              {state.status === "LATE_SUBMITTED"
                ? t("submittedLate", "Submitted late")
                : graded
                  ? t("graded", "Graded")
                  : t("submitted", "Submitted")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {state?.submittedAt && (
          <p className="text-muted-foreground flex items-center gap-1 text-sm">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {t("submittedAt", "Submitted")}{" "}
            {new Date(state.submittedAt).toLocaleString(locale)}
          </p>
        )}

        {graded ? (
          <div className="space-y-2">
            <p className="whitespace-pre-wrap">{state?.content}</p>
            {state?.score !== null && state?.score !== undefined && (
              <p className="font-medium">
                {t("score", "Score")}: {state.score}
              </p>
            )}
            {state?.feedback && (
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">
                  {t("feedback", "Feedback")}:{" "}
                </span>
                {state.feedback}
              </p>
            )}
          </div>
        ) : queued ? (
          <p className="flex items-center gap-2 text-sm" role="status">
            <WifiOff className="h-4 w-4" aria-hidden />
            {t(
              "savedOffline",
              "Saved on this device — it will be handed in when you're back online."
            )}
          </p>
        ) : (
          <>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t(
                "submissionPlaceholder",
                "Write your answer here…"
              )}
              rows={6}
              maxLength={20000}
              disabled={pending}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={pending || !content.trim()}
              >
                {state?.submittedAt
                  ? t("resubmit", "Resubmit")
                  : t("submit", "Submit")}
              </Button>
              {state?.submittedAt && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {t(
                    "resubmitHint",
                    "Resubmitting replaces what you handed in"
                  )}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
