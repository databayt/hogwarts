"use server"

import { submitApplication } from "@/components/school-marketing/admission/actions"

import type { ApplicationFormData } from "../types"

export interface SubmitApplicationResult {
  success: boolean
  applicationNumber?: string
  accessToken?: string
  error?: string
}

export async function submitApplicationAction(
  subdomain: string,
  sessionToken: string,
  formData: Partial<ApplicationFormData>
): Promise<SubmitApplicationResult> {
  try {
    // Flatten form data for submission
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
        applicationNumber: result.data.applicationNumber,
        accessToken: result.data.accessToken,
      }
    }

    return {
      success: false,
      error: result.error || "Failed to submit application",
    }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: "Failed to submit application" }
  }
}
