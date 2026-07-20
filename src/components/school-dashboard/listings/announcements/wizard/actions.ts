"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { prewarm } from "@/components/translation/prewarm"

import { checkAnnouncementPermission, getAllowedScopes } from "../authorization"
import { guardAnnouncement, resolveContext } from "../guard"
import { contentSchema, type ContentFormData } from "./content/validation"
import type { AnnouncementWizardData } from "./use-announcement-wizard"

/** Fetch full announcement data for the wizard */
export async function getAnnouncementForWizard(
  announcementId: string
): Promise<
  | { success: true; data: AnnouncementWizardData }
  | { success: false; error: string }
> {
  try {
    const guard = await guardAnnouncement(announcementId, "update")
    if (!guard.ok) return guard.denied
    const { schoolId } = guard.value

    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, schoolId },
      select: {
        id: true,
        schoolId: true,
        title: true,
        body: true,
        lang: true,
        priority: true,
        scope: true,
        classId: true,
        role: true,
        published: true,
        scheduledFor: true,
        expiresAt: true,
        pinned: true,
        featured: true,
        wizardStep: true,
      },
    })

    if (!announcement) {
      return actionError(ACTION_ERRORS.ANNOUNCEMENT_NOT_FOUND)
    }

    return { success: true, data: announcement as AnnouncementWizardData }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Create a draft announcement record to start the wizard */
export async function createDraftAnnouncement(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const ctx = await resolveContext()
    if (!ctx.ok) return ctx.denied
    const { authContext, schoolId } = ctx.value

    // Seed the draft with the caller's broadest allowed scope rather than a
    // blanket "school": an empty list means the role may not author at all,
    // and a TEACHER's draft must start out class-scoped.
    const allowedScopes = getAllowedScopes(authContext.role)
    if (allowedScopes.length === 0) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const announcement = await db.announcement.create({
      data: {
        schoolId,
        title: null,
        body: null,
        scope: allowedScopes[0],
        priority: "normal",
        wizardStep: "content",
        // Without this the ownership checks in checkAnnouncementPermission()
        // can never pass, so teachers lose access to their own drafts.
        createdBy: authContext.userId,
      },
    })

    return { success: true, data: { id: announcement.id } }
  } catch {
    return actionError(ACTION_ERRORS.ANNOUNCEMENT_CREATE_FAILED)
  }
}

/**
 * Create-or-update an announcement and mark the wizard complete, in ONE call.
 *
 * The routed wizard needed three sequential round-trips to produce an
 * announcement (createDraft on click → updateContent on submit → complete), and
 * the first of them ran before the form was even visible, which is what left a
 * trail of empty drafts behind every abandoned "+" click. Collapsing all three
 * into a single action lets the modal open instantly with no server work at
 * all, and pays exactly one round-trip when the user actually submits.
 */
export async function submitAnnouncementWizard(
  input: ContentFormData & { id?: string | null }
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { id, ...rest } = input
    const parsed = contentSchema.parse(rest)

    const fields = {
      title: parsed.title,
      body: parsed.body,
      lang: parsed.lang,
      priority: parsed.priority ?? "normal",
      scope: parsed.scope,
      classId: parsed.scope === "class" ? (parsed.classId ?? null) : null,
      role:
        parsed.scope === "role" ? ((parsed.role as UserRole) ?? null) : null,
      // Completing the wizard is what clears the step marker.
      wizardStep: null,
    }

    // ---- Edit: guard the existing row, then update in place ----
    if (id) {
      const guard = await guardAnnouncement(id, "update")
      if (!guard.ok) return guard.denied
      const { authContext, schoolId } = guard.value

      if (!getAllowedScopes(authContext.role).includes(parsed.scope)) {
        return actionError(ACTION_ERRORS.UNAUTHORIZED)
      }

      await db.announcement.updateMany({
        where: { id, schoolId },
        data: fields,
      })

      after(() =>
        prewarm(
          "Announcement",
          { id, title: parsed.title, body: parsed.body },
          { schoolId }
        )
      )
      revalidatePath("/announcements")
      return { success: true, data: { id } }
    }

    // ---- Create: no row exists yet, so authorize the caller directly ----
    const ctx = await resolveContext()
    if (!ctx.ok) return ctx.denied
    const { authContext, schoolId } = ctx.value

    // Both checks matter: getAllowedScopes() covers which scopes the role may
    // ever address, checkAnnouncementPermission() covers the create right
    // itself (a TEACHER passes only for a class-scoped announcement).
    if (
      !getAllowedScopes(authContext.role).includes(parsed.scope) ||
      !checkAnnouncementPermission(authContext, "create", {
        schoolId,
        scope: parsed.scope,
      })
    ) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const created = await db.announcement.create({
      data: {
        ...fields,
        schoolId,
        // Without this the ownership checks in checkAnnouncementPermission()
        // can never pass, so teachers lose access to their own announcements.
        createdBy: authContext.userId,
      },
      select: { id: true },
    })

    after(() =>
      prewarm(
        "Announcement",
        { id: created.id, title: parsed.title, body: parsed.body },
        { schoolId }
      )
    )
    revalidatePath("/announcements")
    return { success: true, data: { id: created.id } }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

/** Mark the announcement wizard as complete */
export async function completeAnnouncementWizard(
  announcementId: string
): Promise<ActionResponse> {
  try {
    const guard = await guardAnnouncement(announcementId, "publish")
    if (!guard.ok) return guard.denied
    const { schoolId } = guard.value

    // Validate required fields are present
    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, schoolId },
      select: { title: true, body: true },
    })

    if (!announcement) {
      return actionError(ACTION_ERRORS.ANNOUNCEMENT_NOT_FOUND)
    }

    if (!announcement.title?.trim() || !announcement.body?.trim()) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    await db.announcement.updateMany({
      where: { id: announcementId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/announcements")
    return { success: true }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

/** Update the current wizard step for resumability */
export async function updateAnnouncementWizardStep(
  announcementId: string,
  step: string
): Promise<void> {
  try {
    const guard = await guardAnnouncement(announcementId, "update")
    if (!guard.ok) return
    const { schoolId } = guard.value

    await db.announcement.updateMany({
      where: { id: announcementId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft announcement */
export async function deleteDraftAnnouncement(
  announcementId: string
): Promise<ActionResponse> {
  try {
    const guard = await guardAnnouncement(announcementId, "delete")
    if (!guard.ok) return guard.denied
    const { schoolId } = guard.value

    // Atomic delete — only if it's still a draft
    const { count } = await db.announcement.deleteMany({
      where: { id: announcementId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    return { success: true }
  } catch {
    return actionError(ACTION_ERRORS.ANNOUNCEMENT_DELETE_FAILED)
  }
}
