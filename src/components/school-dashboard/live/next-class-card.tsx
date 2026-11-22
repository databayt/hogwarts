// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/** Every string the card prints, from `liveClasses.nextClass`. */
export type NextClassLabels = {
  title: string
  enter: string
  /** Carries `{time}`. */
  startsAt: string
  running: string
}

export const DEFAULT_NEXT_CLASS_LABELS: NextClassLabels = {
  title: "Your next class",
  enter: "Enter the class",
  startsAt: "Starts at {time}",
  running: "Started",
}

export function resolveNextClassLabels(source: unknown): NextClassLabels {
  const out = { ...DEFAULT_NEXT_CLASS_LABELS }
  if (source && typeof source === "object") {
    for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
      if (typeof v === "string" && k in out) {
        ;(out as Record<string, string>)[k] = v
      }
    }
  }
  return out
}

/** The serialisable shape — ISO strings — so a server page can hand it to a client component. */
export type NextClassData = {
  timetableId: string
  subject: string
  section: string
  startsAt: string
  endsAt: string
}

/**
 * The way forward from a finished class: the reader's next period today.
 * Presentational and hook-free, so a server page and the client room share it.
 * Renders nothing without a next class.
 */
export function NextClassCard({
  next,
  lang,
  timeZone,
  labels,
  className,
}: {
  next: NextClassData | null | undefined
  lang: string
  timeZone: string
  labels: NextClassLabels
  className?: string
}) {
  if (!next) return null
  const startsAt = new Date(next.startsAt)
  const started = startsAt.getTime() <= Date.now()
  const time = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(startsAt)
  const meta = [next.subject, next.section].filter(Boolean).join(" · ")

  return (
    <section
      className={cn(
        "bg-card text-card-foreground border-border flex w-full max-w-[44ch] flex-col gap-3 rounded-lg border p-4 text-start",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm font-medium">
          {labels.title}
        </p>
        <p className="text-base font-semibold">{meta}</p>
        <p className="text-muted-foreground text-sm">
          {started ? labels.running : labels.startsAt.replace("{time}", time)}
        </p>
      </div>
      {/* A plain anchor, never a prefetching Link: the join page decides and
          may write today's room when it runs. */}
      <a
        href={`/${lang}/live/join/${next.timetableId}`}
        className={cn(
          buttonVariants({ variant: "default" }),
          "min-h-11 w-full"
        )}
      >
        {labels.enter}
      </a>
    </section>
  )
}
