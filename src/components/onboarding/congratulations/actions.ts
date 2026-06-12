"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import {
  createActionResponse,
  type ActionResponse,
} from "@/lib/action-response"
import { db } from "@/lib/db"
import { repairProvisioning } from "@/components/catalog/provision"

import { requireSchoolOwnership } from "../auth-helpers"

/**
 * Admin-only fallback: manually publish a school and trigger catalog setup.
 * Primary provisioning now happens in completeOnboarding() (legal/actions.ts).
 * This remains for manual re-provisioning from admin dashboard if needed.
 */
export async function publishSchool(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.update({
      where: { id: schoolId },
      data: {
        isPublished: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: "completed",
      },
      select: {
        id: true,
        name: true,
        domain: true,
        country: true,
        timetableStructure: true,
      },
    })

    // Run whichever provisioning stages are missing (academic structure,
    // schedule, sections, timetable slots, join code). Idempotent — safe to
    // re-run on an already-provisioned school; a partially provisioned one
    // gets exactly the stages it lost. Non-blocking: provisioning failure
    // should NOT prevent publishing.
    try {
      const repair = await repairProvisioning(schoolId)
      if (repair.failed.length > 0) {
        console.error(
          `[publishSchool] Provisioning stages failed for school ${schoolId}:`,
          repair.failed
        )
      }
    } catch (provisionError) {
      console.error(
        `[publishSchool] Provisioning failed for school ${schoolId}:`,
        provisionError
      )
    }

    // Seed the double-entry chart of accounts (+ fiscal year) so fee/payment
    // ledger posts have accounts to write to. Without this every postFeePayment
    // silently fails ("Required accounts not found"). Idempotent. Non-blocking.
    try {
      const { initializeAccountingSystem } =
        await import("@/components/school-dashboard/finance/lib/accounting/seed-accounts")
      await initializeAccountingSystem(schoolId)
    } catch (acctError) {
      console.error(
        `[publishSchool] Accounting init failed for school ${schoolId}:`,
        acctError
      )
    }

    // Auto-provision per-grade fee structures from School.tuitionFee + currency.
    // Runs after catalog setup so AcademicGrade rows exist. Non-blocking.
    try {
      const { provisionSchoolFees } = await import("@/lib/fee-provisioning")
      await provisionSchoolFees(schoolId)
    } catch (feeError) {
      console.error(
        `[publishSchool] Fee provisioning failed for school ${schoolId}:`,
        feeError
      )
    }

    revalidatePath(`/onboarding/${schoolId}`)

    return createActionResponse({
      id: school.id,
      name: school.name,
      domain: school.domain,
      redirectUrl: `/`,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}

export async function getPublishStatus(
  schoolId: string
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        domain: true,
        isPublished: true,
        onboardingCompletedAt: true,
        schoolType: true,
        address: true,
        tuitionFee: true,
      },
    })

    if (!school) throw new Error("School not found")

    return createActionResponse({
      id: school.id,
      name: school.name,
      domain: school.domain,
      isPublished: school.isPublished,
      onboardingCompletedAt:
        school.onboardingCompletedAt?.toISOString() ?? null,
      schoolType: school.schoolType,
      address: school.address,
      tuitionFee: school.tuitionFee ? Number(school.tuitionFee) : null,
    })
  } catch (error) {
    return createActionResponse(undefined, error)
  }
}
