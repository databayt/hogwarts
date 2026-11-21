"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { requestLessonDraft } from "@/components/lesson-draft/client"
import type { DraftResult, DraftStage } from "@/components/lesson-draft/types"
import { setClassLesson } from "@/components/school-dashboard/live/actions/resources"

import { LessonPicker } from "./lesson-picker"

export interface SuggestDraftsLabels {
  button: string
  working: string
  stages: Record<DraftStage, string>
  pickerLabel: string
  pickerPlaceholder: string
  suggested: string
  confirmLesson: string
  lessonSaved: string
  lessonSaveFailed: string
  topicLabel: string
  topicHint: string
  topicPlaceholder: string
  existingTitle: string
  replace: string
  keep: string
  done: string
  openQuiz: string
  openHomework: string
  draftBadge: string
  /** Error code → message. */
  errors: Record<string, string>
}

const TOPIC_MIN = 40

/**
 * The host's lesson picker + the «اقترح اختباراً وواجباً» button. A request
 * for DRAFTS only: nothing reaches a student until the teacher publishes. The
 * suggested lesson is preselected but saved only when the teacher confirms.
 * Rendered only when the server says the host may suggest (the flag is on).
 */
export function SuggestDraftsButton({
  sessionId,
  locale,
  lessons,
  currentId,
  suggestedId,
  labels,
  onDone,
}: {
  sessionId: string
  locale: string
  lessons: { id: string; name: string }[]
  currentId: string | null
  suggestedId: string | null
  labels: SuggestDraftsLabels
  /** After the lesson was saved or a NEW draft was written (not the "already
   *  exists" answer). When given it REPLACES `router.refresh()` — the room's
   *  Quiz tab reloads its own list instead of re-rendering the whole room page.
   *  The class page passes nothing and behaves exactly as before. */
  onDone?: () => void
}) {
  const router = useRouter()
  const refreshed = () => (onDone ? onDone() : router.refresh())
  const [saved, setSaved] = useState(currentId)
  const [lessonId, setLessonId] = useState(currentId ?? suggestedId ?? "")
  const [savingLesson, setSavingLesson] = useState(false)
  const [stage, setStage] = useState<DraftStage | null>(null)
  const [running, setRunning] = useState(false)
  const [needTopic, setNeedTopic] = useState(false)
  const [topic, setTopic] = useState("")
  const [existing, setExisting] = useState<DraftResult | null>(null)
  const [created, setCreated] = useState<DraftResult | null>(null)

  const message = (code: string) =>
    labels.errors[code] ?? labels.errors.UNKNOWN ?? ""

  const confirmLesson = async () => {
    setSavingLesson(true)
    const res = await setClassLesson(sessionId, lessonId || null)
    setSavingLesson(false)
    if (res.success) {
      setSaved(lessonId || null)
      SuccessToast(labels.lessonSaved)
      refreshed()
    } else ErrorToast(labels.lessonSaveFailed)
  }

  const run = async (replace: boolean) => {
    setRunning(true)
    setExisting(null)
    setCreated(null)
    setStage("reading")
    const outcome = await requestLessonDraft(
      {
        sessionId,
        lessonId: lessonId || undefined,
        topic: needTopic ? topic.trim() : undefined,
        replace: replace || undefined,
      },
      setStage
    )
    setRunning(false)
    setStage(null)
    if (!outcome.ok) {
      if (outcome.code === "LESSON_DRAFT_NO_TEXT") setNeedTopic(true)
      ErrorToast(message(outcome.code))
      return
    }
    if (outcome.result.existing) {
      setExisting(outcome.result)
      return
    }
    setCreated(outcome.result)
    refreshed()
  }

  const topicTooShort = needTopic && topic.trim().length < TOPIC_MIN
  const links = created ?? existing

  return (
    <div className="space-y-3">
      <LessonPicker
        id={`lesson-${sessionId}`}
        lessons={lessons}
        value={lessonId}
        onChange={setLessonId}
        suggestedId={suggestedId}
        disabled={running}
        labels={{
          label: labels.pickerLabel,
          placeholder: labels.pickerPlaceholder,
          suggested: labels.suggested,
        }}
      />
      {lessonId && lessonId !== saved && (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          disabled={savingLesson || running}
          onClick={confirmLesson}
        >
          {labels.confirmLesson}
        </Button>
      )}

      {needTopic && (
        <div className="space-y-1.5">
          <Label htmlFor={`topic-${sessionId}`}>{labels.topicLabel}</Label>
          <Textarea
            id={`topic-${sessionId}`}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={labels.topicPlaceholder}
            maxLength={500}
            rows={2}
            disabled={running}
          />
          <p className="text-muted-foreground text-xs">{labels.topicHint}</p>
        </div>
      )}

      <Button
        type="button"
        className="h-12 w-full"
        disabled={running || !lessonId || topicTooShort}
        onClick={() => run(false)}
      >
        {running ? (
          <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="me-2 h-4 w-4" aria-hidden />
        )}
        {running ? labels.working : labels.button}
      </Button>

      <p role="status" aria-live="polite" className="text-muted-foreground text-sm">
        {stage ? labels.stages[stage] : ""}
      </p>

      {existing && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">{labels.existingTitle}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              className="h-12 flex-1"
              disabled={running}
              onClick={() => run(true)}
            >
              {labels.replace}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              onClick={() => setExisting(null)}
            >
              {labels.keep}
            </Button>
          </div>
        </div>
      )}

      {links && (
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{labels.draftBadge}</Badge>
            {created && <p className="text-sm">{labels.done}</p>}
          </div>
          <ul className="space-y-1 text-sm">
            {links.quickAssessmentId && (
              <li>
                <Link
                  className="underline underline-offset-2"
                  href={`/${locale}/exams/quick/${links.quickAssessmentId}`}
                >
                  {labels.openQuiz}
                </Link>
              </li>
            )}
            <li>
              <Link
                className="underline underline-offset-2"
                href={`/${locale}/assignments/add/${links.assignmentId}/details`}
              >
                {labels.openHomework}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
