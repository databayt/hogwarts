// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DEFAULT_SCHOOL_TZ } from "@/components/school-dashboard/live/day-window"
import { ConferenceLandingContent } from "@/components/school-dashboard/live/landing/content"
import type { LandingSession } from "@/components/school-dashboard/live/landing/types"
import {
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
  return {
    title: d?.title,
    description: d?.landing?.description ?? d?.description,
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

/**
 * The conference landing page — hero, value cards, what's on today, and the
 * long-form bands, mirroring how `/lumos` opens its block.
 *
 * Unlike lumos, students are NOT redirected past it: their live/coming-up
 * strip is section-scoped and sits high on the page, so the landing answers
 * "can I join my class" for them too rather than being marketing they have to
 * click through.
 */
export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const dictionary = await getDictionary(lang)
  const d = dictionary.school.liveClasses
  const { schoolId } = await getTenantContext()

  let live: LandingSession[] = []
  let upcoming: LandingSession[] = []

  if (schoolId) {
    try {
      // Same section scoping the sessions table uses: a student or guardian
      // must never see another section's room, landing page or not.
      const scope = await resolveViewerSectionScope(
        schoolId,
        session?.user?.id,
        role
      )

      if (scope !== "none") {
        const now = new Date()
        const [{ live: liveRows, upcoming: upcomingRows }, school] =
          await Promise.all([
            getLiveLandingSessions(schoolId, {
              now,
              sectionIds: scope === "all" ? undefined : scope.sectionIds,
            }),
            db.school.findUnique({
              where: { id: schoolId },
              select: { timezone: true },
            }),
          ])

        const rows = [...liveRows, ...upcomingRows]
        const displayLang: "ar" | "en" = lang === "en" ? "en" : "ar"

        // ONE batched translation pass over both slices, exactly as the table
        // does — titles via localize, names via getNames, labels via getLabels.
        const [localizedRows, teacherNames, labels] = await Promise.all([
          localize("Conference", rows, { schoolId, lang: displayLang }),
          getNames(
            rows.filter((r) => r.teacher),
            (r: (typeof rows)[number]) => r.teacher!,
            displayLang,
            schoolId
          ),
          getLabels(
            rows.flatMap((r) => [r.subject?.name, r.section?.name]),
            displayLang,
            schoolId
          ),
        ])

        // The start time is formatted HERE, in the school's own zone. A
        // client-side format would use the reader's device zone and a bare
        // server-side one would use the runtime's (UTC on Vercel) — both wrong
        // for a school that isn't in the same zone as the person reading.
        const timeZone = school?.timezone || DEFAULT_SCHOOL_TZ
        const timeFormat = new Intl.DateTimeFormat(
          displayLang === "ar" ? "ar" : "en-US",
          { hour: "2-digit", minute: "2-digit", timeZone }
        )

        const liveIds = new Set(liveRows.map((r) => r.id))
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
          }
        }

        live = localizedRows.filter((r) => liveIds.has(r.id)).map(toSession)
        upcoming = localizedRows
          .filter((r) => !liveIds.has(r.id))
          .map(toSession)
      }
    } catch (error) {
      // The strip is an accelerator, not the page. A failure here must leave
      // the landing standing rather than take the whole block down.
      console.error("[ConferenceLanding] Could not load sessions:", error)
    }
  }

  return (
    <ConferenceLandingContent
      dictionary={d}
      lang={lang}
      live={live}
      upcoming={upcoming}
      canSchedule={SCHEDULE_ROLES.includes(role)}
      canConfigure={CONFIGURE_ROLES.includes(role)}
    />
  )
}
