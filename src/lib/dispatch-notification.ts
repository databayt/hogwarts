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

// Default expiration: 30 days (already declared below — kept here for reference)
// Base URL used when resolving absolute URLs for email action buttons.
// Override with NEXT_PUBLIC_BASE_URL in .env if your root domain differs.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://ed.databayt.org"

/**
 * Resolve an absolute action URL for a given school and path.
 *
 * BUG-4 fix: metadata.url values stored as relative paths (e.g. "/finance/fees")
 * rendered blank action buttons in emails because the email template only renders
 * an <a> for http(s) URLs. This helper converts them to absolute URLs using:
 *   1. school.domain (custom domain), if set
 *   2. "${subdomain}.databayt.org" (standard subdomain routing)
 *   3. BASE_URL (root host, for system-level notifications without a school subdomain)
 *
 * @param path - A relative path like "/finance/fees" or an already-absolute URL.
 * @param schoolSubdomain - The school's subdomain slug (e.g. "demo").
 * @param customDomain - The school's custom domain override, if any.
 * @returns An absolute https URL.
 */
export function resolveActionUrl(
  path: string,
  schoolSubdomain?: string | null,
  customDomain?: string | null
): string {
  // Already absolute — return as-is.
  if (/^https?:\/\//i.test(path)) return path

  if (customDomain && customDomain.trim()) {
    return `https://${customDomain.trim()}${path}`
  }

  if (schoolSubdomain && schoolSubdomain.trim()) {
    const isProd = process.env.NODE_ENV === "production"
    const host = isProd
      ? `${schoolSubdomain.trim()}.databayt.org`
      : `${schoolSubdomain.trim()}.localhost:3000`
    const protocol = isProd ? "https" : "http"
    return `${protocol}://${host}${path}`
  }

  return `${BASE_URL}${path}`
}

/**
 * Look up a school's subdomain + custom domain and resolve the action URL in
 * one DB call. Cached locally per (schoolId, path) within the same request —
 * callers dispatch many notifications per run.
 */
const _schoolSubdomainCache = new Map<
  string,
  { subdomain: string; domain: string | null }
>()

async function resolveActionUrlForSchool(
  schoolId: string,
  path: string
): Promise<string> {
  if (/^https?:\/\//i.test(path)) return path

  let info = _schoolSubdomainCache.get(schoolId)
  if (!info) {
    // School.domain holds the subdomain label (e.g. "hogwarts"). There is no
    // separate custom-domain column yet, so customDomain stays null.
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { domain: true },
    })
    info = {
      subdomain: school?.domain ?? "",
      domain: null,
    }
    _schoolSubdomainCache.set(schoolId, info)
  }

  return resolveActionUrl(path, info.subdomain, info.domain)
}

/**
 * Patch any `url` key inside a metadata object to be an absolute URL.
 * Returns a new object (does not mutate the original).
 */
async function absolutifyMetadataUrl(
  metadata: Record<string, unknown> | undefined,
  schoolId: string
): Promise<Record<string, unknown> | undefined> {
  if (!metadata) return metadata
  const rawUrl = metadata.url
  if (typeof rawUrl !== "string") return metadata
  const absolute = await resolveActionUrlForSchool(schoolId, rawUrl)
  return { ...metadata, url: absolute }
}

/**
 * System-level notification creation (no session required).
 * For use by cron jobs, internal triggers, and cross-module pipelines.
 */
export async function dispatchNotification(params: {
  schoolId: string
  // Optional: guest applicants have no userId — pair with `directEmail` to
  // deliver the email channel only (no in-app row is created).
  userId?: string
  type: NotificationType
  title: string
  body: string
  lang?: string
  priority?: NotificationPriority
  actorId?: string
  channels?: NotificationChannel[]
  metadata?: Record<string, unknown>
  /**
   * BUG-3 enabler: when the target user has no userId (e.g. a guest applicant),
   * callers may pass the applicant's raw email address here. The in_app channel
   * is skipped (no userId → no notification row), but the email channel is
   * delivered directly to this address via sendRawEmail / sendNotificationEmail.
   *
   * The admission agent passes `directEmail: application.email` at call sites
   * where application.userId may be null.
   */
  directEmail?: string
}): Promise<string | null> {
  try {
    // BUG-4: absolutify any relative `url` in metadata so email action buttons
    // render correctly (the email template only renders <a> for http(s) URLs).
    const resolvedMetadata = await absolutifyMetadataUrl(
      params.metadata,
      params.schoolId
    )

    // BUG-3: directEmail path — when there is no userId (guest applicant) we
    // cannot create a Notification row (userId is non-nullable). Send the email
    // channel directly to the provided address and return null (no row id).
    if (!params.userId && params.directEmail) {
      const requestedChannels = params.channels ?? ["in_app"]
      if (requestedChannels.includes("email")) {
        try {
          const { sendNotificationEmail } =
            await import("@/components/school-dashboard/notifications/email-service")
          await sendNotificationEmail({
            notificationId: `direct-${Date.now()}`,
            to: params.directEmail,
            locale: (params.lang === "en" ? "en" : "ar") as "ar" | "en",
            type: params.type,
            priority: params.priority ?? "normal",
            title: params.title,
            body: params.body,
            metadata: resolvedMetadata as Record<string, unknown> | null,
          })
        } catch (emailErr) {
          console.error(
            "[dispatchNotification] directEmail send failed:",
            emailErr
          )
        }
      }
      return null
    }

    // Past the directEmail branch a userId is required to create the in-app
    // notification row. No userId and no directEmail → nothing to deliver.
    if (!params.userId) return null
    const userId = params.userId

    // Keep only the channels the user has NOT disabled for this type. Crucially
    // this is per-channel: a user who turned OFF in-app but kept email/WhatsApp
    // must still receive those — the old code gated the WHOLE notification on
    // the in_app preference, silently dropping every channel. If the user
    // disabled every requested channel, there is nothing to send.
    const requestedChannels = params.channels ?? ["in_app"]
    const enabledChannels: NotificationChannel[] = []
    for (const ch of requestedChannels) {
      if (await shouldSendNotification(userId, params.type, ch)) {
        enabledChannels.push(ch)
      }
    }
    if (enabledChannels.length === 0) return null

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRATION_DAYS)

    const notification = await db.notification.create({
      data: {
        schoolId: params.schoolId,
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        lang: params.lang ?? "ar",
        priority: params.priority ?? "normal",
        actorId: params.actorId ?? null,
        channels: enabledChannels,
        metadata:
          (resolvedMetadata as unknown as Prisma.InputJsonValue) ?? undefined,
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
 *
 * BUG-5 fix: previously only checked the `in_app` preference and applied it as
 * an all-or-nothing gate. Now performs per-channel preference checks for each
 * recipient (matching the single-dispatch path's behaviour). A user who disabled
 * `in_app` but kept `email` still receives the email channel; a user who disabled
 * all requested channels is skipped entirely.
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
  targetScope?: "school" | "class" | "role"
  targetClassId?: string
  targetRole?: string
  /** BUG-7/BUG-10 support: pass multiple roles to notify (e.g. ["ADMIN","STAFF"]). */
  targetRoles?: string[]
  /**
   * Explicit recipient list. When provided (non-empty), scope/role resolution
   * is skipped and these userIds are used directly — every other guarantee of
   * this function still applies (per-user channel-preference filtering,
   * `channels` + `expiresAt`, absolute `metadata.url`, batched insert, one
   * `prewarm`). Use this for blocks that resolve their own audience (e.g. the
   * conference block fans out by section roster + guardians).
   */
  targetUserIds?: string[]
}): Promise<{ created: number }> {
  try {
    const requestedChannels = params.channels ?? ["in_app"]

    // BUG-4: resolve relative URL in metadata to absolute before storing.
    const resolvedMetadata = await absolutifyMetadataUrl(
      params.metadata,
      params.schoolId
    )

    // Resolve target user IDs. An explicit `targetUserIds` list short-circuits
    // scope/role resolution (the caller already knows its audience); otherwise
    // support targetRoles (multi-role) as well as the legacy single targetRole.
    let userIds: string[]
    if (params.targetUserIds && params.targetUserIds.length > 0) {
      userIds = [...new Set(params.targetUserIds)]
    } else if (!params.targetScope) {
      // No explicit recipients and no scope — nothing to resolve.
      return { created: 0 }
    } else {
      const rolesToQuery =
        params.targetRoles ??
        (params.targetRole ? [params.targetRole] : undefined)
      if (rolesToQuery && rolesToQuery.length > 1) {
        const users = await db.user.findMany({
          where: {
            schoolId: params.schoolId,
            role: { in: rolesToQuery as any[] },
          },
          select: { id: true },
        })
        userIds = [...new Set(users.map((u) => u.id))]
      } else {
        userIds = await resolveTargetUsers(
          params.schoolId,
          params.targetScope,
          params.targetClassId,
          rolesToQuery?.[0] ?? params.targetRole
        )
      }
    }

    if (userIds.length === 0) return { created: 0 }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + NOTIFICATION_EXPIRATION_DAYS)

    // BUG-5: fetch ALL disabled preferences for this type across ALL requested
    // channels in one query, then compute per-user enabled channel lists.
    const disabledPrefs = await db.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        type: params.type,
        channel: { in: requestedChannels },
        enabled: false,
      },
      select: { userId: true, channel: true },
    })

    // Build a Map<userId, Set<disabledChannel>>
    const disabledByUser = new Map<string, Set<string>>()
    for (const pref of disabledPrefs) {
      if (!disabledByUser.has(pref.userId)) {
        disabledByUser.set(pref.userId, new Set())
      }
      disabledByUser.get(pref.userId)!.add(pref.channel)
    }

    // For each user, compute their enabled channels (default: all requested).
    const notificationRows: Array<{
      schoolId: string
      userId: string
      type: NotificationType
      title: string
      body: string
      lang: string
      priority: NotificationPriority
      actorId: string | null
      channels: NotificationChannel[]
      metadata: Prisma.InputJsonValue | undefined
      expiresAt: Date
    }> = []

    for (const userId of userIds) {
      const disabled = disabledByUser.get(userId) ?? new Set()
      const enabledChannels = requestedChannels.filter(
        (ch) => !disabled.has(ch)
      ) as NotificationChannel[]
      if (enabledChannels.length === 0) continue

      notificationRows.push({
        schoolId: params.schoolId,
        userId,
        type: params.type,
        title: params.title,
        body: params.body,
        lang: params.lang ?? "ar",
        priority: params.priority ?? "normal",
        actorId: params.actorId ?? null,
        channels: enabledChannels,
        metadata:
          (resolvedMetadata as unknown as Prisma.InputJsonValue) ?? undefined,
        expiresAt,
      })
    }

    if (notificationRows.length === 0) return { created: 0 }

    const result = await db.notification.createMany({
      data: notificationRows,
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
