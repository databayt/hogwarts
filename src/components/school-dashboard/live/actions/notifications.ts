// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live-class → student/guardian notification helper.
//
// NOT a "use server" action — invoked internally from sessions.ts and the
// webhook handler. Best-effort: failures are logged but never thrown.

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"

type ConferenceEventKind =
  | "scheduled"
  | "startingSoon"
  | "started"
  | "cancelled"
  | "recordingReady"

// Minimal lang-aware templates. Kept inline to avoid coupling to the
// dictionary loader at module init time (so cron + webhook stay cheap).
const TEMPLATES: Record<
  ConferenceEventKind,
  Record<"ar" | "en", { title: string; body: string }>
> = {
  scheduled: {
    ar: {
      title: "تم جدولة فصل مباشر",
      body: "{title} مع {teacher} في {when}",
    },
    en: {
      title: "Live class scheduled",
      body: "{title} with {teacher} on {when}",
    },
  },
  startingSoon: {
    ar: {
      title: "فصل مباشر يبدأ قريباً",
      body: "{title} يبدأ خلال 10 دقائق",
    },
    en: {
      title: "Live class starting soon",
      body: "{title} starts in 10 minutes",
    },
  },
  started: {
    ar: { title: "الفصل المباشر يبث الآن", body: "انضم الآن إلى {title}" },
    en: { title: "Live class is now live", body: "Join {title} now" },
  },
  cancelled: {
    ar: { title: "تم إلغاء الفصل المباشر", body: "{title} — {reason}" },
    en: { title: "Live class cancelled", body: "{title} — {reason}" },
  },
  recordingReady: {
    ar: { title: "تسجيل الفصل جاهز", body: "تسجيل {title} متاح للمشاهدة" },
    en: {
      title: "Recording ready",
      body: "Recording for {title} is now available",
    },
  },
}

function pickLang(lang: string | null | undefined): "ar" | "en" {
  return lang === "en" ? "en" : "ar"
}

function render(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    template
  )
}

function formatWhen(d: Date, lang: "ar" | "en"): string {
  try {
    return d.toLocaleString(lang === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return d.toISOString()
  }
}

interface ResolvedSession {
  id: string
  schoolId: string
  title: string
  sectionId: string | null
  teacherFullName: string
  scheduledStart: Date
  routePath: string
}

async function loadSession(
  schoolId: string,
  sessionId: string
): Promise<{
  session: ResolvedSession
  lang: "ar" | "en"
  userIds: string[]
} | null> {
  const session = await db.conference.findFirst({
    where: { id: sessionId, schoolId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      sectionId: true,
      visibility: true,
      scheduledStart: true,
      teacher: {
        select: { firstName: true, lastName: true, userId: true },
      },
      school: { select: { preferredLanguage: true } },
    },
  })
  if (!session) return null

  const lang = pickLang(session.school.preferredLanguage)
  const teacherFullName =
    `${session.teacher.firstName} ${session.teacher.lastName}`.trim()
  const routePath = `/live/${session.id}`

  const userIds = new Set<string>()
  if (session.teacher.userId) userIds.add(session.teacher.userId)

  if (session.visibility === "school") {
    // School-wide session (assembly / town hall): every member of the school
    // is the audience. The hub batches the createMany and honors per-user
    // channel preferences, so a large school stays safe.
    const users = await db.user.findMany({
      where: { schoolId },
      select: { id: true },
    })
    for (const u of users) userIds.add(u.id)
  } else if (session.sectionId) {
    // Resolve student User ids in the section
    const students = await db.student.findMany({
      where: { schoolId, sectionId: session.sectionId, userId: { not: null } },
      select: { userId: true },
    })
    for (const s of students) {
      if (s.userId) userIds.add(s.userId)
    }
    // Resolve guardian User ids of those students
    const studentIds = students
      .map((s) => s.userId)
      .filter((id): id is string => Boolean(id))
    if (studentIds.length > 0) {
      const sg = await db.studentGuardian.findMany({
        where: { schoolId, student: { sectionId: session.sectionId } },
        select: { guardian: { select: { userId: true } } },
      })
      for (const g of sg) {
        if (g.guardian.userId) userIds.add(g.guardian.userId)
      }
    }
  }

  return {
    session: {
      id: session.id,
      schoolId: session.schoolId,
      title: session.title,
      sectionId: session.sectionId,
      teacherFullName,
      scheduledStart: session.scheduledStart,
      routePath,
    },
    lang,
    userIds: Array.from(userIds),
  }
}

async function dispatch(
  schoolId: string,
  sessionId: string,
  kind: ConferenceEventKind,
  type:
    | "live_class_scheduled"
    | "live_class_starting_soon"
    | "live_class_started"
    | "live_class_cancelled"
    | "live_class_recording_ready",
  extraVars: Record<string, string> = {}
): Promise<{ created: number }> {
  try {
    const resolved = await loadSession(schoolId, sessionId)
    if (!resolved || resolved.userIds.length === 0) return { created: 0 }
    const { session, lang, userIds } = resolved
    const template = TEMPLATES[kind][lang]
    const vars: Record<string, string> = {
      title: session.title,
      teacher: session.teacherFullName,
      when: formatWhen(session.scheduledStart, lang),
      ...extraVars,
    }
    const title = render(template.title, vars)
    const body = render(template.body, vars)
    // "The class is live" is the one notification whose whole point is to get
    // the reader INTO the room, so it links straight there and skips the detail
    // page's second Join click.
    //
    // Only that one. `startingSoon` fires 5–20 minutes BEFORE the start, and
    // join-core rejects a non-HOST on a `scheduled` session with
    // LIVE_CLASS_INVALID_STATE — a student following a /room link early would
    // hit an error page instead of a waiting room. `scheduled`, `cancelled` and
    // `recordingReady` all describe the session rather than an open room, so the
    // detail page is their correct destination too.
    const url =
      kind === "started" ? `${session.routePath}/room` : session.routePath

    // Route through the shared notification hub so live-class notifications get
    // per-user channel-preference filtering, the email channel, `expiresAt`,
    // and translation `prewarm`. The hub resolves nothing here — we pass our own
    // audience (teacher + section roster + guardians) via `targetUserIds`. The
    // metadata key MUST be `url` (not `route`): that is what the bell navigates
    // to and what the email channel absolutifies at render time.
    const { created } = await dispatchNotificationsToAudience({
      schoolId,
      type,
      title,
      body,
      lang,
      priority:
        kind === "started" || kind === "startingSoon" ? "high" : "normal",
      // Push is requested now that mobile can actually act on a live class
      // (/api/mobile/live/:id/join). Delivery still depends on the user
      // having a registered device and on the push worker running; the hub
      // filters per-user channel preferences either way, so a school with no
      // mobile users simply never sends one.
      channels: ["in_app", "email", "push"],
      metadata: {
        kind,
        sessionId,
        sectionId: session.sectionId,
        url,
        // The push worker reads `deep_link`, not `url` (push-fcm.ts) — without
        // it a push notification arrives and taps nowhere. A RELATIVE route is
        // what a mobile client wants anyway: it routes in-app rather than
        // opening a browser at some canonical host.
        deep_link: url,
      },
      targetUserIds: userIds,
    })
    return { created }
  } catch (err) {
    console.error("[live-class] notifyClass failed", {
      schoolId,
      sessionId,
      kind,
      err: err instanceof Error ? err.message : err,
    })
    return { created: 0 }
  }
}

export const notifyClassScheduled = (schoolId: string, sessionId: string) =>
  dispatch(schoolId, sessionId, "scheduled", "live_class_scheduled")

export const notifyClassStartingSoon = (schoolId: string, sessionId: string) =>
  dispatch(schoolId, sessionId, "startingSoon", "live_class_starting_soon")

export const notifyClassStarted = (schoolId: string, sessionId: string) =>
  dispatch(schoolId, sessionId, "started", "live_class_started")

export const notifyClassCancelled = (
  schoolId: string,
  sessionId: string,
  reason?: string
) =>
  dispatch(schoolId, sessionId, "cancelled", "live_class_cancelled", {
    reason: reason ?? "",
  })

export const notifyClassRecordingReady = (
  schoolId: string,
  sessionId: string
) =>
  dispatch(schoolId, sessionId, "recordingReady", "live_class_recording_ready")
