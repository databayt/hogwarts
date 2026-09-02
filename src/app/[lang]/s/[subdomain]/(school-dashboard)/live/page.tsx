// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogImageUrl } from "@/components/catalog/image-url"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getLiveLinkCoverage } from "@/components/school-dashboard/live/actions/settings"
import { DEFAULT_SCHOOL_TZ } from "@/components/school-dashboard/live/day-window"
import { LiveLandingContent } from "@/components/school-dashboard/live/landing/content"
import type {
  LandingPolicy,
  LandingReadiness,
  LandingSession,
  LandingSubjectTile,
} from "@/components/school-dashboard/live/landing/types"
import {
  canOpenLanding,
  resolveLandingViewer,
} from "@/components/school-dashboard/live/landing/viewer"
import { getLiveKitReadiness } from "@/components/school-dashboard/live/livekit/client"
import {
  effectivePolicy,
  ONLINE_POLICY_SELECT,
} from "@/components/school-dashboard/live/online-policy"
import {
  getLiveLandingPast,
  getLiveLandingSessions,
  resolveViewerSectionScope,
} from "@/components/school-dashboard/live/queries"
import { localize } from "@/components/translation/localize"
import { getLabels, getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.liveClasses
  // The block name, not the page's state — a tab title and a bookmark want a
  // stable label, and the state already has the <h1>.
  return {
    title: d?.title,
    description: d?.description,
  }
}

/** Rows printed in the past shelf's list column, and squares beside it. Both
 *  are the reference's own counts: two rows against two rows of three tiles. */
const PAST_LIST_ROWS = 2
const PAST_TILES = 6

/** A class this close to starting says so rather than printing a bare time. */
const SOON_MINUTES = 15
/** A running class this close to its end says THAT instead. */
const ENDING_MINUTES = 10

/**
 * Where a class sits in its own clock, for the card's last row.
 *
 * Resolved on the SERVER against the render's `now`, like every other time on
 * this page — a client tick would be more truthful by the minute but would put
 * the block's first hydration boundary on a label. The consequence is honest
 * and worth knowing: a card left open does not re-label itself, so the phase
 * is as fresh as the page.
 *
 * `progress` is only meaningful while a class is running, and is clamped: a
 * session that overran its booked end would otherwise report more minutes done
 * than it has.
 */
function resolvePhase(
  row: { scheduledStart: Date; scheduledEnd: Date; actualStart: Date | null },
  ctx: { now: Date; isLive: boolean; isPast: boolean }
): Pick<LandingSession, "phase" | "progress"> {
  if (ctx.isPast) return { phase: "past", progress: null }

  const startedAt = row.actualStart ?? row.scheduledStart
  const minutes = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60_000

  if (ctx.isLive) {
    const total = Math.max(1, Math.round(minutes(row.scheduledEnd, startedAt)))
    const done = Math.min(
      total,
      Math.max(0, Math.round(minutes(ctx.now, startedAt)))
    )
    const left = minutes(row.scheduledEnd, ctx.now)
    return {
      phase: left <= ENDING_MINUTES ? "ending" : "started",
      progress: { done, total },
    }
  }

  const until = minutes(row.scheduledStart, ctx.now)
  return {
    phase: until <= SOON_MINUTES ? "soon" : "scheduled",
    progress: null,
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * The /live landing page.
 *
 * Students are deliberately NOT redirected past it, unlike /lumos: their strip
 * is section-scoped and sits at the top, so the page answers "can I join my
 * class" for them rather than being marketing they have to click through.
 */
export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!canOpenLanding(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const dictionary = await getDictionary(lang)
  const d = dictionary.school.liveClasses
  const settings = dictionary.liveClasses?.settings
  const { schoolId } = await getTenantContext()

  // Re-resolved below once the strip's scope is known: whether a teacher's rows
  // were actually narrowed to their own classes decides whether a card bothers
  // naming the teacher. Resolved here first so every branch — including the
  // ones that never reach a query — has a viewer.
  let viewer = resolveLandingViewer(role)

  let policy: LandingPolicy = {
    deliveryMode: "physical",
    isOnline: false,
    windowActive: false,
    provider: "external",
    degraded: false,
  }
  let live: LandingSession[] = []
  let upcoming: LandingSession[] = []
  let past: LandingSession[] = []
  let pastSubjects: LandingSubjectTile[] = []
  let readiness: LandingReadiness | null = null

  if (schoolId) {
    const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"

    // The strip and the counts are an accelerator, not the page — a failure
    // here must leave the landing standing rather than take the block down.
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: ONLINE_POLICY_SELECT,
      })

      // No section or grade override: this is the school-wide answer, which is
      // what the hero and the readiness band are about.
      const resolved = school ? effectivePolicy(school, null) : null

      if (resolved) {
        policy = {
          deliveryMode: school!.conferenceDeliveryMode,
          isOnline: resolved.online,
          windowActive: resolved.source === "window",
          provider: resolved.provider,
          degraded: resolved.degraded,
        }
      }

      // Same section scoping the sessions table uses: a student or guardian
      // must never see another section's room, landing page or not.
      const scope = await resolveViewerSectionScope(
        schoolId,
        session?.user?.id,
        role
      )

      if (scope !== "none") {
        const now = new Date()
        const timeZone = school?.timezone || DEFAULT_SCHOOL_TZ
        const sectionIds = scope === "all" ? undefined : scope.sectionIds

        // A teacher is staff, so the scope above hands them the whole school.
        // Right for the strip; the hero wants their OWN next class.
        //
        // `Conference.teacherId` references Teacher.id, NOT the User — a
        // teacher is a separate person row, the same way a student is — so the
        // session's user id has to be mapped through, exactly as the schedule
        // form does it. Filtering on the raw user id would match no rows at
        // all and show a teacher an empty page while their class was live.
        const teacher =
          role === "TEACHER" && session?.user?.id
            ? await db.teacher.findFirst({
                where: { schoolId, userId: session.user.id },
                select: { id: true },
              })
            : null
        const teacherId = teacher?.id ?? undefined

        // Every row below is now one this teacher teaches, so their cards stop
        // repeating their own name and name the SECTION instead. Keyed on the
        // resolved id rather than on the role: a TEACHER account with no
        // `Teacher` row falls through to the whole-school scope, and a card
        // that dropped the name there would be hiding whose class it is.
        viewer = resolveLandingViewer(role, {
          teachesEveryRow: Boolean(teacherId),
        })

        // Only the strip's rows are read here. The hero used to also show the
        // day's live/total counts, and dropping that state from it drops the
        // second query with it (`getLiveLandingCounts` stays in queries.ts —
        // see ISSUE.md).
        // Both landing reads in one round trip. The past shelf over-fetches
        // (24 rows for 2 printed) because its tile column is one-per-SUBJECT
        // and dedupes out of the same rows.
        const [rows, pastRows] = await Promise.all([
          getLiveLandingSessions(schoolId, { now, sectionIds, teacherId }),
          getLiveLandingPast(schoolId, { sectionIds, teacherId }),
        ])

        const all = [...rows.live, ...rows.upcoming, ...pastRows]

        // ONE batched translation pass over both slices — titles via localize,
        // names via getNames, labels via getLabels. Never per row.
        const [localizedRows, teacherNames, labels] = await Promise.all([
          localize("Conference", all, { schoolId, lang: displayLang }),
          getNames(
            all.filter((r) => r.teacher),
            (r: (typeof all)[number]) => r.teacher!,
            displayLang,
            schoolId
          ),
          getLabels(
            all.flatMap((r) => [
              r.subject?.name,
              r.section?.name,
              r.section?.grade?.name,
              r.catalogLesson?.chapter?.name,
              r.catalogLesson?.name,
            ]),
            displayLang,
            schoolId
          ),
        ])

        // Formatted HERE, in the school's own zone. A client-side format uses
        // the reader's device zone; a bare server-side one uses the runtime's,
        // which is UTC on Vercel — both wrong for a school in another zone.
        const timeFormat = new Intl.DateTimeFormat(
          displayLang === "ar" ? "ar" : "en-US",
          { hour: "2-digit", minute: "2-digit", timeZone }
        )
        // A class that is over wants the DAY it happened, not the minute it
        // started — "09:40" on a row from last Tuesday reads as today.
        const dateFormat = new Intl.DateTimeFormat(
          displayLang === "ar" ? "ar" : "en-US",
          { day: "numeric", month: "long", timeZone }
        )

        const liveIds = new Set(rows.live.map((r) => r.id))
        const pastIds = new Set(pastRows.map((r) => r.id))
        const toSession = (
          r: (typeof localizedRows)[number]
        ): LandingSession => {
          const rawTeacher = r.teacher ? fullName(r.teacher) : ""
          return {
            id: r.id,
            title: r.title,
            teacherName: rawTeacher
              ? (teacherNames.get(rawTeacher) ?? rawTeacher)
              : "",
            teacherPhotoUrl: r.teacher?.profilePhotoUrl ?? null,
            subjectName: r.subject?.name
              ? (labels.get(r.subject.name) ?? r.subject.name)
              : null,
            sectionName: r.section?.name
              ? (labels.get(r.section.name) ?? r.section.name)
              : null,
            gradeName: r.section?.grade?.name
              ? (labels.get(r.section.grade.name) ?? r.section.grade.name)
              : null,
            chapterName: r.catalogLesson?.chapter?.name
              ? (labels.get(r.catalogLesson.chapter.name) ??
                r.catalogLesson.chapter.name)
              : null,
            lessonName: r.catalogLesson?.name
              ? (labels.get(r.catalogLesson.name) ?? r.catalogLesson.name)
              : null,
            ...resolvePhase(r, {
              now,
              isLive: liveIds.has(r.id),
              isPast: pastIds.has(r.id),
            }),
            scheduledStart: r.scheduledStart
              ? (pastIds.has(r.id) ? dateFormat : timeFormat).format(
                  new Date(r.scheduledStart)
                )
              : "",
            isLive: liveIds.has(r.id),
            // `Subject` IS the catalog subject, so its artwork is one FK away.
            // Null whenever there is no thumbnail OR CloudFront is unset — a
            // normal state, which is why the card's colour ground is a real
            // fallback rather than an error placeholder.
            imageUrl: getCatalogImageUrl(r.subject?.thumbnail, "sm"),
            color: r.subject?.color ?? null,
          }
        }

        live = localizedRows.filter((r) => liveIds.has(r.id)).map(toSession)
        upcoming = localizedRows
          .filter((r) => !liveIds.has(r.id) && !pastIds.has(r.id))
          .map(toSession)

        // Newest first, straight out of the query's order.
        past = localizedRows
          .filter((r) => pastIds.has(r.id))
          .slice(0, PAST_LIST_ROWS)
          .map(toSession)

        // One tile per SUBJECT: first occurrence wins, which is that subject's
        // most recent class and therefore where the tile lands.
        const tiles = new Map<string, LandingSubjectTile>()
        for (const r of localizedRows) {
          const subject = r.subject
          if (!pastIds.has(r.id) || !subject || tiles.has(subject.id)) continue
          tiles.set(subject.id, {
            id: subject.id,
            name: labels.get(subject.name) ?? subject.name,
            imageUrl: getCatalogImageUrl(subject.thumbnail, "sm"),
            color: subject.color ?? null,
            sessionId: r.id,
          })
        }
        pastSubjects = [...tiles.values()].slice(0, PAST_TILES)
      }
    } catch (error) {
      console.error("[LiveLanding] Could not load sessions:", error)
    }

    // Readiness reads separately, so a settings failure cannot blank the strip
    // above it.
    if (viewer.canConfigure) {
      try {
        const kit = getLiveKitReadiness()
        const coverage = await getLiveLinkCoverage()
        // This action RETURNS its failure rather than throwing, so the
        // discriminant is the only thing that catches a denied read.
        const ok = coverage && "success" in coverage && coverage.success
        readiness = {
          livekitReady: kit.configured,
          recordingReady: kit.recordingConfigured,
          hasFallback: ok ? coverage.data.hasFallback : false,
          coverage: ok
            ? {
                total: coverage.data.total,
                covered: coverage.data.covered,
                gapCount: coverage.data.gapCount,
              }
            : null,
        }
      } catch (error) {
        console.error("[LiveLanding] Could not load readiness:", error)
      }
    }
  }

  return (
    <LiveLandingContent
      dictionary={d}
      settings={settings}
      lang={lang}
      viewer={viewer}
      policy={policy}
      readiness={readiness}
      live={live}
      upcoming={upcoming}
      past={past}
      pastSubjects={pastSubjects}
    />
  )
}
