"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { UserRole } from "@prisma/client"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { targetingSchema, type TargetingFormData } from "./validation"

export async function getAnnouncementTargeting(
  announcementId: string
): Promise<ActionResponse<TargetingFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

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
      return { success: false, error: "Announcement not found" }
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateAnnouncementTargeting(
  announcementId: string,
  input: TargetingFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = targetingSchema.parse(input)

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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}

export async function getClassesForAnnouncement(): Promise<
  { label: string; value: string }[]
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return []

    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
    })

    return classes.map((c) => ({ label: c.name, value: c.id }))
  } catch {
    return []
  }
}
