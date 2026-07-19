"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
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

  // Create the batch
  const batch = await db.notificationBatch.create({
    data: {
      schoolId,
      type: validated.type,
      title: validated.title,
      body: validated.body,
      targetRole: validated.targetRole,
      targetClassId: validated.targetClassId,
      targetUserIds: validated.targetUserIds,
      scheduledFor: validated.scheduledFor,
      createdBy: userId,
    },
  })

  // If not scheduled, process immediately
  if (!validated.scheduledFor) {
    await processNotificationBatch(batch.id, schoolId, userId)
  }

  revalidatePath("/school/communication/broadcast")
  return batch
}

export async function getTargetClasses() {
  const { schoolId } = await requireSchoolRole()

  return db.class.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
