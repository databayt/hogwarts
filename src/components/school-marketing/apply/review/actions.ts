"use server"

import type { ActionResponse } from "@/lib/action-response"
import { submitApplication } from "@/components/school-marketing/admission/actions"

import type { ApplicationFormData } from "../types"

export async function submitApplicationAction(
  subdomain: string,
  sessionToken: string,
  formData: Partial<ApplicationFormData>
): Promise<ActionResponse<{ applicationNumber: string; accessToken: string }>> {
  try {
    const flattenedData = {
      campaignId: formData.campaignId || "",
      ...formData,
    } as ApplicationFormData

    const result = await submitApplication(
      subdomain,
      sessionToken,
      flattenedData
    )

    if (result.success && result.data) {
      return {
        success: true,
        data: {
          applicationNumber: result.data.applicationNumber,
          accessToken: result.data.accessToken,
        },
      }
    }

    return {
      success: false,
      error: result.error || "Failed to submit application",
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit application",
    }
  }
}
