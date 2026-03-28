"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { createOrLinkGuardian } from "@/lib/guardian-utils"
import { getTenantContext } from "@/lib/tenant-context"

import { guardianSchema, type GuardianFormData } from "./validation"

export interface GuardianData {
  fatherFirstName: string
  fatherLastName: string
  fatherOccupation: string
  fatherPhone: string
  fatherEmail: string
  motherFirstName: string
  motherLastName: string
  motherOccupation: string
  motherPhone: string
  motherEmail: string
}

export async function getStudentGuardians(
  studentId: string
): Promise<ActionResponse<GuardianData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const studentGuardians = await db.studentGuardian.findMany({
      where: { studentId, schoolId },
      include: {
        guardian: true,
        guardianType: true,
      },
    })

    const result: GuardianData = {
      fatherFirstName: "",
      fatherLastName: "",
      fatherOccupation: "",
      fatherPhone: "",
      fatherEmail: "",
      motherFirstName: "",
      motherLastName: "",
      motherOccupation: "",
      motherPhone: "",
      motherEmail: "",
    }

    for (const sg of studentGuardians) {
      const typeName = sg.guardianType.name.toLowerCase()
      if (typeName === "father") {
        result.fatherFirstName = sg.guardian.firstName
        result.fatherLastName = sg.guardian.lastName
        result.fatherOccupation = sg.occupation || ""
        result.fatherEmail = sg.guardian.emailAddress || ""
        // Get phone
        const phone = await db.guardianPhoneNumber.findFirst({
          where: { guardianId: sg.guardianId, schoolId },
          orderBy: { isPrimary: "desc" },
        })
        result.fatherPhone = phone?.phoneNumber || ""
      } else if (typeName === "mother") {
        result.motherFirstName = sg.guardian.firstName
        result.motherLastName = sg.guardian.lastName
        result.motherOccupation = sg.occupation || ""
        result.motherEmail = sg.guardian.emailAddress || ""
        const phone = await db.guardianPhoneNumber.findFirst({
          where: { guardianId: sg.guardianId, schoolId },
          orderBy: { isPrimary: "desc" },
        })
        result.motherPhone = phone?.phoneNumber || ""
      }
    }

    return { success: true, data: result }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function saveStudentGuardians(
  studentId: string,
  input: GuardianFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = guardianSchema.parse(input)

    await db.$transaction(async (tx) => {
      // Save father if name provided
      if (parsed.fatherFirstName?.trim()) {
        await createOrLinkGuardian(tx, {
          schoolId,
          studentId,
          typeName: "father",
          firstName: parsed.fatherFirstName.trim(),
          lastName: parsed.fatherLastName?.trim() || "",
          email: parsed.fatherEmail?.trim() || null,
          phone: parsed.fatherPhone?.trim() || null,
          occupation: parsed.fatherOccupation?.trim() || null,
          isPrimary: true,
        })
      }

      // Save mother if name provided
      if (parsed.motherFirstName?.trim()) {
        await createOrLinkGuardian(tx, {
          schoolId,
          studentId,
          typeName: "mother",
          firstName: parsed.motherFirstName.trim(),
          lastName: parsed.motherLastName?.trim() || "",
          email: parsed.motherEmail?.trim() || null,
          phone: parsed.motherPhone?.trim() || null,
          occupation: parsed.motherOccupation?.trim() || null,
          isPrimary: !parsed.fatherFirstName?.trim(),
        })
      }
    })

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
