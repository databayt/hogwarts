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
  LandingViewer,
} from "@/components/school-dashboard/live/landing/types"
import { getLiveKitReadiness } from "@/components/school-dashboard/live/livekit/client"
import {
  effectivePolicy,
  ONLINE_POLICY_SELECT,
} from "@/components/school-dashboard/live/online-policy"
import {
  getLiveLandingCounts,
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

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const ALLOWED_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
  "ACCOUNTANT",
]

const SCHEDULE_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]
const CONFIGURE_ROLES = ["DEVELOPER", "ADMIN"]
const HOST_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]
// ACCOUNTANT passes `read_school_dashboard` and is school-scoped, so it can
// LIST every session — but `authorization.ts` excludes it from both joining
// and `view_recordings`. The page must not offer it a door it cannot use.
const JOIN_ROLES = ["DEVELOPER", "ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "STAFF"]
const RECORDING_ROLES = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "STAFF",
]

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
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const dictionary = await getDictionary(lang)
  const d = dictionary.school.liveClasses
  const settings = dictionary.liveClasses?.settings
  const { schoolId } = await getTenantContext()

  const viewer: LandingViewer = {
    role,
    canSchedule: SCHEDULE_ROLES.includes(role),
    canConfigure: CONFIGURE_ROLES.includes(role),
    isHost: HOST_ROLES.includes(role),
    canJoin: JOIN_ROLES.includes(role),
    canViewRecordings: RECORDING_ROLES.includes(role),
  }

  let policy: LandingPolicy = {
    deliveryMode: "physical",
    isOnline: false,
    windowActive: false,
    provider: "external",
    degraded: false,
  }
  let live: LandingSession[] = []
  let upcoming: LandingSession[] = []
  let liveNow = 0
  let todayTotal = 0
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
        const teacherId =
          role === "TEACHER" ? (session?.user?.id ?? undefined) : undefined

        const [rows, counts] = await Promise.all([
          getLiveLandingSessions(schoolId, { now, sectionIds, teacherId }),
          getLiveLandingCounts(schoolId, {
            now,
            sectionIds,
            teacherId,
            timeZone,
          }),
        ])

        liveNow = counts.liveNow
        todayTotal = counts.todayTotal

        const all = [...rows.live, ...rows.upcoming]

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
            all.flatMap((r) => [r.subject?.name, r.section?.name]),
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

        const liveIds = new Set(rows.live.map((r) => r.id))
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
            subjectName: r.subject?.name
              ? (labels.get(r.subject.name) ?? r.subject.name)
              : null,
            sectionName: r.section?.name
              ? (labels.get(r.section.name) ?? r.section.name)
              : null,
            scheduledStart: r.scheduledStart
              ? timeFormat.format(new Date(r.scheduledStart))
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
          .filter((r) => !liveIds.has(r.id))
          .map(toSession)
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
      liveNow={liveNow}
      todayTotal={todayTotal}
    />
  )
}
