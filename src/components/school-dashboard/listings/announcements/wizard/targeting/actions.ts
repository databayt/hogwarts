"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { getAllowedScopes } from "../../authorization"
import { guardAnnouncement, resolveContext } from "../../guard"
import { targetingSchema, type TargetingFormData } from "./validation"

export async function getAnnouncementTargeting(
  announcementId: string
): Promise<ActionResponse<TargetingFormData>> {
  try {
    const guard = await guardAnnouncement(announcementId, "update")
    if (!guard.ok) return guard.denied
    const { schoolId } = guard.value

    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, schoolId },
      select: {
        scope: true,
        classId: true,
        role: true,
        published: true,
        scheduledFor: true,
        expiresAt: true,
        pinned: true,
        featured: true,
      },
    })

    if (!announcement) {
      return actionError(ACTION_ERRORS.ANNOUNCEMENT_NOT_FOUND)
    }

    return {
      success: true,
      data: {
        scope: announcement.scope as "school" | "class" | "role",
        classId: announcement.classId ?? undefined,
        role: announcement.role ?? undefined,
        published: announcement.published,
        scheduledFor: announcement.scheduledFor ?? undefined,
        expiresAt: announcement.expiresAt ?? undefined,
        pinned: announcement.pinned,
        featured: announcement.featured,
      },
    }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function updateAnnouncementTargeting(
  announcementId: string,
  input: TargetingFormData
): Promise<ActionResponse> {
  try {
    const guard = await guardAnnouncement(announcementId, "update")
    if (!guard.ok) return guard.denied
    const { authContext, schoolId } = guard.value

    const parsed = targetingSchema.parse(input)

    // This step is where scope is chosen and the announcement goes live, so the
    // caller's role has to permit both the target scope and the publish itself
    // — a TEACHER may only ever address their own class.
    if (!getAllowedScopes(authContext.role).includes(parsed.scope)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (parsed.published) {
      const canPublish = await guardAnnouncement(announcementId, "publish")
      if (!canPublish.ok) return canPublish.denied
    }

    await db.announcement.updateMany({
      where: { id: announcementId, schoolId },
      data: {
        scope: parsed.scope,
        classId: parsed.scope === "class" ? (parsed.classId ?? null) : null,
        role:
          parsed.scope === "role" ? ((parsed.role as UserRole) ?? null) : null,
        published: parsed.published,
        scheduledFor: parsed.scheduledFor ?? null,
        expiresAt: parsed.expiresAt ?? null,
        pinned: parsed.pinned ?? false,
        featured: parsed.featured ?? false,
      },
    })

    return { success: true }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

export async function getClassesForAnnouncement(): Promise<
  { label: string; value: string }[]
> {
  try {
    const ctx = await resolveContext()
    if (!ctx.ok) return []
    const { schoolId } = ctx.value

    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
    })

    return classes.map((c) => ({ label: c.name, value: c.id }))
  } catch {
    return []
  }
}
