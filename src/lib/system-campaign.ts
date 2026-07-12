// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Hidden per-school "system campaign" that direct-admit / bulk-import students'
 * shadow Applications hang off. Every student is born from an Application
 * (see prisma/models/admission.prisma AdmissionCampaign.isSystemGenerated); the
 * PORTAL pipeline attaches to a real admin-created campaign, while every other
 * `AdmissionChannel` (ADMIN_DIRECT, ONBOARDING_IMPORT, BULK_IMPORT,
 * LEGACY_BACKFILL) attaches to this single always-CLOSED placeholder so the
 * merit/enrollment dashboards (which query real campaigns) never see it.
 *
 * Used by `provisionStudent` (student-provisioning.ts) when a caller does not
 * already have an `applicationId` to reuse.
 */

import type { AdmissionChannel, Gender, Prisma } from "@prisma/client"

import type { ProvisionStudentInput } from "@/lib/student-provisioning"

/**
 * Find this school's hidden system campaign, creating it on first use.
 * At most one exists per school — enforced by a partial unique index
 * (`AdmissionCampaign_one_system_per_school`, see the
 * 20260712000000_add_admission_channel_and_system_campaign migration) that
 * Prisma's schema cannot express. A P2002 race here means a concurrent caller
 * won the create — re-query and return theirs.
 */
export async function getOrCreateSystemCampaign(
  tx: Prisma.TransactionClient,
  schoolId: string
): Promise<string> {
  const existing = await tx.admissionCampaign.findFirst({
    where: { schoolId, isSystemGenerated: true },
    select: { id: true },
  })
  if (existing) return existing.id

  const currentYear = new Date().getFullYear()
  const academicYear = `${currentYear}-${currentYear + 1}`

  try {
    const created = await tx.admissionCampaign.create({
      data: {
        schoolId,
        name: "Direct Admission",
        academicYear,
        // Wide bounds — this campaign is never opened/closed by admission UI,
        // it exists only as a hook for shadow Applications.
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 0, 1),
        status: "CLOSED",
        totalSeats: 0,
        isSystemGenerated: true,
      },
      select: { id: true },
    })
    return created.id
  } catch (err: unknown) {
    const isUniqueViolation =
      err !== null &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    if (isUniqueViolation) {
      const retried = await tx.admissionCampaign.findFirst({
        where: { schoolId, isSystemGenerated: true },
        select: { id: true },
      })
      if (retried) return retried.id
    }
    throw err
  }
}

/**
 * Mint a shadow Application for a direct-admit student on the hidden system
 * campaign. Required Application fields are backfilled from `input` with safe
 * fallbacks — never fabricated data written back onto Student itself.
 *
 * Not exercised by the admission dashboard's `confirmEnrollment` path (which
 * always reuses an existing PORTAL Application) — this is the path future
 * callers (admin single-student wizard, CSV import) will use once they adopt
 * `provisionStudent`.
 */
export async function ensureDirectAdmitApplication(
  tx: Prisma.TransactionClient,
  input: ProvisionStudentInput,
  channel: AdmissionChannel,
  studentCode: string
): Promise<string> {
  const campaignId = await getOrCreateSystemCampaign(tx, input.schoolId)
  const applicationNumber = `DA-${studentCode}-${Date.now().toString(36).toUpperCase()}`

  const created = await tx.application.create({
    data: {
      schoolId: input.schoolId,
      campaignId,
      applicationNumber,
      channel,
      // Link the provisioned student's User so the shadow Application matches
      // the portal path (where Application.userId is always set).
      userId: input.userId ?? undefined,
      lang: input.lang ?? "ar",
      status: "ADMITTED",
      firstName: input.firstName,
      middleName: input.middleName ?? undefined,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth ?? undefined,
      // Student.gender is a free-form String; Application.gender is the
      // Gender enum — cast at this boundary only (never on the Student side).
      gender: (input.gender ?? undefined) as Gender | undefined,
      nationality: input.nationality ?? "",
      // provisionStudent always passes a normalized email (real or synthesized
      // placeholder) into the shadow-Application path; coalesce for the type.
      email: input.email ?? "",
      phone: input.phone ?? "",
      address: input.address ?? "",
      city: input.city ?? "",
      state: input.state ?? "",
      postalCode: input.postalCode ?? "",
      country: input.country ?? "SD",
      applyingForClass: input.applyingForClass ?? "",
      admissionConfirmed: true,
      confirmationDate: new Date(),
    },
    select: { id: true },
  })
  return created.id
}
