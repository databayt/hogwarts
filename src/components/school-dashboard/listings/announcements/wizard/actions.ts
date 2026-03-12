"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { AnnouncementWizardData } from "./use-announcement-wizard"

/** Fetch full announcement data for the wizard */
export async function getAnnouncementForWizard(
  announcementId: string
): Promise<
  | { success: true; data: AnnouncementWizardData }
  | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

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
      return { success: false, error: "Announcement not found" }
    }

    return { success: true, data: announcement as AnnouncementWizardData }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load announcement",
    }
  }
}

/** Create a draft announcement record to start the wizard */
export async function createDraftAnnouncement(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const announcement = await db.announcement.create({
      data: {
        schoolId,
        title: null,
        body: null,
        scope: "school",
        priority: "normal",
        wizardStep: "content",
      },
    })

    return { success: true, data: { id: announcement.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create announcement",
    }
  }
}

/** Mark the announcement wizard as complete */
export async function completeAnnouncementWizard(
  announcementId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Validate required fields are present
    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, schoolId },
      select: { title: true, body: true },
    })

    if (!announcement) {
      return { success: false, error: "Announcement not found" }
    }

    if (!announcement.title || !announcement.title.trim()) {
      return {
        success: false,
        error: "Title is required before completing",
      }
    }

    if (!announcement.body || !announcement.body.trim()) {
      return {
        success: false,
        error: "Body is required before completing",
      }
    }

    await db.announcement.updateMany({
      where: { id: announcementId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/announcements")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete announcement wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateAnnouncementWizardStep(
  announcementId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

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
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Atomic delete — only if it's still a draft
    const { count } = await db.announcement.deleteMany({
      where: { id: announcementId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft announcement not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft announcement",
    }
  }
}
