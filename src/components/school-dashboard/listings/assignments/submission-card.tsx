"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState, useTransition } from "react"
import { CheckCircle2, Clock, Paperclip, Send, WifiOff, X } from "lucide-react"
import { toast } from "sonner"

import { enqueue } from "@/lib/offline/outbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { SuccessToast } from "@/components/atom/toast"

import { presignSubmissionUpload, submitAssignment } from "./submit-actions"
import type { OwnSubmission } from "./submit-core"

interface SubmissionCardProps {
  assignmentId: string
  existing: OwnSubmission | null
  /** The `school.assignments.detail` subtree — nested groups are skipped. */
  labels?: Record<string, unknown>
  locale?: string
  /** Surface override — /my-assignments draws it as the kit's grey card. */
  className?: string
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
  className,
}: SubmissionCardProps) {
  const t = (k: string, fallback: string) => {
    const v = labels?.[k]
    return typeof v === "string" ? v : fallback
  }
  const [content, setContent] = useState(existing?.content ?? "")
  // Uploaded file URLs for this hand-in. The server always took attachments;
  // the card only took typed text, and an online school hands in photos of
  // work.
  const [files, setFiles] = useState<string[]>(existing?.attachments ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<OwnSubmission | null>(existing)
  const [queued, setQueued] = useState(false)
  const [pending, startTransition] = useTransition()

  const graded = state?.status === "GRADED" || state?.status === "RETURNED"

  // Stored keys are `<timestamp>_<name>` (presignUpload); show the name.
  const fileName = (url: string) =>
    decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "file").replace(
      /^\d{10,}[_-]/,
      ""
    )

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(list).slice(0, 10 - files.length)) {
        const res = await presignSubmissionUpload({
          assignmentId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        })
        if (!res.success) {
          toast.error(
            t("uploadFailed", "Couldn't upload {name}").replace(
              "{name}",
              file.name
            )
          )
          continue
        }
        const put = await fetch(res.data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })
        if (!put.ok) {
          toast.error(
            t("uploadFailed", "Couldn't upload {name}").replace(
              "{name}",
              file.name
            )
          )
          continue
        }
        setFiles((prev) => [...prev, res.data.fileUrl])
      }
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const handleSubmit = () => {
    const text = content.trim()
    if (!text && files.length === 0) return

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      // The outbox carries text only — files need the connection to upload.
      if (files.length > 0) {
        toast.error(t("offlineFiles", "Files need a connection to hand in"))
        return
      }
      void enqueue({
        kind: "assignment",
        coalesceKey: `assignment:${assignmentId}`,
        payload: { assignmentId, content: text },
      }).then(() => setQueued(true))
      return
    }

    startTransition(async () => {
      const res = await submitAssignment({
        assignmentId,
        content: text,
        attachments: files,
      })
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
        attachments: files,
      })
      SuccessToast(t("submitted", "Submitted"))
    })
  }

  return (
    <Card className={className}>
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
            <p dir="auto" className="whitespace-pre-wrap">
              {state?.content}
            </p>
            {(state?.attachments?.length ?? 0) > 0 && (
              <ul className="flex flex-wrap gap-2">
                {state!.attachments!.map((url) => (
                  <li
                    key={url}
                    className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                  >
                    <Paperclip className="h-3 w-3" aria-hidden />
                    <span dir="auto">{fileName(url)}</span>
                  </li>
                ))}
              </ul>
            )}
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
            {files.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {files.map((url) => (
                  <li
                    key={url}
                    className="bg-muted inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                  >
                    <Paperclip className="h-3 w-3" aria-hidden />
                    <span dir="auto">{fileName(url)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((f) => f !== url))
                      }
                      aria-label={t("removeFile", "Remove")}
                      className="relative ms-1 after:absolute after:-inset-2 after:content-['']"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,audio/*"
              className="sr-only"
              onChange={(e) => void handleFiles(e.target.files)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={pending || uploading || files.length >= 10}
              >
                <Paperclip className="me-2 h-4 w-4" aria-hidden />
                {uploading
                  ? t("uploading", "Uploading…")
                  : t("attachFiles", "Attach files")}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  pending ||
                  uploading ||
                  (!content.trim() && files.length === 0)
                }
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
