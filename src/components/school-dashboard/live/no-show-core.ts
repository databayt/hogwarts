// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// «حصة بلا معلم» — the scan behind /api/cron/live-class-no-show.
//
// Every five minutes: find the classes that started `NO_SHOW_AFTER_MINUTES` ago
// and have no teacher, and tell the school's ADMINs and the supervisors of the
// class's stage — once per class. The rule is ./no-show.ts; this file loads,
// sends and stays quiet when there is nobody to tell.
import "server-only"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { getLabels } from "@/components/translation/person"

import { DEFAULT_SCHOOL_TZ } from "./day-window"
import {
  NO_SHOW_AFTER_MINUTES,
  NO_SHOW_LOOKBACK_HOURS,
  noShowNotice,
  noShowWhat,
  notifiedSessionIds,
  selectNoShowSessions,
} from "./no-show"
import { GRADE_STAGE_SELECT, stageOfGradeRow } from "./supervisors-core"
import { noTeacherRecipients } from "./supervisors"

const NOTIFICATION_TYPE = "live_class_no_teacher" as const

export type NoShowScan = {
  candidates: number
  alerted: number
  notices: number
}

export async function runNoShowScan(now: Date = new Date()): Promise<NoShowScan> {
  const t = now.getTime()
  const rows = await db.conference.findMany({
    where: {
      status: { in: ["scheduled", "live"] },
      deletedAt: null,
      isPractice: false,
      coveredByUserId: null,
      sectionId: { not: null },
      subjectId: { not: null },
      // A timetable class, or a make-up. Ad-hoc rooms have no bell to miss.
      OR: [{ timetableId: { not: null } }, { makeupForId: { not: null } }],
      scheduledStart: {
        lte: new Date(t - NO_SHOW_AFTER_MINUTES * 60_000),
        gte: new Date(t - NO_SHOW_LOOKBACK_HOURS * 3_600_000),
      },
      scheduledEnd: { gt: now },
      // The demo school's timetable runs untaught every day: alerting its fixture
      // admin is noise on the account used in sales demos (23 alerts, 11-23 08:56).
      school: { domain: { not: "demo" } },
      // Nobody teaching has ever been in the room.
      participants: {
        none: { role: { in: ["HOST", "CO_HOST"] }, joinedAt: { not: null } },
      },
    },
    select: {
      id: true,
      schoolId: true,
      status: true,
      isPractice: true,
      title: true,
      scheduledStart: true,
      scheduledEnd: true,
      coveredByUserId: true,
      subject: { select: { name: true } },
      section: {
        select: { name: true, grade: { select: GRADE_STAGE_SELECT } },
      },
      school: { select: { timezone: true, preferredLanguage: true } },
    },
    take: 500,
  })
  if (rows.length === 0) return { candidates: 0, alerted: 0, notices: 0 }

  const schoolIds = [...new Set(rows.map((r) => r.schoolId))]
  const told = await db.notification.findMany({
    where: {
      schoolId: { in: schoolIds },
      type: NOTIFICATION_TYPE,
      createdAt: { gte: new Date(t - NO_SHOW_LOOKBACK_HOURS * 3_600_000) },
    },
    select: { metadata: true },
    take: 5000,
  })
  const due = selectNoShowSessions(
    rows.map((r) => ({ ...r, hostEverJoined: false })),
    now,
    notifiedSessionIds(told)
  )
  if (due.length === 0) return { candidates: rows.length, alerted: 0, notices: 0 }

  const dueSchools = [...new Set(due.map((r) => r.schoolId))]
  const [admins, supervisors] = await Promise.all([
    db.user.findMany({
      where: { schoolId: { in: dueSchools }, role: "ADMIN", isSuspended: false },
      select: { id: true, schoolId: true },
    }),
    db.liveClassSupervisor.findMany({
      where: { schoolId: { in: dueSchools } },
      select: { schoolId: true, userId: true, stage: true },
    }),
  ])

  let alerted = 0
  let notices = 0
  for (const s of due) {
    const lang = s.school.preferredLanguage === "en" ? "en" : "ar"
    const stage = stageOfGradeRow(s.section?.grade)
    const recipients = noTeacherRecipients({
      adminUserIds: admins
        .filter((a) => a.schoolId === s.schoolId)
        .map((a) => a.id),
      supervisorUserIds: supervisors
        .filter((p) => p.schoolId === s.schoolId && p.stage === stage)
        .map((p) => p.userId),
    })
    if (recipients.length === 0) continue

    // Names are stored in the school's language; a best-effort pass gives the
    // other one. A failure leaves them as stored — never blocks the alert.
    let subject = s.subject?.name ?? null
    let section = s.section?.name ?? null
    try {
      const labels = await getLabels(
        [subject, section],
        lang,
        s.schoolId
      )
      if (subject) subject = labels.get(subject) ?? subject
      if (section) section = labels.get(section) ?? section
    } catch {
      // keep the stored names
    }

    const time = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: s.school.timezone || DEFAULT_SCHOOL_TZ,
    }).format(s.scheduledStart)
    const { title, body } = noShowNotice(lang, {
      what: noShowWhat({ subject, section, title: s.title }),
      time,
    })
    const coverPath = `/live/${s.id}/cover`
    const { created } = await dispatchNotificationsToAudience({
      schoolId: s.schoolId,
      type: NOTIFICATION_TYPE,
      title,
      body,
      lang,
      priority: "urgent",
      channels: ["in_app", "push"],
      metadata: {
        kind: "noTeacher",
        sessionId: s.id,
        url: coverPath,
        deep_link: coverPath,
      },
      targetUserIds: recipients,
    })
    if (created > 0) {
      alerted++
      notices += created
    }
  }
  return { candidates: rows.length, alerted, notices }
}
