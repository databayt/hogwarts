"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  WifiOff,
} from "lucide-react"

import {
  type DownloadedLesson,
  type OutboxItem,
  type StoredAsset,
} from "@/lib/offline/db"
import {
  docAssetKey,
  getStoredAsset,
  listDownloadedLessons,
  removeDownloadedLesson,
  type LessonManifest,
} from "@/lib/offline/download-manager"
import {
  formatBytes,
  useOfflineVideoUrl,
  useOnlineStatus,
  useOutbox,
} from "@/lib/offline/hooks"
import {
  discardOutboxItem,
  enqueue,
  listOutbox,
  retryOutboxItem,
  subscribeOutbox,
} from "@/lib/offline/outbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import type { OfflineLabels } from "./download-button"

/**
 * The offline library: every lesson stored on this device, an offline
 * viewer for each (video from IndexedDB, documents, summary, quiz that
 * queues its answers), and the outbox — what is waiting to sync and what
 * the server refused, with retry/discard.
 *
 * Lives on `/offline`, the page the service worker serves when navigation
 * fails; it also works online, where it is simply the list of downloads.
 */

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]
const PROGRESS_EVERY_MS = 5000

interface LibraryProps {
  labels?: OfflineLabels
  lang: string
}

type Labels = (
  k: string,
  fallback: string,
  vars?: Record<string, string | number>
) => string

function makeT(labels?: OfflineLabels): Labels {
  return (k, fallback, vars) => {
    let s = labels?.[k] ?? fallback
    for (const [name, v] of Object.entries(vars ?? {}))
      s = s.replace(`{${name}}`, String(v))
    return s
  }
}

export function OfflineLibrary({ labels, lang }: LibraryProps) {
  const t = useMemo(() => makeT(labels), [labels])
  const [lessons, setLessons] = useState<DownloadedLesson[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const online = useOnlineStatus()

  const refresh = useCallback(async () => {
    setLessons(await listDownloadedLessons().catch(() => []))
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const open = lessons?.find((l) => l.id === openId) ?? null

  if (open) {
    return (
      <OfflineLessonViewer
        row={open}
        t={t}
        lang={lang}
        onBack={() => setOpenId(null)}
        onRemove={async () => {
          await removeDownloadedLesson(open.id)
          setOpenId(null)
          await refresh()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {!online && (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <WifiOff className="h-4 w-4" aria-hidden />
          {t("offlineNow", "You're offline")} —{" "}
          {t("offlineHint", "Downloaded lessons still play.")}
        </p>
      )}

      <section className="space-y-3">
        <h2>{t("library", "Downloaded lessons")}</h2>
        {lessons === null ? (
          <Loader2
            className="text-muted-foreground h-5 w-5 animate-spin"
            aria-hidden
          />
        ) : lessons.length === 0 ? (
          <p className="text-muted-foreground">
            {t("libraryEmpty", "No lessons downloaded yet.")}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {lessons.map((row) => {
              const m = row.manifest as LessonManifest
              return (
                <li key={row.id}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {m.lesson.title}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        {m.lesson.course.title} · {m.lesson.chapter.title}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        {row.status === "complete" ? (
                          <Check
                            className="me-1 inline h-3.5 w-3.5"
                            aria-hidden
                          />
                        ) : null}
                        {row.status === "complete"
                          ? t("downloaded", "Available offline")
                          : row.status === "partial"
                            ? t("resume", "Resume download")
                            : t("failed", "Download failed")}{" "}
                        · {formatBytes(row.bytes, lang)}
                      </span>
                      <span className="ms-auto flex gap-1">
                        <Button size="sm" onClick={() => setOpenId(row.id)}>
                          {t("open", "Open")}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t("remove", "Remove download")}
                          onClick={async () => {
                            await removeDownloadedLesson(row.id)
                            await refresh()
                          }}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </span>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <OutboxPanel t={t} lang={lang} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Viewer
// ---------------------------------------------------------------------------

function OfflineLessonViewer({
  row,
  t,
  lang,
  onBack,
  onRemove,
}: {
  row: DownloadedLesson
  t: Labels
  lang: string
  onBack: () => void
  onRemove: () => Promise<void>
}) {
  const m = row.manifest as LessonManifest
  const videoUrl = useOfflineVideoUrl(row.id)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [speed, setSpeed] = useState(1)
  const [resumeAt, setResumeAt] = useState<number | null>(null)
  const lastSentRef = useRef(0)

  // Resume from the newest pending sample on this device, else from the
  // position the server knew when the lesson was downloaded.
  useEffect(() => {
    let cancelled = false
    void listOutbox().then((items) => {
      if (cancelled) return
      const mine = items
        .filter(
          (i) => i.kind === "progress" && i.coalesceKey === `progress:${row.id}`
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      const payload = mine?.payload as { watchedSeconds?: number } | undefined
      setResumeAt(payload?.watchedSeconds ?? m.progress?.watchedSeconds ?? 0)
    })
    return () => {
      cancelled = true
    }
  }, [row.id, m.progress?.watchedSeconds])

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed, videoUrl])

  const onLoaded = () => {
    const v = videoRef.current
    if (v && resumeAt && resumeAt > 0 && resumeAt < v.duration - 5)
      v.currentTime = resumeAt
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !Number.isFinite(v.duration)) return
    const now = Date.now()
    if (now - lastSentRef.current < PROGRESS_EVERY_MS) return
    lastSentRef.current = now
    void enqueue({
      kind: "progress",
      coalesceKey: `progress:${row.id}`,
      payload: {
        lessonId: row.id,
        watchedSeconds: Math.floor(v.currentTime),
        totalSeconds: Math.floor(v.duration),
      },
    })
  }

  const onEnded = () => {
    const v = videoRef.current
    if (!v) return
    void enqueue({
      kind: "progress",
      coalesceKey: `progress:${row.id}`,
      payload: {
        lessonId: row.id,
        watchedSeconds: Math.floor(v.duration),
        totalSeconds: Math.floor(v.duration),
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {t("back", "Back to the list")}
        </Button>
        <Link
          href={`/${lang}/lumos/courses/${m.lesson.course.slug}/${row.id}`}
          className="text-muted-foreground ms-auto text-sm underline-offset-2 hover:underline"
        >
          {t("open", "Open")} →
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("remove", "Remove download")}
          onClick={() => void onRemove()}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <header>
        <h1>{m.lesson.title}</h1>
        <p className="text-muted-foreground">
          {m.lesson.course.title} · {m.lesson.chapter.title}
        </p>
      </header>

      {videoUrl ? (
        <div className="space-y-2">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            playsInline
            className="w-full rounded-lg bg-black"
            onLoadedMetadata={onLoaded}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
          />
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="offline-speed" className="text-muted-foreground">
              {t("speed", "Speed")}
            </label>
            <select
              id="offline-speed"
              className="bg-background rounded-md border px-2 py-1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
            <span className="text-muted-foreground ms-auto text-xs">
              {t("progressQueued", "Progress saved on this device")}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">
          {t("noVideo", "This lesson has no downloadable video")}
        </p>
      )}

      {(m.lesson.description || m.lesson.course.objectives.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("summary", "Summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {m.lesson.description && (
              <p className="whitespace-pre-wrap">{m.lesson.description}</p>
            )}
            {m.lesson.course.objectives.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-semibold">
                  {t("objectives", "Objectives")}
                </h3>
                <ul className="list-disc space-y-1 ps-5 text-sm">
                  {m.lesson.course.objectives.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {m.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("documents", "Documents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {m.documents.map((doc) => (
                <li key={doc.id}>
                  <OfflineDocumentLink lessonId={row.id} doc={doc} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {m.questions.length > 0 && (
        <OfflineQuiz lessonId={row.id} questions={m.questions} t={t} />
      )}
    </div>
  )
}

function OfflineDocumentLink({
  lessonId,
  doc,
}: {
  lessonId: string
  doc: LessonManifest["documents"][number]
}) {
  const [asset, setAsset] = useState<StoredAsset | null | undefined>(undefined)
  useEffect(() => {
    void getStoredAsset(docAssetKey(lessonId, doc.id)).then((a) =>
      setAsset(a ?? null)
    )
  }, [lessonId, doc.id])

  const openBlob = () => {
    if (!asset?.blob) return
    const url = URL.createObjectURL(asset.blob)
    window.open(url, "_blank", "noopener")
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <button
      type="button"
      onClick={openBlob}
      disabled={!asset?.blob}
      className="hover:bg-muted flex w-full items-center gap-2 rounded-md border px-3 py-2 text-start text-sm disabled:opacity-50"
    >
      <FileText className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{doc.title}</span>
      {asset && (
        <span className="text-muted-foreground ms-auto text-xs">
          {formatBytes(asset.receivedBytes)}
        </span>
      )}
    </button>
  )
}

function OfflineQuiz({
  lessonId,
  questions,
  t,
}: {
  lessonId: string
  questions: LessonManifest["questions"]
  t: Labels
}) {
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [queuedId, setQueuedId] = useState<string | null>(null)
  const [graded, setGraded] = useState<{ score: number; total: number } | null>(
    null
  )

  const allAnswered = questions.every((q) =>
    q.choices === null
      ? (texts[q.id] ?? "").trim().length > 0
      : choices[q.id] !== undefined
  )

  // When the drain hands back the graded result for our attempt, show it.
  useEffect(() => {
    if (!queuedId) return
    return subscribeOutbox(() => {
      void listOutbox().then((items) => {
        if (items.some((i) => i.id === queuedId)) return
        // Gone from the outbox = applied or duplicate. The score itself only
        // travels in the drain summary, which the banner's drain owns; show
        // "synced" here and let the lesson page carry the number.
        setGraded((g) => g ?? { score: -1, total: -1 })
      })
    })
  }, [queuedId])

  const submit = async () => {
    const id = crypto.randomUUID()
    await enqueue({
      kind: "quiz",
      id,
      payload: {
        lessonId,
        answers: questions.map((q) =>
          q.choices === null
            ? { questionId: q.id, answerText: texts[q.id] ?? "" }
            : { questionId: q.id, selectedOptionIndex: choices[q.id] }
        ),
      },
    })
    setQueuedId(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("quiz", "Quiz")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, idx) => (
          <fieldset key={q.id} disabled={!!queuedId} className="space-y-2">
            <legend className="font-medium">
              {idx + 1}. {q.questionText}
            </legend>
            {q.choices === null ? (
              <Input
                value={texts[q.id] ?? ""}
                placeholder={t("typeAnswer", "Type your answer")}
                onChange={(e) =>
                  setTexts((s) => ({ ...s, [q.id]: e.target.value }))
                }
              />
            ) : (
              <div className="space-y-1">
                {q.choices.map((label, i) => (
                  <label
                    key={i}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={`oq-${q.id}`}
                      checked={choices[q.id] === i}
                      onChange={() => setChoices((s) => ({ ...s, [q.id]: i }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ))}
        {queuedId ? (
          <p className="text-muted-foreground text-sm" role="status">
            {graded
              ? t("synced", "Everything is synced")
              : t(
                  "quizQueued",
                  "Answers saved on this device — they'll be graded when you're back online."
                )}
          </p>
        ) : (
          <Button
            type="button"
            disabled={!allAnswered}
            onClick={() => void submit()}
          >
            {t("submitQuiz", "Submit answers")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Outbox
// ---------------------------------------------------------------------------

function OutboxPanel({ t, lang }: { t: Labels; lang: string }) {
  const online = useOnlineStatus()
  const { pending, parked, drain, draining } = useOutbox()
  const [items, setItems] = useState<OutboxItem[]>([])

  useEffect(() => {
    const load = () => void listOutbox().then(setItems)
    load()
    return subscribeOutbox(load)
  }, [])

  if (pending === 0 && parked === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        <Check className="me-1 inline h-4 w-4" aria-hidden />
        {t("synced", "Everything is synced")}
      </p>
    )
  }

  const kindLabel = (k: OutboxItem["kind"]) =>
    k === "progress"
      ? t("kindProgress", "Playback position")
      : k === "complete"
        ? t("kindComplete", "Lesson completion")
        : k === "quiz"
          ? t("kindQuiz", "Quiz answers")
          : t("kindAssignment", "Assignment")

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2>
          {pending > 0
            ? t("pendingSync", "{count} items waiting to sync", {
                count: pending,
              })
            : t("attention", "{count} items need attention", { count: parked })}
        </h2>
        {online && pending > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="ms-auto"
            disabled={draining}
            onClick={() => void drain()}
          >
            {draining ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            {draining ? t("syncing", "Syncing…") : t("syncNow", "Sync now")}
          </Button>
        )}
      </div>
      <ul className="divide-y rounded-md border">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
          >
            <span className="font-medium">{kindLabel(i.kind)}</span>
            <span className="text-muted-foreground">
              {new Date(i.createdAt).toLocaleString(lang)}
            </span>
            {i.state === "parked" ? (
              <>
                <span className="text-destructive">
                  {t("parkedItem", "Couldn't sync: {code}", {
                    code: i.code ?? "?",
                  })}
                </span>
                <span className="ms-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void retryOutboxItem(i.id)}
                  >
                    {t("retry", "Retry")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void discardOutboxItem(i.id)}
                  >
                    {t("discard", "Discard")}
                  </Button>
                </span>
              </>
            ) : (
              <span className="text-muted-foreground ms-auto text-xs">
                {i.attempts > 0 ? `↻ ${i.attempts}` : ""}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
