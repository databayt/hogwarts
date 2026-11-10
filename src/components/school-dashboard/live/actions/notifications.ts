// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live-class → student/guardian notification helper.
//
// NOT a "use server" action — invoked internally from sessions.ts and the
// webhook handler. Best-effort: failures are logged but never thrown.

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"

import { DEFAULT_SCHOOL_TZ } from "../day-window"
import { ON_ROSTER } from "../roster"

type LiveEventKind =
  | "scheduled"
  | "startingSoon"
  | "started"
  | "cancelled"
  | "recordingReady"

// Minimal lang-aware templates. Kept inline to avoid coupling to the
// dictionary loader at module init time (so cron + webhook stay cheap).
//
// `startingSoon` is handled separately below (STARTING_SOON_TITLE /
// STARTING_SOON_BODY) because its body varies with the actual lead time —
// every other kind has a fixed body.
const TEMPLATES: Record<
  Exclude<LiveEventKind, "startingSoon">,
  Record<"ar" | "en", { title: string; body: string }>
> = {
  scheduled: {
    ar: {
      title: "تمت جدولة حصة مباشرة",
      body: "{title} مع {teacher} في {when}",
    },
    en: {
      title: "Live class scheduled",
      body: "{title} with {teacher} on {when}",
    },
  },
  started: {
    ar: { title: "الحصة المباشرة بدأت الآن", body: "انضم الآن إلى {title}" },
    en: { title: "Live class is now live", body: "Join {title} now" },
  },
  cancelled: {
    ar: { title: "أُلغيت الحصة المباشرة", body: "{title} — {reason}" },
    en: { title: "Live class cancelled", body: "{title} — {reason}" },
  },
  recordingReady: {
    ar: { title: "تسجيل الحصة جاهز", body: "تسجيل {title} متاح للمشاهدة" },
    en: {
      title: "Recording ready",
      body: "Recording for {title} is now available",
    },
  },
}

const STARTING_SOON_TITLE: Record<"ar" | "en", string> = {
  ar: "حصة مباشرة تبدأ قريباً",
  en: "Live class starting soon",
}

/**
 * `startingSoon` fires with a school-configured lead (1–60 min,
 * `School.conferenceReminderLeadMinutes`), so the body must say the actual
 * minute count rather than a hardcoded "10 minutes" — and Arabic minute
 * counts are NOT one word with a number bolted on: "دقيقة" (1), "دقيقتين"
 * (2, dual — no digit), "{n} دقائق" (3–10, few) and "{n} دقيقة" (11+, many
 * and other) are four different constructions. Keyed by
 * `Intl.PluralRules("ar"|"en").select(lead)`. `zero` is included for
 * completeness (Arabic has the category) even though the cron's min-1
 * rounding never produces it.
 */
const STARTING_SOON_BODY: Record<
  "ar" | "en",
  Record<Intl.LDMLPluralRule, string>
> = {
  ar: {
    zero: "{title} تبدأ خلال {lead} دقيقة",
    one: "{title} تبدأ خلال دقيقة",
    two: "{title} تبدأ خلال دقيقتين",
    few: "{title} تبدأ خلال {lead} دقائق",
    many: "{title} تبدأ خلال {lead} دقيقة",
    other: "{title} تبدأ خلال {lead} دقيقة",
  },
  en: {
    zero: "{title} starts in {lead} minutes",
    one: "{title} starts in {lead} minute",
    two: "{title} starts in {lead} minutes",
    few: "{title} starts in {lead} minutes",
    many: "{title} starts in {lead} minutes",
    other: "{title} starts in {lead} minutes",
  },
}

const arLeadPluralRules = new Intl.PluralRules("ar")
const enLeadPluralRules = new Intl.PluralRules("en")

/**
 * The teacher's own "starting soon". A timetable class is a classroom that is
 * there at its time — the teacher walks in like the students, nobody starts
 * it — so the sentence is "your class, in N minutes — tap to join".
 */
const TEACHER_SOON_TITLE: Record<"ar" | "en", string> = {
  ar: "حصتك المباشرة تبدأ قريباً",
  en: "Your live class starts soon",
}
const TEACHER_SOON_BODY: Record<
  "ar" | "en",
  Record<Intl.LDMLPluralRule, string>
> = {
  ar: {
    zero: "{title} خلال {lead} دقيقة — اضغط للانضمام",
    one: "{title} خلال دقيقة — اضغط للانضمام",
    two: "{title} خلال دقيقتين — اضغط للانضمام",
    few: "{title} خلال {lead} دقائق — اضغط للانضمام",
    many: "{title} خلال {lead} دقيقة — اضغط للانضمام",
    other: "{title} خلال {lead} دقيقة — اضغط للانضمام",
  },
  en: {
    zero: "{title} in {lead} minutes — tap to join",
    one: "{title} in {lead} minute — tap to join",
    two: "{title} in {lead} minutes — tap to join",
    few: "{title} in {lead} minutes — tap to join",
    many: "{title} in {lead} minutes — tap to join",
    other: "{title} in {lead} minutes — tap to join",
  },
}

function leadPluralCategory(lang: "ar" | "en", n: number): Intl.LDMLPluralRule {
  return (lang === "ar" ? arLeadPluralRules : enLeadPluralRules).select(n)
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

/**
 * The class's start in the SCHOOL's zone. Without `timeZone` the server's zone
 * applied — UTC on the container — and a 18:00 Khartoum class was announced
 * as 16:00.
 */
function formatWhen(d: Date, lang: "ar" | "en", timeZone: string): string {
  try {
    return d.toLocaleString(lang === "ar" ? "ar-AE" : "en-AE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
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
  /** The school's IANA zone — every time in a notice is school time. */
  timeZone: string
  routePath: string
  /** The slot's join link, when the class is anchored to a timetable slot. */
  joinPath: string | null
}

async function loadSession(
  schoolId: string,
  sessionId: string
): Promise<{
  session: ResolvedSession
  lang: "ar" | "en"
  userIds: string[]
  /** The host's User.id — left out of the "class is live" notice. */
  teacherUserId: string | null
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
      timetableId: true,
      teacher: {
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          userId: true,
        },
      },
      school: { select: { preferredLanguage: true, timezone: true } },
    },
  })
  if (!session) return null

  const lang = pickLang(session.school.preferredLanguage)
  // A notification is a UI label — the school's short name.
  const teacherFullName = displayName(
    session.teacher,
    await schoolNameDisplay(schoolId)
  )
  const routePath = `/live/${session.id}`
  // The join link resolves today's room at tap time and holds an early
  // arrival on a page that opens itself at the bell — the right target for a
  // "starting soon" or "started" notice on a timetable class.
  const joinPath = session.timetableId
    ? `/live/join/${session.timetableId}`
    : null

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
    // Section audience: every student placed in the section.
    // `id` (Student.id) is kept alongside `userId` because the guardian
    // lookup below joins on StudentGuardian.studentId, which references
    // Student.id — NOT User.id.
    const students = await db.student.findMany({
      where: {
        schoolId,
        userId: { not: null },
        sectionId: session.sectionId,
        ...ON_ROSTER,
      },
      select: { id: true, userId: true },
    })
    for (const s of students) {
      if (s.userId) userIds.add(s.userId)
    }
    // Guardians follow the SAME student set (by Student.id).
    const studentIds = students.map((s) => s.id)
    if (studentIds.length > 0) {
      const sg = await db.studentGuardian.findMany({
        where: { schoolId, studentId: { in: studentIds } },
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
      timeZone: session.school.timezone || DEFAULT_SCHOOL_TZ,
      routePath,
      joinPath,
    },
    lang,
    userIds: Array.from(userIds),
    teacherUserId: session.teacher.userId ?? null,
  }
}

/**
 * The channels of the two notices that mean "go in now" — "starting soon" and
 * "the class is live". No email: the mail queue is drained by a cron a tick
 * later, so a ten-minute reminder arrived after the bell, and at one mail per
 * class per child it was a dozen a day into a parent's inbox. The bell and a
 * phone push are the channels that are on time. Scheduled, cancelled,
 * recording-ready and the admin's morning digest keep their email.
 */
const NOW_CHANNELS: Array<"in_app" | "push"> = ["in_app", "push"]

async function dispatch(
  schoolId: string,
  sessionId: string,
  kind: LiveEventKind,
  type:
    | "live_class_scheduled"
    | "live_class_starting_soon"
    | "live_class_started"
    | "live_class_cancelled"
    | "live_class_recording_ready",
  extraVars: Record<string, string> = {},
  // Only meaningful for `startingSoon` — the actual minutes-to-start the
  // cron computed, used to pick both the {lead} substitution and the
  // Arabic/English plural form of the body.
  leadMinutes?: number,
  // Only meaningful for `started` — who opened the room, when the caller
  // knows. They are in it; everyone else is told.
  openedByUserId?: string | null
): Promise<{ created: number }> {
  try {
    const resolved = await loadSession(schoolId, sessionId)
    if (!resolved || resolved.userIds.length === 0) return { created: 0 }
    const { session, lang, teacherUserId } = resolved
    // "The class is live" is news to everyone except whoever just opened the
    // room — they are in it. That used to mean "except the teacher", from
    // when only a teacher could start a class; in a timetable class a student
    // may be first in, and the teacher is then exactly who needs telling.
    // "Starting soon" reaches the teacher as their own notice (below).
    const userIds =
      kind === "started"
        ? resolved.userIds.filter((id) => id !== openedByUserId)
        : kind === "startingSoon" && teacherUserId
          ? resolved.userIds.filter((id) => id !== teacherUserId)
          : resolved.userIds
    let teacherCreated = 0
    if (kind === "startingSoon" && teacherUserId) {
      const lead = leadMinutes ?? 10
      const r = await dispatchNotificationsToAudience({
        schoolId,
        type,
        title: TEACHER_SOON_TITLE[lang],
        body: render(TEACHER_SOON_BODY[lang][leadPluralCategory(lang, lead)], {
          title: session.title,
          lead: String(lead),
        }),
        lang,
        priority: "high",
        channels: NOW_CHANNELS,
        metadata: {
          kind: "startingSoonHost",
          sessionId,
          sectionId: session.sectionId,
          // The join link starts the class for its host inside the window.
          url: session.joinPath ?? session.routePath,
          deep_link: session.routePath,
        },
        targetUserIds: [teacherUserId],
      })
      teacherCreated = r.created
    }
    if (userIds.length === 0) return { created: teacherCreated }
    const vars: Record<string, string> = {
      title: session.title,
      teacher: session.teacherFullName,
      when: formatWhen(session.scheduledStart, lang, session.timeZone),
      ...extraVars,
    }
    let title: string
    let body: string
    if (kind === "startingSoon") {
      const lead = leadMinutes ?? 10
      const category = leadPluralCategory(lang, lead)
      title = render(STARTING_SOON_TITLE[lang], vars)
      body = render(STARTING_SOON_BODY[lang][category], {
        ...vars,
        lead: String(lead),
      })
    } else {
      const template = TEMPLATES[kind][lang]
      title = render(template.title, vars)
      body = render(template.body, vars)
    }
    // The DETAIL page for the notices that describe a session (`scheduled`,
    // `cancelled`, `recordingReady`); the room for "the class is live". That is
    // the push `deep_link`, which the native apps route on.
    const url =
      kind === "started" ? `${session.routePath}/room` : session.routePath
    // On the web, the two notices that mean "go in now" open the slot's JOIN
    // LINK (`joinPath`). A reminder can arrive before the window opens, and
    // the join link answers that with a waiting page that lets the reader in
    // by itself at the opening instant — a bare room URL would not.
    const webUrl =
      (kind === "started" || kind === "startingSoon") && session.joinPath
        ? session.joinPath
        : url

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
      // having a registered device; the hub filters per-user channel
      // preferences either way.
      channels:
        kind === "started" || kind === "startingSoon"
          ? NOW_CHANNELS
          : ["in_app", "email", "push"],
      metadata: {
        kind,
        sessionId,
        sectionId: session.sectionId,
        url: webUrl,
        // The push worker reads `deep_link`, not `url` (push-fcm.ts) — without
        // it a push notification arrives and taps nowhere. A RELATIVE route is
        // what a mobile client wants anyway: it routes in-app rather than
        // opening a browser at some canonical host.
        deep_link: url,
      },
      targetUserIds: userIds,
    })
    return { created: created + teacherCreated }
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

export const notifyClassStartingSoon = (
  schoolId: string,
  sessionId: string,
  /** Minutes until start, rounded by the caller (min 1). Defaults to the
   * school-setting default (10) for any caller that doesn't have one handy. */
  leadMinutes = 10
) =>
  dispatch(
    schoolId,
    sessionId,
    "startingSoon",
    "live_class_starting_soon",
    {},
    leadMinutes
  )

export const notifyClassStarted = (
  schoolId: string,
  sessionId: string,
  /** Who opened the room, if known — the one person not told. */
  openedByUserId?: string | null
) =>
  dispatch(
    schoolId,
    sessionId,
    "started",
    "live_class_started",
    {},
    undefined,
    openedByUserId
  )

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
