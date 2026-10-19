// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  ChildTodayLive,
  type ChildTodayRow,
} from "@/components/school-dashboard/parent-portal/child-today-live"
import { getChildTodaySchedule } from "@/components/school-dashboard/timetable/actions"

/**
 * Today's online classes, per child, on the parent's home page.
 *
 * The home page had no live awareness at all, so a parent of an online school
 * landed on grades and invoices while their child's class was running. This
 * draws the Parent Portal's own today strip, only for children who have an
 * online class today, through the timetable block's guardian-gated read (the
 * same one the portal uses — no second copy of the resolution). Best effort:
 * a child whose read fails is simply left out.
 */
export async function ParentLiveToday({
  childrenList,
  lang,
}: {
  childrenList: Array<{ id: string; name: string }>
  lang: Locale
}) {
  if (childrenList.length === 0) return null
  const [dictionary, todays] = await Promise.all([
    getDictionary(lang),
    Promise.all(
      childrenList.map((c) =>
        getChildTodaySchedule({ childId: c.id }).catch(() => null)
      )
    ),
  ])
  const t = dictionary?.parentPortal?.timetable

  const withLive = childrenList
    .map((child, i) => ({ child, today: todays[i] }))
    .filter(
      ({ today }) =>
        !!today &&
        (today.schedule as ChildTodayRow[]).some((r) => r.liveClass?.sessionId)
    )
  if (withLive.length === 0) return null

  return (
    <div className="space-y-4">
      {withLive.map(({ child, today }) => (
        <ChildTodayLive
          key={child.id}
          rows={today!.schedule as ChildTodayRow[]}
          closure={today!.closure ?? null}
          lang={lang}
          canJoin={"canJoin" in today! ? Boolean(today!.canJoin) : false}
          labels={{
            title: child.name,
            description:
              t?.todayDescription ??
              "Your child's classes today. Online classes show a Join button while they are running.",
            online: t?.online ?? "Online",
            join: t?.join ?? "Join",
            empty: t?.noClassesToday ?? "No classes scheduled today.",
            closed: t?.closed ?? "School is closed today",
          }}
        />
      ))}
    </div>
  )
}
