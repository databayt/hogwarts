"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  communicationSettingsSchema,
  type CommunicationSettingsInput,
} from "../validation"

export async function getAnnouncementConfig() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Unauthorized")

  let config = await db.announcementConfig.findUnique({
    where: { schoolId },
  })

  // Create default config if none exists
  if (!config) {
    config = await db.announcementConfig.create({
      data: { schoolId },
    })
  }

  return config
}

export async function updateAnnouncementConfig(
  input: CommunicationSettingsInput
) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!session?.user || !schoolId) throw new Error("Unauthorized")

  const validated = communicationSettingsSchema.parse(input)

  const config = await db.announcementConfig.upsert({
    where: { schoolId },
    update: validated,
    create: { schoolId, ...validated },
  })

  revalidatePath("/school/communication/settings")
  return config
}
