// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  resolveSlotJoin,
  type SlotJoinOutcome,
} from "@/components/school-dashboard/live/actions/join-slot"
import { DEFAULT_SCHOOL_TZ } from "@/components/school-dashboard/live/day-window"
import { JoinAutoOpen } from "@/components/school-dashboard/live/join-auto-open"
import { loadNextClassToday } from "@/components/school-dashboard/live/next-class"
import {
  NextClassCard,
  resolveNextClassLabels,
} from "@/components/school-dashboard/live/next-class-card"
import { resolveClassAlertsLabels } from "@/components/school-dashboard/notifications/class-alerts-labels"
import { ClassAlertsPrompt } from "@/components/school-dashboard/notifications/class-alerts-prompt"

// Every visit is a decision made NOW (which room, whether it is open yet), so
// nothing here may be cached or prerendered.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; timetableId: string }>
}

/**
 * `/{lang}/live/join/{timetableId}` — the one link every surface uses to put
 * a teacher or student into today's class for a timetable slot.
 *
 * It decides on the server and redirects: into the room, or out to the
 * section's standing meeting link. When it cannot (too early, over, not
 * online today, not theirs) it says so in one line instead of a dead button,
 * and the too-early state reopens itself when the window opens.
 *
 * Linked with plain anchors / `prefetch={false}` everywhere: a prefetch must
 * never run this page, because running it can write today's room.
 */
export default async function Page({ params }: Props) {
  // The tenant resolves beside the session: neither reads the other.
  const [{ lang, timetableId }, session, { schoolId }] = await Promise.all([
    params,
    auth(),
    getTenantContext(),
  ])
  if (!session?.user?.id) {
    // Back here after signing in — this link is shared in reminders and
    // messages, and dropping a student on the dashboard defeats the tap.
    redirect(
      `/${lang}/login?callbackUrl=${encodeURIComponent(
        `/${lang}/live/join/${timetableId}`
      )}`
    )
  }

  // What the "not yet / not today" screens print starts NOW, beside the join
  // decision, instead of after it — neither depends on the other. The common
  // outcome is a redirect that needs neither; the no-op catches only keep an
  // unused failure from being reported as unhandled (the awaits below still
  // throw it).
  const dictionaryRead = getDictionary(lang)
  // Clock times are in the SCHOOL's zone — a bare server-side format would
  // print UTC, and a client one the reader's device zone.
  const schoolRead = schoolId
    ? db.school.findUnique({
        where: { id: schoolId },
        select: { timezone: true },
      })
    : Promise.resolve(null)
  dictionaryRead.catch(() => {})
  schoolRead.catch(() => {})

  const outcome: SlotJoinOutcome = schoolId
    ? await resolveSlotJoin({
        schoolId,
        userId: session.user.id,
        role: session.user.role as UserRole,
        timetableId,
      })
    : { kind: "not_found" }

  if (outcome.kind === "room") {
    redirect(`/${lang}/live/${outcome.sessionId}/room`)
  }
  if (outcome.kind === "external") {
    redirect(outcome.url)
  }

  // A dead end is where a teacher with back-to-back periods gets lost: for the
  // outcomes that say "not this class", offer the next one.
  const nextRead =
    schoolId &&
    (outcome.kind === "over" ||
      outcome.kind === "cancelled" ||
      outcome.kind === "unavailable")
      ? loadNextClassToday({
          schoolId,
          userId: session.user.id,
          role: session.user.role,
          afterTimetableId: timetableId,
        }).catch(() => null)
      : Promise.resolve(null)
  const [dictionary, school, nextClass] = await Promise.all([
    dictionaryRead,
    schoolRead,
    nextRead,
  ])
  const t = dictionary?.liveClasses?.joinLink

  const time = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: school?.timezone || DEFAULT_SCHOOL_TZ,
  })

  let title: string
  let hint: string | null = null
  switch (outcome.kind) {
    case "early":
      title = (t?.early ?? "Your class starts at {start}.").replace(
        "{start}",
        time.format(outcome.startsAt)
      )
      hint = (
        t?.earlyHint ??
        "The room opens at {opens}. Keep this page open — it takes you in by itself."
      ).replace("{opens}", time.format(outcome.opensAt))
      break
    case "over":
      title = t?.over ?? "Today's class has ended."
      hint = t?.overHint ?? null
      break
    case "cancelled":
      title = t?.cancelled ?? "Today's class was cancelled."
      break
    case "not_today":
      title = t?.notToday ?? "This class isn't on today's timetable."
      break
    case "not_online":
      title = t?.notOnline ?? "This class is taught in person today."
      break
    case "unavailable":
      title = t?.unavailable ?? "This class has no online room yet."
      hint =
        outcome.reason === "holiday"
          ? (t?.unavailableHoliday ?? "The school is closed today.")
          : outcome.reason === "no_teacher"
            ? (t?.unavailableNoTeacher ??
              "No teacher is assigned to this class yet — ask the school office.")
            : (t?.unavailableHint ?? null)
      break
    case "forbidden":
      title = t?.forbidden ?? "This class isn't one of yours."
      break
    default:
      title = t?.notFound ?? "We couldn't find this class."
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {outcome.kind === "early" ? (
        // A duration the server measured: the page counts it down without
        // trusting the phone's clock.
        <JoinAutoOpen opensInMs={outcome.opensInMs} />
      ) : null}
      <h1
        className={cn(
          typographyVariants.sectionTitle,
          "max-w-[28ch] text-balance"
        )}
      >
        {title}
      </h1>
      {hint ? (
        <p
          className={cn(
            typographyVariants.pageDescription,
            "max-w-[44ch] text-balance"
          )}
        >
          {hint}
        </p>
      ) : null}
      {outcome.kind === "early" ? (
        // The reader is waiting for a class to open: the moment to offer the
        // alert that would have told them when it does.
        <ClassAlertsPrompt
          labels={resolveClassAlertsLabels(dictionary?.liveClasses?.alerts)}
          className="max-w-[44ch] justify-center"
        />
      ) : null}
      {nextClass ? (
        <NextClassCard
          next={{
            ...nextClass,
            startsAt: nextClass.startsAt.toISOString(),
            endsAt: nextClass.endsAt.toISOString(),
          }}
          lang={lang}
          timeZone={school?.timezone || DEFAULT_SCHOOL_TZ}
          labels={resolveNextClassLabels(dictionary?.liveClasses?.nextClass)}
        />
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Link
          href={`/${lang}/timetable`}
          className={buttonVariants({ variant: "default" })}
        >
          {t?.toTimetable ?? "Back to timetable"}
        </Link>
        <Link
          href={`/${lang}/live`}
          className={buttonVariants({ variant: "ghost" })}
        >
          {t?.toLive ?? "Live classes"}
        </Link>
      </div>
    </main>
  )
}
