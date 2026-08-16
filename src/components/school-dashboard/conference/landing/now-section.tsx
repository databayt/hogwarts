// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { Radio } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

import type {
  ConferenceDictionary,
  LandingSectionProps,
  LandingSession,
} from "./types"

interface NowSectionProps extends LandingSectionProps {
  live: LandingSession[]
  upcoming: LandingSession[]
}

/**
 * What is actually happening, right on the landing page.
 *
 * Without this the landing page would be pure marketing for people who open
 * this block every school day — a teacher clicking "Conference" in the sidebar
 * used to land on the joinable list, so the one thing the landing must not do
 * is put the day's classes an extra click away.
 *
 * Live and upcoming are rendered as SEPARATE groups rather than one mixed
 * strip: a single "Live now" heading over a list that also held scheduled
 * sessions would misdescribe half of them.
 *
 * Times arrive pre-formatted in the school's own zone (see the page), because
 * a server-side `toLocaleTimeString` would resolve against the runtime's zone
 * — UTC on Vercel — and be wrong for every school that isn't in it.
 */
export function ConferenceNowSection({
  dictionary,
  lang,
  live,
  upcoming,
}: NowSectionProps) {
  const n = dictionary?.landing?.now
  const hasAny = live.length > 0 || upcoming.length > 0

  return (
    <section className="bg-muted/40 mb-24 rounded-xl border p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {live.length > 0 ? n?.liveTitle : n?.upcomingTitle}
        </h2>
        <Link
          className={buttonVariants({ variant: "ghost", size: "sm" })}
          href={`/${lang}/conference/dashboard`}
        >
          {n?.viewAll}
        </Link>
      </div>

      {hasAny ? (
        <div className="space-y-8">
          {live.length > 0 && (
            <SessionGroup
              sessions={live}
              dictionary={dictionary}
              lang={lang}
              // The section heading above already names this group.
              heading={null}
            />
          )}

          {upcoming.length > 0 && (
            <SessionGroup
              sessions={upcoming}
              dictionary={dictionary}
              lang={lang}
              // Only labelled when it sits under a "Live now" heading that
              // would otherwise be read as covering these too.
              heading={live.length > 0 ? (n?.upcomingTitle ?? null) : null}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Image
            src="/conference/agenda-empty-state.svg"
            alt={n?.emptyAlt ?? ""}
            width={315}
            height={167}
            className="h-auto w-full max-w-[315px]"
          />
          <div className="space-y-1">
            <p className="font-medium">{n?.emptyTitle}</p>
            <p className="text-muted-foreground text-sm">
              {n?.emptyDescription}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function SessionGroup({
  sessions,
  dictionary,
  lang,
  heading,
}: {
  sessions: LandingSession[]
  dictionary: ConferenceDictionary
  lang: string
  heading: string | null
}) {
  const n = dictionary?.landing?.now

  return (
    <div className="space-y-3">
      {heading ? (
        <h3 className="text-muted-foreground text-sm font-medium">{heading}</h3>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sessions.slice(0, 4).map((session) => (
          <li
            key={session.id}
            className="bg-background flex flex-col gap-3 rounded-lg border p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-sm font-medium">
                {session.title}
              </p>
              {session.isLive ? (
                <Badge className="shrink-0 gap-1">
                  <Radio className="size-3" aria-hidden="true" />
                  {n?.liveTitle}
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 tabular-nums">
                  {session.scheduledStart}
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground text-xs">
              {[session.subjectName, session.sectionName, session.teacherName]
                .filter(Boolean)
                .join(" · ")}
            </p>

            <Link
              className={buttonVariants({
                size: "sm",
                variant: session.isLive ? "default" : "outline",
                className: "mt-auto",
              })}
              href={`/${lang}/conference/${session.id}`}
            >
              {session.isLive ? n?.joinNow : n?.open}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
