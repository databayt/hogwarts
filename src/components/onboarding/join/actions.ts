"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"

import { requireSchoolOwnership } from "../auth-helpers"
import { joinSchema } from "./validation"

export type JoinFormData = z.infer<typeof joinSchema>

export async function updateJoinSettings(
  schoolId: string,
  data: JoinFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const validated = joinSchema.parse(data)

    // Write to SchoolBranding model
    const branding = await db.schoolBranding.upsert({
      where: { schoolId },
      update: {
        allowSelfEnrollment: validated.allowSelfEnrollment,
        requireParentApproval: validated.requireParentApproval,
        informationSharing:
          validated.joinMethod === "invite-with-codes"
            ? "limited-sharing"
            : "full-transparency",
      },
      create: {
        schoolId,
        allowSelfEnrollment: validated.allowSelfEnrollment,
        requireParentApproval: validated.requireParentApproval,
        informationSharing:
          validated.joinMethod === "invite-with-codes"
            ? "limited-sharing"
            : "full-transparency",
      },
    })

    revalidatePath(`/onboarding/${schoolId}/join`)
    return createActionResponse(branding)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, {
        message: "Validation failed",
        name: "ValidationError",
      })
    }
    return createActionResponse(undefined, error)
  }
}

export async function getJoinSettings(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const branding = await db.schoolBranding.findUnique({
      where: { schoolId },
      select: {
        allowSelfEnrollment: true,
        requireParentApproval: true,
        informationSharing: true,
      },
    })

    return createActionResponse({
      joinMethod:
        branding?.informationSharing === "full-transparency"
          ? "manual-enrollment"
          : "invite-with-codes",
      autoApproval: false,
      requireParentApproval: branding?.requireParentApproval ?? true,
      allowSelfEnrollment: branding?.allowSelfEnrollment ?? false,
    } satisfies JoinFormData)
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
