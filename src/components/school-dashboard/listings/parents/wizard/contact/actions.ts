"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { contactSchema, type ContactFormData } from "./validation"

export async function getParentContact(
  parentId: string
): Promise<ActionResponse<ContactFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const guardian = await db.guardian.findFirst({
      where: { id: parentId, schoolId },
      select: {
        phoneNumbers: {
          where: { schoolId },
          select: { phoneType: true, phoneNumber: true, isPrimary: true },
        },
      },
    })

    if (!guardian) return { success: false, error: "Guardian not found" }

    return {
      success: true,
      data: {
        phoneNumbers: guardian.phoneNumbers.map((p) => ({
          phoneType: p.phoneType as "mobile" | "home" | "work" | "emergency",
          phoneNumber: p.phoneNumber,
          isPrimary: p.isPrimary,
        })),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateParentContact(
  parentId: string,
  input: ContactFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = contactSchema.parse(input)

    await db.$transaction([
      // Delete + recreate phone numbers
      db.guardianPhoneNumber.deleteMany({
        where: { guardianId: parentId, schoolId },
      }),
      ...(parsed.phoneNumbers.length > 0
        ? [
            db.guardianPhoneNumber.createMany({
              data: parsed.phoneNumbers.map((p) => ({
                guardianId: parentId,
                schoolId,
                phoneType: p.phoneType,
                phoneNumber: p.phoneNumber,
                isPrimary: p.isPrimary,
              })),
            }),
          ]
        : []),
    ])

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
