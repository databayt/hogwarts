// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { cn } from "@/lib/utils"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getLiveTodaySummary } from "@/components/school-dashboard/live/live-today"
import { resolveClassAlertsLabels } from "@/components/school-dashboard/notifications/class-alerts-labels"
import { ClassAlertsPrompt } from "@/components/school-dashboard/notifications/class-alerts-prompt"

import { getUpcomingDataByRole } from "./actions"
import { NextActionCard } from "./next-action-client"
import { rankNextActions } from "./next-action-rank"

const SCHOOL_SIDE = new Set(["ADMIN", "DEVELOPER", "PRINCIPAL", "STAFF"])

/**
 * Server half of the dashboard's next-action banner: read the role, pull
 * the same upcoming payload the Upcoming flip card already uses, rank it, and
 * hand the ordered list to the client for the rotation.
 *
 * Best-effort — an empty or failed read renders nothing rather than an empty
 * green banner announcing that there is nothing to announce.
 */
export async function NextAction({
  locale,
  className,
}: {
  locale: string
  className?: string
}) {
  let actions

  try {
    const session = await auth()
    const role = session?.user?.role
    const schoolId = session?.user?.schoolId
    const [data, liveToday] = await Promise.all([
      getUpcomingDataByRole(role || ""),
      // The school's people (not students, teachers or guardians, whose own
      // class payload already carries it) see today's live classes at the
      // top of the card: running now, blocked, or the day's count.
      schoolId && SCHOOL_SIDE.has((role || "").toUpperCase())
        ? getLiveTodaySummary(schoolId).catch(() => null)
        : Promise.resolve(null),
    ])
    actions = rankNextActions(
      role,
      data && liveToday ? { ...data, liveToday } : data
    )
  } catch (error) {
    console.error("[NextAction] Error ranking actions:", error)
    return null
  }

  if (!actions?.length) return null

  // Someone with a class to join today (their own, or a child's) is the
  // reader a class alert is for. The prompt sits UNDER the banner, never in
  // it: the card keeps its two pills. It renders nothing once alerts are on.
  const hasClassToday = actions.some((a) => Boolean(a.live))
  if (!hasClassToday) {
    return (
      <NextActionCard actions={actions} locale={locale} className={className} />
    )
  }
  const dictionary = await getDictionary(locale as Locale).catch(() => null)
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <NextActionCard actions={actions} locale={locale} className="flex-1" />
      <ClassAlertsPrompt
        labels={resolveClassAlertsLabels(dictionary?.liveClasses?.alerts)}
        className="px-2"
      />
    </div>
  )
}
