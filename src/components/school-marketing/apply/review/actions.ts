"use server"

import type { ActionResponse } from "@/lib/action-response"
import { submitApplication } from "@/components/school-marketing/admission/actions"

import type { ApplicationFormData } from "../types"

export interface SubmitActionResult {
  applicationNumber: string
  applicationId: string
  accessToken: string
  requiresPayment: boolean
  applicationFee?: number
  currency?: string
  paymentMethods?: string[]
}

export async function submitApplicationAction(
  subdomain: string,
  sessionToken: string,
  formData: Partial<ApplicationFormData>
): Promise<ActionResponse<SubmitActionResult>> {
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
          applicationId: result.data.applicationId,
          accessToken: result.data.accessToken,
          requiresPayment: result.data.requiresPayment,
          applicationFee: result.data.applicationFee,
          currency: result.data.currency,
          paymentMethods: result.data.paymentMethods,
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
