"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { contentSchema, type ContentFormData } from "./validation"

export async function getAnnouncementContent(
  announcementId: string
): Promise<ActionResponse<ContentFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, schoolId },
      select: {
        title: true,
        body: true,
        lang: true,
        priority: true,
      },
    })

    if (!announcement) {
      return { success: false, error: "Announcement not found" }
    }

    return {
      success: true,
      data: {
        title: announcement.title ?? "",
        body: announcement.body ?? "",
        lang: (announcement.lang as "ar" | "en") ?? "ar",
        priority: announcement.priority as
          | "low"
          | "normal"
          | "high"
          | "urgent"
          | undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateAnnouncementContent(
  announcementId: string,
  input: ContentFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = contentSchema.parse(input)

    await db.announcement.updateMany({
      where: { id: announcementId, schoolId },
      data: {
        title: parsed.title,
        body: parsed.body,
        lang: parsed.lang,
        priority: parsed.priority ?? "normal",
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
