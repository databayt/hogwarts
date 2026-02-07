"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { processNotificationBatch } from "@/components/school-dashboard/notifications/email-service"

import { broadcastSchema, type BroadcastInput } from "../validation"

export async function getRecentBatches() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Unauthorized")

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
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!session?.user?.id || !schoolId) throw new Error("Unauthorized")

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
      createdBy: session.user.id,
    },
  })

  // If not scheduled, process immediately
  if (!validated.scheduledFor) {
    await processNotificationBatch(batch.id, schoolId, session.user.id)
  }

  revalidatePath("/school/communication/broadcast")
  return batch
}

export async function getTargetClasses() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Unauthorized")

  return db.class.findMany({
    where: { schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}
