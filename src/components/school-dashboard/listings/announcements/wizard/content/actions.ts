"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { prewarm } from "@/components/translation/prewarm"

import { guardAnnouncement } from "../../guard"
import { contentSchema, type ContentFormData } from "./validation"

export async function getAnnouncementContent(
  announcementId: string
): Promise<ActionResponse<ContentFormData>> {
  try {
    const guard = await guardAnnouncement(announcementId, "update")
    if (!guard.ok) return guard.denied
    const { schoolId } = guard.value

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
      return actionError(ACTION_ERRORS.ANNOUNCEMENT_NOT_FOUND)
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
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function updateAnnouncementContent(
  announcementId: string,
  input: ContentFormData
): Promise<ActionResponse> {
  try {
    const guard = await guardAnnouncement(announcementId, "update")
    if (!guard.ok) return guard.denied
    const { schoolId } = guard.value

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

    after(() =>
      prewarm(
        "Announcement",
        { id: announcementId, title: parsed.title, body: parsed.body },
        { schoolId }
      )
    )

    return { success: true }
  } catch {
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
