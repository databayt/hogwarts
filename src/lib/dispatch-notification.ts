// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@prisma/client"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { renderTemplate } from "@/lib/notifications/render-template"
import { prewarm } from "@/components/translation/prewarm"

// Default expiration: 30 days
const NOTIFICATION_EXPIRATION_DAYS = 30

/**
 * System-level notification creation (no session required).
 * For use by cron jobs, internal triggers, and cross-module pipelines.
 */
export async function dispatchNotification(params: {
  schoolId: string
  userId: string
  type: NotificationType
  title: string
  body: string
  lang?: string
  priority?: NotificationPriority
  actorId?: string
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
}): Promise<string | null> {
  try {
    // Keep only the channels the user has NOT disabled for this type. Crucially
    // this is per-channel: a user who turned OFF in-app but kept email/WhatsApp
    // must still receive those — the old code gated the WHOLE notification on
    // the in_app preference, silently dropping every channel. If the user
    // disabled every requested channel, there is nothing to send.
    const requestedChannels = params.channels ?? ["in_app"]
    const enabledChannels: NotificationChannel[] = []
    for (const ch of requestedChannels) {
      if (await shouldSendNotification(params.userId, params.type, ch)) {
        enabledChannels.push(ch)
      }
    }
    if (enabledChannels.length === 0) return null

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRATION_DAYS)

    const notification = await db.notification.create({
      data: {
        schoolId: params.schoolId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        lang: params.lang ?? "ar",
        priority: params.priority ?? "normal",
        actorId: params.actorId ?? null,
        channels: enabledChannels,
        metadata:
          (params.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
        expiresAt,
      },
    })

    // Warm the other-language cache (fire-and-forget — this lib runs from
    // actions, crons AND webhooks, so after() isn't always available). One
    // call per dispatch: title/body are shared across recipients.
    void prewarm(
      "Notification",
      { title: params.title, body: params.body },
      { schoolId: params.schoolId }
    ).catch(() => {})

    return notification.id
  } catch (error) {
    console.error("[dispatchNotification] Error:", error)
    return null
  }
}

/**
 * Resolve a school's notification language ("ar" | "en") from its
 * preferredLanguage. For system-level senders (webhooks, crons) that must not
 * hardcode a language — a notification's text + `lang` should follow the
 * school's preference, not a fixed default.
 */
export async function resolveSchoolLang(
  schoolId: string
): Promise<"ar" | "en"> {
  const school = await db.school.findFirst({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  return school?.preferredLanguage === "en" ? "en" : "ar"
}

/**
 * Bulk variant for audience targeting.
 * Resolves users based on scope and creates notifications for each.
 */
export async function dispatchNotificationsToAudience(params: {
  schoolId: string
  type: NotificationType
  title: string
  body: string
  lang?: string
  priority?: NotificationPriority
  actorId?: string
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
  targetScope: "school" | "class" | "role"
  targetClassId?: string
  targetRole?: string
}): Promise<{ created: number }> {
  try {
    const userIds = await resolveTargetUsers(
      params.schoolId,
      params.targetScope,
      params.targetClassId,
      params.targetRole
    )

    if (userIds.length === 0) return { created: 0 }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRATION_DAYS)

    // Filter out users who have disabled this notification type
    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        type: params.type,
        channel: "in_app",
        enabled: false,
      },
      select: { userId: true },
    })
    const disabledUserIds = new Set(preferences.map((p) => p.userId))
    const eligibleUserIds = userIds.filter((id) => !disabledUserIds.has(id))

    if (eligibleUserIds.length === 0) return { created: 0 }

    const result = await db.notification.createMany({
      data: eligibleUserIds.map((userId) => ({
        schoolId: params.schoolId,
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        lang: params.lang ?? "ar",
        priority: params.priority ?? "normal",
        actorId: params.actorId ?? null,
        channels: params.channels ?? ["in_app"],
        metadata:
          (params.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
        expiresAt,
      })),
      skipDuplicates: true,
    })

    // One shared title/body for the whole audience — warm it once.
    void prewarm(
      "Notification",
      { title: params.title, body: params.body },
      { schoolId: params.schoolId }
    ).catch(() => {})

    return { created: result.count }
  } catch (error) {
    console.error("[dispatchNotificationsToAudience] Error:", error)
    return { created: 0 }
  }
}

/**
 * Resolve user IDs based on targeting scope
 */
async function resolveTargetUsers(
  schoolId: string,
  scope: "school" | "class" | "role",
  classId?: string,
  role?: string
): Promise<string[]> {
  switch (scope) {
    case "school": {
      const users = await db.user.findMany({
        where: { schoolId },
        select: { id: true },
      })
      return users.map((u) => u.id)
    }
    case "class": {
      if (!classId) return []
      // Resolve User IDs via Student/Teacher relations (not their model IDs)
      const classData = await db.class.findUnique({
        where: { id: classId },
        select: {
          teacher: { select: { userId: true } },
          studentClasses: {
            select: { student: { select: { userId: true } } },
          },
        },
      })
      if (!classData) return []
      const ids: string[] = classData.studentClasses
        .map((sc) => sc.student.userId)
        .filter((id): id is string => id !== null)
      if (classData.teacher?.userId) ids.push(classData.teacher.userId)
      return [...new Set(ids)]
    }
    case "role": {
      if (!role) return []
      const users = await db.user.findMany({
        where: { schoolId, role: role as any },
        select: { id: true },
      })
      return users.map((u) => u.id)
    }
    default:
      return []
  }
}

/**
 * Check if a notification should be sent based on user preferences
 */
async function shouldSendNotification(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<boolean> {
  const preference = await db.notificationPreference.findUnique({
    where: {
      userId_type_channel: {
        userId,
        type,
        channel,
      },
    },
    select: { enabled: true },
  })
  // Default to enabled if no preference exists
  return preference?.enabled ?? true
}

/**
 * Channel-level preference lookup for `dispatchTemplated`.
 *
 * Returns `enabled` (default true when no row exists) plus the optional
 * quiet-hour window so the caller can drop the channel if `now` is
 * inside the user's silent window. Quiet hours are tracked per
 * (userId, type, channel) in the DB even though today's UI sets the
 * same value across all channels for a given user — a row-level model
 * leaves room for "always email me at 3am about fee_overdue" without a
 * schema change.
 */
async function getChannelPreference(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel
): Promise<{
  enabled: boolean
  quietHoursStart: number | null
  quietHoursEnd: number | null
}> {
  const preference = await db.notificationPreference.findUnique({
    where: {
      userId_type_channel: { userId, type, channel },
    },
    select: {
      enabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
    },
  })
  return {
    enabled: preference?.enabled ?? true,
    quietHoursStart: preference?.quietHoursStart ?? null,
    quietHoursEnd: preference?.quietHoursEnd ?? null,
  }
}

/**
 * Is the current local hour inside the [start, end) quiet window?
 *
 * Handles the common wraparound case (e.g. 22:00 → 8:00 spans midnight)
 * by treating start > end as the union of [start, 24) ∪ [0, end). When
 * start === end we treat that as "no quiet hours" (matches the form's
 * `quietHoursEnabled: false` path).
 *
 * Exported for the test suite; not part of the dispatcher's public API.
 */
export function isInQuietHours(
  nowHour: number,
  start: number | null,
  end: number | null
): boolean {
  if (start === null || end === null) return false
  if (start === end) return false
  if (start < end) {
    return nowHour >= start && nowHour < end
  }
  // Wraparound: 22 → 8 means [22, 24) ∪ [0, 8).
  return nowHour >= start || nowHour < end
}

/**
 * Look up a NotificationTemplate by (schoolId, type, channel, lang) and
 * fall back to the global template (schoolId: null) if no per-school row
 * exists. Returns null if neither is configured.
 */
async function resolveTemplate(
  schoolId: string,
  type: NotificationType,
  channel: NotificationChannel,
  lang: string
) {
  // School-specific first, then global. We avoid the composite-unique
  // findUnique selector because `schoolId IS NULL` isn't expressible via
  // Prisma's null-rejected `findUnique` selectors.
  const perSchool = await db.notificationTemplate.findFirst({
    where: { schoolId, type, channel, lang, active: true },
    select: {
      title: true,
      body: true,
      emailSubject: true,
      emailBody: true,
    },
  })
  if (perSchool) return perSchool

  return db.notificationTemplate.findFirst({
    where: { schoolId: null, type, channel, lang, active: true },
    select: {
      title: true,
      body: true,
      emailSubject: true,
      emailBody: true,
    },
  })
}

/**
 * Resolve the recipient's preferred language for notification rendering.
 *
 * Today: school-level only. The User model has no `preferredLanguage`
 * column; per-user override is Phase 5+ (would need a schema migration).
 * Schools that haven't set their preferred language fall back to "ar"
 * (Hogwarts default — see CLAUDE.md "Languages: Arabic (RTL default)").
 *
 * Note: the `userId` arg is kept in the signature so the Phase 5
 * per-user-override change is a single-function edit rather than a
 * cross-cutting refactor.
 */
async function resolveRecipientLang(
  _userId: string,
  schoolId: string
): Promise<string> {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  return school?.preferredLanguage ?? "ar"
}

/**
 * Template-driven multi-channel dispatch.
 *
 * Distinct from `dispatchNotification` (legacy, takes pre-rendered strings)
 * because the new contract is "give me (type, metadata, recipient); I
 * resolve language, look up templates per channel, check per-channel
 * preference, and dispatch."
 *
 * Caller responsibility: `metadata` keys MUST match the `{{placeholders}}`
 * in the seeded NotificationTemplate rows (see
 * `prisma/seeds/notification-templates.ts`).
 *
 * Returns the created in-app `Notification.id` (or `null` if the in-app
 * channel was filtered out / no template found). Email/whatsapp/push
 * delivery is handled by their respective channel processors which read
 * `Notification.channels`.
 */
export async function dispatchTemplated(params: {
  schoolId: string
  userId: string
  type: NotificationType
  metadata?: Record<string, unknown>
  /** Which delivery channels to attempt. Defaults to in_app only. */
  channels?: NotificationChannel[]
  /** Override the recipient's resolved language (useful for tests). */
  lang?: string
  priority?: NotificationPriority
  actorId?: string
}): Promise<string | null> {
  try {
    const lang =
      params.lang ??
      (await resolveRecipientLang(params.userId, params.schoolId))
    const channels = params.channels ?? ["in_app"]

    // Per-channel preference + template lookup. Any channel that's
    // disabled OR missing a template is dropped from the row's `channels`
    // array; the in-app Notification row is only created if at least
    // `in_app` survives the filter.
    const enabled: NotificationChannel[] = []
    let inAppRendered: { title: string; body: string } | null = null
    // Use the recipient's local hour for the quiet-hour check. Today
    // we don't track per-user timezones, so we use server-local. When
    // per-user timezone lands (Phase 5+), feed it in here.
    const nowHour = new Date().getHours()

    for (const channel of channels) {
      const pref = await getChannelPreference(
        params.userId,
        params.type,
        channel
      )
      if (!pref.enabled) continue

      // Quiet hours apply to *outbound* delivery channels only — the
      // in-app bell is silent until the user opens it, so suppressing
      // it just delays visibility for no UX benefit.
      if (
        channel !== "in_app" &&
        isInQuietHours(nowHour, pref.quietHoursStart, pref.quietHoursEnd)
      ) {
        continue
      }

      const tpl = await resolveTemplate(
        params.schoolId,
        params.type,
        channel,
        lang
      )
      if (!tpl) {
        // Surface as a warning so the gap shows up in dev logs without
        // silently dropping the notification.
        console.warn(
          `[dispatchTemplated] No template for (${params.type}, ${channel}, ${lang}); skipping channel`
        )
        continue
      }

      enabled.push(channel)

      if (channel === "in_app") {
        inAppRendered = {
          title: renderTemplate(tpl.title, params.metadata),
          body: renderTemplate(tpl.body, params.metadata),
        }
      }
    }

    if (!inAppRendered || !enabled.includes("in_app")) {
      // We currently require in_app to be the row anchor. Non-in_app-only
      // delivery would need a separate row schema; not in Phase 2a scope.
      return null
    }

    return dispatchNotification({
      schoolId: params.schoolId,
      userId: params.userId,
      type: params.type,
      title: inAppRendered.title,
      body: inAppRendered.body,
      lang,
      priority: params.priority,
      actorId: params.actorId,
      channels: enabled,
      metadata: params.metadata,
    })
  } catch (error) {
    console.error("[dispatchTemplated] Error:", error)
    return null
  }
}
