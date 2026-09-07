// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { Prisma } from "@prisma/client"
import type { NotificationPriority, NotificationType } from "@prisma/client"

import { db } from "@/lib/db"
import { detectScript } from "@/components/translation/util"

/**
 * Platform (DEVELOPER) notification fan-out.
 *
 * `Notification.schoolId` is a REQUIRED FK to School, and a DEVELOPER has no
 * school of their own — which is why nothing has ever notified the platform
 * (see the surrendered comment in saas-dashboard/catalog/approval-actions.ts).
 * The way through is to stamp the row with the *requesting* school's id and
 * the DEVELOPER's user id: the FK is satisfied, and the row carries which
 * school is asking, which is the whole point of the notification.
 *
 * NOT reachable through `dispatchNotification` — its `resolveTargetUsers`
 * queries `db.user.findMany({ where: { schoolId, ... } })`, so a DEVELOPER can
 * never be resolved as a recipient there.
 *
 * These are plain server-only helpers, never `"use server"`: they are called
 * from inside actions, so compiling them into browser-reachable POST stubs
 * would widen the attack surface for nothing.
 */

export interface NotifyPlatformOperatorsInput {
  /** The REQUESTING school. `null` no-ops — see below. */
  schoolId: string | null
  actorId?: string | null
  type: NotificationType
  priority?: NotificationPriority
  title: string
  /**
   * Body text. Receives the resolved school name so the copy can name the
   * school — an operator watching every tenant needs to know which one asked.
   */
  buildBody: (schoolName: string) => string
  // Prisma's JSON input type, not Record<string, unknown> — `unknown` values
  // are not assignable to a Json column.
  metadata?: Prisma.InputJsonObject
}

/**
 * Fan a notification out to every DEVELOPER, attributed to the requesting
 * school. Failure-tolerant by contract: call it from `after()` and never let a
 * notification problem fail the action that triggered it.
 */
export async function notifyPlatformOperators(
  input: NotifyPlatformOperatorsInput
): Promise<void> {
  const { schoolId, actorId, type, priority, title, buildBody, metadata } =
    input

  // A DEVELOPER's own upload has no school (Video.schoolId is nullable), so
  // there is no row that can satisfy the required FK — and nobody to tell.
  if (!schoolId) return

  try {
    const [school, developers] = await Promise.all([
      db.school.findUnique({
        where: { id: schoolId },
        select: { name: true },
      }),
      db.user.findMany({
        // Deliberately unscoped by schoolId: DEVELOPERs have none. This is the
        // saas-dashboard block's documented cross-tenant exception, not a
        // missing tenant filter.
        where: { role: "DEVELOPER" },
        select: { id: true },
      }),
    ])

    if (developers.length === 0) return

    const schoolName = school?.name ?? "a school"
    const body = buildBody(schoolName)

    await db.notification.createMany({
      data: developers.map((dev) => ({
        schoolId,
        userId: dev.id,
        actorId: actorId ?? null,
        type,
        priority: priority ?? "normal",
        title,
        body,
        // Detect on the AUTHORED title, never on the body. The body
        // interpolates tenant data — a school named "نموذج" would flip
        // detectScript to "ar" (it returns "ar" on any Arabic character) and
        // label an English row Arabic, which makes it permanently
        // untranslatable for Arabic readers (the translator no-ops when
        // contentLang === displayLang). The title is pure authored copy, and
        // the copy's language is what the translator translates FROM.
        lang: detectScript(title),
        metadata: metadata ?? undefined,
      })),
    })
  } catch (error) {
    console.error("Failed to notify platform operators:", error)
  }
}

export interface NotifyPendingVideoInput {
  schoolId: string | null
  actorId?: string | null
  videoId: string
  title: string
  lessonName?: string | null
}

/**
 * "A school submitted a video and is waiting on you." Call from EVERY writer
 * that sets `Video.approvalStatus = PENDING` — upload, visibility widening and
 * file replacement — or a resubmit silently drops out of the trace.
 */
export async function notifyDevelopersOfPendingVideo(
  input: NotifyPendingVideoInput
): Promise<void> {
  const { schoolId, actorId, videoId, title, lessonName } = input
  await notifyPlatformOperators({
    schoolId,
    actorId,
    type: "content_review",
    title: "New video pending platform review",
    buildBody: (schoolName) =>
      lessonName
        ? `${schoolName} submitted "${title}" for "${lessonName}". It is waiting in the approval queue.`
        : `${schoolName} submitted "${title}". It is waiting in the approval queue.`,
    metadata: {
      entityType: "video",
      entityId: videoId,
      url: "/catalog/approvals",
    },
  })
}

export interface NotifyVideoDecisionInput {
  schoolId: string | null
  uploaderId: string
  actorId?: string | null
  videoId: string
  title: string
  decision: "APPROVED" | "REJECTED"
  rejectionReason?: string | null
}

/**
 * The return leg: tell the school its video is live (or needs changes). Goes to
 * the uploader AND the school's ADMINs — under the single-pipeline model the
 * school can no longer see the decision anywhere else.
 */
export async function notifySchoolOfVideoDecision(
  input: NotifyVideoDecisionInput
): Promise<void> {
  const {
    schoolId,
    uploaderId,
    actorId,
    videoId,
    title,
    decision,
    rejectionReason,
  } = input

  if (!schoolId || !uploaderId) return

  try {
    const admins = await db.user.findMany({
      where: { schoolId, role: "ADMIN", id: { not: uploaderId } },
      select: { id: true },
    })
    const recipientIds = Array.from(
      new Set([uploaderId, ...admins.map((a) => a.id)])
    )

    const approved = decision === "APPROVED"
    const notificationTitle = approved ? "Video ready" : "Video needs changes"
    const body = approved
      ? `"${title}" has been approved and is now live on its lesson.`
      : `"${title}" was not approved.${rejectionReason ? ` What to fix: ${rejectionReason}` : ""}`

    await db.notification.createMany({
      data: recipientIds.map((userId) => ({
        schoolId,
        userId,
        actorId: actorId ?? null,
        type: approved
          ? ("content_approved" as const)
          : ("content_rejected" as const),
        priority: approved ? ("normal" as const) : ("high" as const),
        title: notificationTitle,
        body,
        // Authored copy only — see the note in notifyPlatformOperators; the
        // body interpolates a video title that may be in any script.
        lang: detectScript(notificationTitle),
        metadata: {
          entityType: "video",
          entityId: videoId,
          url: "/lumos/videos",
          ...(rejectionReason ? { rejectionReason } : {}),
        },
      })),
    })
  } catch (error) {
    console.error("Failed to notify school of video decision:", error)
  }
}
