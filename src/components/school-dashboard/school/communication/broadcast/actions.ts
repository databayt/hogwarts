"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { resolveBatchTarget } from "@/components/school-dashboard/notifications/batch-target"
import { processNotificationBatch } from "@/components/school-dashboard/notifications/email-service"

import { requireSchoolRole } from "../../require-school-admin"
import { broadcastSchema, type BroadcastInput } from "../validation"

export async function getRecentBatches() {
  const { schoolId } = await requireSchoolRole()

  return db.notificationBatch.findMany({
    where: { schoolId },
    include: {
      creator: {
        select: { username: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })
}

export async function sendBroadcast(input: BroadcastInput) {
  const { userId, schoolId } = await requireSchoolRole()

  const validated = broadcastSchema.parse(input)

  // A grade or section target must be this school's
  const target = await resolveBatchTarget(schoolId, validated)
  if (!target.ok) throw new Error(target.code)

  // Create the batch
  const batch = await db.notificationBatch.create({
    data: {
      schoolId,
      type: validated.type,
      title: validated.title,
      body: validated.body,
      targetRole: validated.targetRole,
      targetGradeId: target.targetGradeId,
      targetSectionId: target.targetSectionId,
      targetUserIds: validated.targetUserIds,
      scheduledFor: validated.scheduledFor,
      createdBy: userId,
    },
  })

  // If not scheduled, process immediately
  if (!validated.scheduledFor) {
    await processNotificationBatch(batch.id, schoolId, userId)
  }

  refreshPage("/school/communication/broadcast")
  return batch
}

/** Grades in order, each with its sections — who a broadcast can target. */
export async function getBroadcastTargets() {
  const { schoolId } = await requireSchoolRole()

  return db.academicGrade.findMany({
    where: { schoolId },
    orderBy: { gradeNumber: "asc" },
    select: {
      id: true,
      name: true,
      sections: {
        orderBy: [{ letter: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      },
    },
  })
}
