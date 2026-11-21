"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useParams } from "next/navigation"
import { Check, ExternalLink, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { startExam } from "@/components/school-dashboard/exams/manage/actions/status"
import {
  closeQuickAssessment,
  launchQuickAssessment,
} from "@/components/school-dashboard/exams/quick/actions"
import type { QuickAssessmentResults } from "@/components/school-dashboard/exams/quick/actions/types"
import { QuickAssessmentTake } from "@/components/school-dashboard/exams/quick/take"
import {
  attachLiveClassResource,
  getRoomQuizzes,
  type RoomDraftSuggest,
  type RoomQuizItem,
} from "@/components/school-dashboard/live/actions/resources"
import { recordClassEvent } from "@/components/school-dashboard/live/actions/room-events"

import type { RoomLabels } from "./labels"
import type { ClassChannel } from "./use-class-channel"

/**
 * Quizzes in the room.
 *
 * The host's Quiz tab lists the class's linked quick checks and exams (plus
 * the subject's other quick checks, linked on launch), launches one through
 * the exams actions — which own status, marking and the gradebook — and
 * tells the room over the channel. Students get a sheet over the stage:
 * a quick check answers in place, an exam opens its own player.
 */

const RESULTS_POLL_MS = 4_000

// The lesson-draft button ships OFF. A dynamic import, mounted only once the
// server has sent `suggest`, keeps it (and the lesson-draft client) out of the
// room's chunk for every viewer while the feature is off.
const SuggestDraftsButton = dynamic(
  () =>
    import("@/components/school-dashboard/live/suggest-drafts-button").then(
      (m) => m.SuggestDraftsButton
    ),
  { ssr: false }
)

export function QuizTab({
  channel,
  labels,
  sessionId,
  active: panelOpen = true,
}: {
  channel: ClassChannel
  labels: RoomLabels
  sessionId: string
  /** The side panel is on screen — it stays mounted, hidden, while closed, and
   *  a hidden tab has no reader for the live answer counts. */
  active?: boolean
}) {
  const live = channel.state.quiz
  const [items, setItems] = useState<RoomQuizItem[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [results, setResults] = useState<QuickAssessmentResults | null>(null)
  // Local to this tab. `null` unless the server said this host may suggest.
  const [suggest, setSuggest] = useState<RoomDraftSuggest | null>(null)
  const lang = useParams<{ lang?: string }>()?.lang ?? "ar"

  const load = useCallback(async () => {
    const res = await getRoomQuizzes(sessionId)
    const ok = "success" in res && res.success
    setItems(ok ? res.data : [])
    setSuggest(ok ? (res.suggest ?? null) : null)
  }, [sessionId])

  useEffect(() => {
    void load()
  }, [load])

  // Answers coming in, while a quick check is open — and only while this tab
  // is on screen and the page is visible. A GET route, not the server action:
  // an action poll ships a full RSC re-render with every response (see
  // `/api/live/quick-results`).
  useEffect(() => {
    if (!live || live.kind !== "quick") {
      setResults(null)
      return
    }
    if (!panelOpen) return
    let active = true
    let h: number | undefined
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/live/quick-results?id=${encodeURIComponent(live.id)}`,
          { cache: "no-store" }
        )
        const body = (await res.json()) as {
          success?: boolean
          data?: QuickAssessmentResults
        }
        if (active && body.success && body.data) setResults(body.data)
      } catch {
        // A missed poll is only a stale count; the next tick asks again.
      }
    }
    const start = () => {
      if (h !== undefined) return
      void tick()
      h = window.setInterval(tick, RESULTS_POLL_MS)
    }
    const stop = () => {
      if (h === undefined) return
      window.clearInterval(h)
      h = undefined
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") start()
      else stop()
    }
    if (document.visibilityState === "visible") start()
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      active = false
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [live, panelOpen])

  const launch = async (item: RoomQuizItem) => {
    setBusy(item.id)
    setError(false)
    try {
      if (item.kind === "quick") {
        if (!item.linked) {
          const attached = await attachLiveClassResource({
            sessionId,
            quickAssessmentId: item.id,
          })
          if (!("success" in attached) || !attached.success)
            throw new Error("attach")
        }
        const res = await launchQuickAssessment(item.id)
        if (!res.success) throw new Error("launch")
      } else if (item.status === "PLANNED") {
        const res = await startExam(item.id)
        if (!res.success) throw new Error("start")
      }
      await channel.send({
        t: "quiz.open",
        quiz: { id: item.id, title: item.title, kind: item.kind },
      })
      void recordClassEvent({
        sessionId,
        kind: "quiz_launched",
        key: item.id,
        payload: { quizId: item.id, title: item.title, kind: item.kind },
      })
      void load()
    } catch {
      setError(true)
    } finally {
      setBusy(null)
    }
  }

  const end = async () => {
    if (!live) return
    setBusy(live.id)
    setError(false)
    try {
      // An exam keeps its own lifecycle (completing it is marking day's
      // decision, on the exams page); the room only stops pointing at it.
      if (live.kind === "quick") {
        const res = await closeQuickAssessment(live.id)
        if (!res.success) throw new Error("close")
      }
      await channel.send({ t: "quiz.close", id: live.id })
      void recordClassEvent({
        sessionId,
        kind: "quiz_closed",
        key: live.id,
        payload: {
          quizId: live.id,
          title: live.title,
          kind: live.kind,
          responses: results?.totalResponses ?? null,
        },
      })
      void load()
    } catch {
      setError(true)
    } finally {
      setBusy(null)
    }
  }

  if (live) {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto p-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-black">
            {labels.quizLive}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {live.title}
          </span>
        </div>

        {live.kind === "quick" && (
          <>
            <p className="text-muted-foreground tabular-nums">
              {labels.quizAnswered.replace(
                "{n}",
                String(results?.totalResponses ?? 0)
              )}
            </p>
            {results && results.totalResponses === 0 && (
              <p className="text-muted-foreground">{labels.quizNoAnswers}</p>
            )}
            <ol className="space-y-3">
              {results?.questionResults.map((q, i) => {
                const total = q.responses.reduce((n, r) => n + r.count, 0)
                return (
                  <li key={q.questionId} className="space-y-1.5">
                    <p className="font-medium">
                      {i + 1}. {q.questionText}
                    </p>
                    {q.responses.map((r, j) => {
                      const pct = total
                        ? Math.round((r.count / total) * 100)
                        : 0
                      return (
                        <div
                          key={j}
                          className="border-border relative overflow-hidden rounded-md border px-2.5 py-1.5"
                        >
                          <div
                            aria-hidden
                            className={cn(
                              "absolute inset-y-0 start-0",
                              r.isCorrect === true
                                ? "bg-emerald-500/35"
                                : r.isCorrect === false
                                  ? "bg-rose-500/30"
                                  : "bg-sky-600/35"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex items-center gap-2">
                            {r.isCorrect === true && (
                              <Check
                                className="size-3.5 shrink-0"
                                aria-hidden
                              />
                            )}
                            <span className="min-w-0 flex-1 truncate">
                              {String(r.answer)}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              {r.count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </li>
                )
              })}
            </ol>
          </>
        )}
        {live.kind === "exam" && (
          <p className="text-muted-foreground">{labels.quizExamHint}</p>
        )}

        {error && <p className="text-destructive">{labels.quizFailed}</p>}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground mt-auto bg-transparent"
          disabled={busy !== null}
          onClick={() => void end()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : labels.quizEnd}
        </Button>
      </div>
    )
  }

  if (items === null) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    )
  }

  const linked = items.filter((q) => q.linked)
  const more = items.filter((q) => !q.linked)

  // Needs BOTH the server's `suggest` and the labels the page built for a host
  // with the feature on; either missing means no button.
  const draftButton =
    suggest && labels.lessonDraft ? (
      <SuggestDraftsButton
        sessionId={sessionId}
        locale={lang}
        lessons={suggest.lessons}
        currentId={suggest.currentId}
        suggestedId={suggest.suggestedId}
        labels={labels.lessonDraft}
        onDone={() => void load()}
      />
    ) : null

  if (items.length === 0) {
    // Without the button (the feature is off, or not this viewer's) the empty
    // state is the one line it always was.
    if (!draftButton) {
      return (
        <p className="text-muted-foreground p-3 text-sm">{labels.quizEmpty}</p>
      )
    }
    return (
      <div className="h-full space-y-4 overflow-y-auto p-3 text-sm">
        <p className="text-muted-foreground">{labels.quizEmpty}</p>
        {draftButton}
      </div>
    )
  }

  const row = (item: RoomQuizItem) => (
    <li
      key={item.id}
      className="bg-muted flex min-h-[52px] items-center gap-3 rounded-2xl py-1.5 ps-3 pe-1.5"
    >
      <span className="min-w-0 flex-1 truncate text-[15px]">{item.title}</span>
      <Button
        type="button"
        size="sm"
        className="h-9 rounded-full"
        disabled={busy !== null}
        onClick={() => void launch(item)}
      >
        {busy === item.id ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          labels.quizLaunch
        )}
      </Button>
    </li>
  )

  return (
    <div className="h-full space-y-4 overflow-y-auto p-3 text-sm">
      {error && <p className="text-destructive">{labels.quizFailed}</p>}
      {linked.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-muted-foreground text-xs font-medium">
            {labels.quizLinked}
          </h3>
          <ul className="space-y-1.5">{linked.map(row)}</ul>
        </section>
      )}
      {more.length > 0 && (
        <section className="space-y-1.5">
          <h3 className="text-muted-foreground text-xs font-medium">
            {labels.quizMore}
          </h3>
          <ul className="space-y-1.5">{more.map(row)}</ul>
        </section>
      )}
      {draftButton}
    </div>
  )
}

/**
 * The student's side: a sheet over the stage while the host has a quiz open.
 * Dismissable — the class keeps going behind it — and it comes back on its
 * own when the host launches the next one.
 */
export function QuizSheet({
  channel,
  labels,
  locale,
  canAnswer,
}: {
  channel: ClassChannel
  labels: RoomLabels
  locale: string
  canAnswer: boolean
}) {
  const quiz = channel.state.quiz
  const [dismissed, setDismissed] = useState<string | null>(null)
  if (channel.isHost || !canAnswer || !quiz || dismissed === quiz.id)
    return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={quiz.title}
      className="bg-background text-foreground absolute inset-x-0 bottom-0 z-40 flex max-h-[85dvh] flex-col rounded-t-3xl shadow-2xl sm:inset-x-auto sm:end-4 sm:bottom-4 sm:max-h-[80dvh] sm:w-[28rem] sm:rounded-3xl"
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-black">
          {labels.quizLive}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">
          {quiz.title}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-9"
          aria-label={labels.quizClose}
          onClick={() => setDismissed(quiz.id)}
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        {quiz.kind === "quick" ? (
          <QuickAssessmentTake key={quiz.id} assessmentId={quiz.id} />
        ) : (
          <div className="space-y-3 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              {labels.quizExamHint}
            </p>
            <Button asChild>
              <a
                href={`/${locale}/exams/${quiz.id}/take`}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                {labels.quizOpen}
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
