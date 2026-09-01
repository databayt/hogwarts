// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { CalendarClock, Radio } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"

interface NowStripProps extends LandingSectionProps {
  live: LandingSession[]
  upcoming: LandingSession[]
  viewer: LandingViewer
}

/**
 * What is actually happening — the first content on the page.
 *
 * It used to sit third, under four marketing cards and above two more bands,
 * on a page teachers and students open every school day. It is now the thing
 * you land on.
 *
 * Live and upcoming stay SEPARATE groups: one "Live now" heading over a list
 * that also held scheduled sessions would misdescribe half of them.
 *
 * Times arrive pre-formatted in the school's own zone (see the page) — a
 * server-side `toLocaleTimeString` resolves against the runtime's zone, which
 * is UTC on Vercel.
 */
export function LiveNowStrip({
  dictionary,
  lang,
  live,
  upcoming,
  viewer,
}: NowStripProps) {
  const n = dictionary?.landing?.now
  const hasAny = live.length > 0 || upcoming.length > 0

  if (!hasAny) {
    return (
      <section className="mb-16">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
          <CalendarClock
            className="text-muted-foreground size-8"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="font-medium">{n?.emptyTitle}</p>
          <p className={cn(typographyVariants.hint, "max-w-[42ch]")}>
            {n?.emptyDescription}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-16 space-y-10">
      {live.length > 0 && (
        <SessionGroup
          heading={n?.liveTitle}
          sessions={live}
          dictionary={dictionary}
          lang={lang}
          viewer={viewer}
        />
      )}

      {upcoming.length > 0 && (
        <SessionGroup
          heading={n?.upcomingTitle}
          sessions={upcoming}
          dictionary={dictionary}
          lang={lang}
          viewer={viewer}
        />
      )}
    </section>
  )
}

function SessionGroup({
  heading,
  sessions,
  dictionary,
  lang,
  viewer,
}: {
  heading?: string
  sessions: LandingSession[]
  dictionary: LandingSectionProps["dictionary"]
  lang: string
  viewer: LandingViewer
}) {
  const n = dictionary?.landing?.now

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className={typographyVariants.cardTitle}>{heading}</h2>
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "rounded-full"
          )}
          href={`/${lang}/live/dashboard`}
        >
          {n?.viewAll}
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            dictionary={dictionary}
            lang={lang}
            viewer={viewer}
          />
        ))}
      </ul>
    </div>
  )
}

/**
 * The lumos card grammar — a thumbnail that scales on hover, a title that
 * takes the accent, meta beneath — carrying the subject's own catalog artwork.
 *
 * `imageUrl` is null whenever the subject has no thumbnail OR CloudFront is
 * unconfigured, which is a normal state in some environments rather than an
 * error, so the coloured ground is a first-class fallback and not a placeholder
 * for a failure. `unoptimized` because these are already CDN-encoded at their
 * render width — the optimizer has nothing left to do.
 */
function SessionCard({
  session,
  dictionary,
  lang,
  viewer,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  lang: string
  viewer: LandingViewer
}) {
  const n = dictionary?.landing?.now
  const a = dictionary?.landing?.actions

  // Live goes straight into the room; scheduled opens the session. A viewer
  // who may not join (ACCOUNTANT) only ever gets the session page.
  const href =
    session.isLive && viewer.canJoin
      ? `/${lang}/live/${session.id}/room`
      : `/${lang}/live/${session.id}`

  const cta = !viewer.canJoin
    ? n?.open
    : session.isLive
      ? viewer.isHost
        ? a?.start
        : viewer.role === "GUARDIAN"
          ? a?.observe
          : n?.joinNow
      : n?.open

  const meta = [session.subjectName, session.sectionName, session.teacherName]
    .filter(Boolean)
    .join(" · ")

  return (
    <li>
      <Link href={href} className="group block">
        <div className="relative aspect-video overflow-hidden rounded-xl">
          {session.imageUrl ? (
            <Image
              src={session.imageUrl}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundColor: session.color || "#e5e7eb" }}
            />
          )}

          <div className="absolute start-3 top-3">
            {session.isLive ? (
              <Badge className="gap-1 rounded-full shadow-sm">
                <Radio className="size-3" aria-hidden="true" />
                {n?.liveTitle}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-full tabular-nums shadow-sm"
              >
                {session.scheduledStart}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-3 text-start">
          <h3 className="group-hover:text-primary line-clamp-2 text-sm leading-tight font-semibold transition-colors">
            {session.title}
          </h3>
          {meta ? <p className={typographyVariants.hint}>{meta}</p> : null}
          <p className="text-primary pt-1 text-xs font-medium">{cta}</p>
        </div>
      </Link>
    </li>
  )
}
