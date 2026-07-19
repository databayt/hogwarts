"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"

import { requireSchoolRole } from "../../require-school-admin"
import {
  communicationSettingsSchema,
  type CommunicationSettingsInput,
} from "../validation"

export async function getAnnouncementConfig() {
  const { schoolId } = await requireSchoolRole()

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
  const { schoolId } = await requireSchoolRole()

  const validated = communicationSettingsSchema.parse(input)

  const config = await db.announcementConfig.upsert({
    where: { schoolId },
    update: validated,
    create: { schoolId, ...validated },
  })

  revalidatePath("/school/communication/settings")
  return config
}
