"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, Film, Radio, Video } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type SessionStateLabels = {
  upcoming: string
  startsAt: string
  startsIn: string
  live: string
  enter: string
  ended: string
  cancelled: string
  processing: string
  ready: string
  failed: string
  noRecording: string
  watchRecording: string
  openLesson: string
  minutes: string
  hours: string
}

type RecordingState = "none" | "processing" | "ready" | "failed"

/**
 * The one line a student needs: what state the class is in and the one thing
 * they can do about it. Upcoming (with a countdown), live (the big Enter
 * button), ended (recording being prepared / available / failed / never
 * recorded). Everything technical stays off this surface.
 *
 * The countdown ticks on the client; the initial render already carries the
 * right state from the server, so there is no flash of the wrong one.
 */
export function SessionState({
  status,
  scheduledStart,
  recording,
  joinHref,
  recordingHref,
  lessonHref,
  locale,
  labels,
}: {
  status: "scheduled" | "live" | "ended" | "cancelled" | "failed"
  scheduledStart: string // ISO
  recording: RecordingState
  /** In-app room or external meeting link (rendered as a plain anchor). */
  joinHref: string | null
  recordingHref: string | null
  lessonHref: string | null
  locale: string
  labels: SessionStateLabels
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (status !== "scheduled") return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [status])

  const startMs = new Date(scheduledStart).getTime()
  const fmtTime = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (status === "cancelled" || status === "failed") {
    return (
      <Banner tone="muted" icon={<Clock className="h-5 w-5" />}>
        <p className="font-medium">{labels.cancelled}</p>
      </Banner>
    )
  }

  if (status === "scheduled") {
    const diffMin = Math.max(0, Math.round((startMs - now) / 60_000))
    const countdown =
      diffMin >= 120
        ? labels.hours.replace("{n}", String(Math.round(diffMin / 60)))
        : labels.minutes.replace("{n}", String(diffMin))
    const soon = diffMin <= 10
    return (
      <Banner
        tone={soon ? "primary" : "muted"}
        icon={<Clock className="h-5 w-5" />}
      >
        <p className="font-medium">{labels.upcoming}</p>
        <p className="text-muted-foreground text-sm">
          {labels.startsAt.replace("{time}", fmtTime.format(startMs))}
          {startMs > now
            ? ` · ${labels.startsIn.replace("{value}", countdown)}`
            : ""}
        </p>
        {/* Within ten minutes the door is open: join-core admits the host, and a
            student who arrives early sees the room become live. */}
        {soon && joinHref && <Cta href={joinHref} label={labels.enter} />}
      </Banner>
    )
  }

  if (status === "live") {
    return (
      <Banner tone="live" icon={<Radio className="h-5 w-5 animate-pulse" />}>
        <p className="text-base font-semibold">{labels.live}</p>
        {joinHref && <Cta href={joinHref} label={labels.enter} big />}
      </Banner>
    )
  }

  // ended
  const line =
    recording === "processing"
      ? labels.processing
      : recording === "ready"
        ? labels.ready
        : recording === "failed"
          ? labels.failed
          : labels.noRecording
  return (
    <Banner tone="muted" icon={<Film className="h-5 w-5" />}>
      <p className="font-medium">{labels.ended}</p>
      <p
        className={cn(
          "text-sm",
          recording === "ready" ? "text-foreground" : "text-muted-foreground"
        )}
        aria-live="polite"
      >
        {line}
      </p>
      {recording === "ready" && (
        <div className="flex flex-wrap gap-2">
          {lessonHref && <Cta href={lessonHref} label={labels.openLesson} />}
          {recordingHref && (
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href={recordingHref}
            >
              <Video className="me-2 h-4 w-4" />
              {labels.watchRecording}
            </Link>
          )}
        </div>
      )}
    </Banner>
  )
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "muted" | "primary" | "live"
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        tone === "live" && "border-destructive/40 bg-destructive/5",
        tone === "primary" && "border-primary/40 bg-primary/5",
        tone === "muted" && "bg-muted/40"
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
    </div>
  )
}

function Cta({
  href,
  label,
  big,
}: {
  href: string
  label: string
  big?: boolean
}) {
  const external = /^https?:\/\//.test(href)
  const cls = buttonVariants({ size: big ? "lg" : "sm" })
  return external ? (
    <a className={cls} href={href} target="_blank" rel="noopener noreferrer">
      <Video className="me-2 h-4 w-4" />
      {label}
    </a>
  ) : (
    <Link className={cls} href={href}>
      <Video className="me-2 h-4 w-4" />
      {label}
    </Link>
  )
}
