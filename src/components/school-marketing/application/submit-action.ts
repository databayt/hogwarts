"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { submitApplication } from "@/components/school-marketing/admission/actions"

import type { ApplicationFormData } from "./types"

export interface SubmitActionResult {
  applicationNumber: string
  applicationId: string
  accessToken: string
  requiresPayment: boolean
  applicationFee?: number
  currency?: string
  paymentMethods?: string[]
}

// --- Input validation schemas ---

const submitInputSchema = z.object({
  subdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/),
  sessionToken: z.string().min(20).max(100),
})

const applicationFormDataSchema = z.object({
  campaignId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.string().min(1),
  nationality: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string(),
  country: z.string().min(1),
  fatherName: z.string().min(1),
  motherName: z.string().min(1),
  applyingForClass: z.string().min(1),
})

export async function submitApplicationAction(
  subdomain: string,
  sessionToken: string,
  formData: Partial<ApplicationFormData>
): Promise<ActionResponse<SubmitActionResult>> {
  try {
    // Validate subdomain and sessionToken
    const inputResult = submitInputSchema.safeParse({ subdomain, sessionToken })
    if (!inputResult.success) {
      return { success: false, error: "INVALID_INPUT" }
    }

    // Build the form data with campaignId fallback
    const dataWithCampaign = {
      campaignId: formData.campaignId || "",
      ...formData,
    }

    // Validate required ApplicationFormData fields instead of unsafe cast
    const formResult = applicationFormDataSchema.safeParse(dataWithCampaign)
    if (!formResult.success) {
      return { success: false, error: "INVALID_INPUT" }
    }

    // Safe to treat as ApplicationFormData now that required fields are validated
    const validatedData = dataWithCampaign as ApplicationFormData

    const result = await submitApplication(
      inputResult.data.subdomain,
      inputResult.data.sessionToken,
      validatedData
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
      error: result.error || "FAILED_TO_SUBMIT",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "FAILED_TO_SUBMIT",
    }
  }
}
