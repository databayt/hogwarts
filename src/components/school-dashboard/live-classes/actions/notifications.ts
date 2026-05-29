// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live-class → student/guardian notification helper.
//
// NOT a "use server" action — invoked internally from sessions.ts and the
// webhook handler. Best-effort: failures are logged but never thrown.

import { db } from "@/lib/db"

type LiveClassEventKind =
  | "scheduled"
  | "startingSoon"
  | "started"
  | "cancelled"
  | "recordingReady"

// Minimal lang-aware templates. Kept inline to avoid coupling to the
// dictionary loader at module init time (so cron + webhook stay cheap).
const TEMPLATES: Record<
  LiveClassEventKind,
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
  const session = await db.liveClassSession.findFirst({
    where: { id: sessionId, schoolId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      sectionId: true,
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
  const routePath = `/live-classes/${session.id}`

  const userIds = new Set<string>()
  if (session.teacher.userId) userIds.add(session.teacher.userId)

  if (session.sectionId) {
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
  kind: LiveClassEventKind,
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
    try {
      await db.notification.createMany({
        data: userIds.map((userId) => ({
          schoolId,
          userId,
          type,
          priority:
            kind === "started" || kind === "startingSoon"
              ? ("high" as const)
              : ("normal" as const),
          title,
          body,
          lang,
          metadata: {
            kind,
            sessionId,
            sectionId: session.sectionId,
            route: session.routePath,
          },
        })),
        skipDuplicates: true,
      })
      return { created: userIds.length }
    } catch (err) {
      console.error("[live-class] notification createMany failed", {
        schoolId,
        sessionId,
        kind,
        err: err instanceof Error ? err.message : err,
      })
      return { created: 0 }
    }
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
