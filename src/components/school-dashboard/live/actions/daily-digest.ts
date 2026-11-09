// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The admins' morning note about today's live classes: "12 live classes
// today, the first at 08:00; 2 can't start: their teachers have no login".
// Sent once per school day, from the first reminders-cron tick on or after
// 06:00 school time, and only for a school that teaches online today.
//
// It is a plain module called by the cron, never a "use server" action. The
// dedupe is the notification itself: a digest row already written today for
// this school means it has been sent.

import "server-only"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"

import { DEFAULT_SCHOOL_TZ, schoolDayWindow } from "../day-window"
import { getLiveTodaySummary } from "../live-today"

/** School-local hour from which the digest may go out. */
const DIGEST_FROM_HOUR = 6

const COPY = {
  ar: {
    title: "حصص اليوم المباشرة",
    body: "{n} حصة مباشرة اليوم، أولاها الساعة {time}.",
    blocked: " {blocked} حصة لا يمكن بدؤها: معلّموها بلا حساب دخول.",
  },
  en: {
    title: "Today's live classes",
    body: "{n} live classes today, the first at {time}.",
    blocked: " {blocked} can't start: their teachers have no login.",
  },
} as const

function localHour(tz: string, now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now)
  )
}

export async function runLiveDailyDigest(
  now: Date = new Date()
): Promise<{ sent: number }> {
  const schools = await db.school.findMany({
    where: { conferenceDeliveryMode: { in: ["online", "hybrid"] } },
    select: { id: true, timezone: true, preferredLanguage: true },
    take: 1000,
  })

  let sent = 0
  for (const school of schools) {
    try {
      const tz = school.timezone || DEFAULT_SCHOOL_TZ
      if (localHour(tz, now) < DIGEST_FROM_HOUR) continue

      const { start } = schoolDayWindow(tz, now)
      const already = await db.notification.findFirst({
        where: {
          schoolId: school.id,
          type: "live_class_scheduled",
          createdAt: { gte: start },
          metadata: { path: ["kind"], equals: "dailyDigest" },
        },
        select: { id: true },
      })
      if (already) continue

      const s = await getLiveTodaySummary(school.id, now)
      // Nothing online today, or the day's classes are all over: no note.
      if (s.onlineToday === 0 || !s.nextStart) continue

      const lang = school.preferredLanguage === "en" ? "en" : "ar"
      const c = COPY[lang]
      const body =
        c.body
          .replace("{n}", String(s.onlineToday))
          .replace("{time}", s.nextStart) +
        (s.noTeacherLogin > 0
          ? c.blocked.replace("{blocked}", String(s.noTeacherLogin))
          : "")

      const { created } = await dispatchNotificationsToAudience({
        schoolId: school.id,
        type: "live_class_scheduled",
        title: c.title,
        body,
        lang,
        priority: s.noTeacherLogin > 0 ? "high" : "normal",
        channels: ["in_app", "email"],
        metadata: {
          kind: "dailyDigest",
          url:
            s.noTeacherLogin > 0
              ? "/school/configuration/teaching-mode"
              : "/live",
        },
        targetScope: "role",
        targetRoles: ["ADMIN"],
      })
      sent += created > 0 ? 1 : 0
    } catch (err) {
      console.error("[live-class] daily digest failed", {
        schoolId: school.id,
        err: err instanceof Error ? err.message : String(err),
      })
    }
  }
  return { sent }
}
