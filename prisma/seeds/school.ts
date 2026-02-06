/**
 * School Seed
 * Creates Demo School and School Branding
 *
 * Phase 1: Core Foundation - School Setup
 */

import type { PrismaClient } from "@prisma/client"

import { DEMO_SCHOOL } from "./constants"
import type { SchoolRef } from "./types"
import { logPhase, logSuccess, logWarning } from "./utils"

// ============================================================================
// SCHOOL SEEDING
// ============================================================================

/**
 * Seed the Demo School
 * Uses upsert to ensure additive behavior
 */
export async function seedSchool(prisma: PrismaClient): Promise<SchoolRef> {
  logPhase(1, "CORE FOUNDATION", "البنية الأساسية")

  // Shared school data for upsert
  const schoolData = {
    name: DEMO_SCHOOL.name,
    email: DEMO_SCHOOL.email,
    phoneNumber: DEMO_SCHOOL.phone,
    address: DEMO_SCHOOL.address,
    website: DEMO_SCHOOL.website,
    timezone: DEMO_SCHOOL.timezone,
    preferredLanguage: DEMO_SCHOOL.preferredLanguage,
    planType: DEMO_SCHOOL.planType,
    maxStudents: DEMO_SCHOOL.maxStudents,
    maxTeachers: DEMO_SCHOOL.maxTeachers,
    isActive: true,
    // New onboarding fields
    schoolType: DEMO_SCHOOL.schoolType,
    schoolLevel: DEMO_SCHOOL.schoolLevel,
    description: DEMO_SCHOOL.description,
    city: DEMO_SCHOOL.city,
    state: DEMO_SCHOOL.state,
    country: DEMO_SCHOOL.country,
    tuitionFee: DEMO_SCHOOL.tuitionFee,
    registrationFee: DEMO_SCHOOL.registrationFee,
    applicationFee: DEMO_SCHOOL.applicationFee,
    currency: DEMO_SCHOOL.currency,
    paymentSchedule: DEMO_SCHOOL.paymentSchedule,
    maxClasses: DEMO_SCHOOL.maxClasses,
    isPublished: true,
    onboardingCompletedAt: new Date(),
  }

  // Upsert Demo School by domain
  const school = await prisma.school.upsert({
    where: { domain: DEMO_SCHOOL.domain },
    update: schoolData,
    create: { domain: DEMO_SCHOOL.domain, ...schoolData },
  })

  logSuccess("School", 1, DEMO_SCHOOL.domain)

  return {
    id: school.id,
    name: school.name,
    domain: school.domain,
  }
}

// ============================================================================
// SCHOOL BRANDING
// ============================================================================

/**
 * Seed School Branding
 */
export async function seedSchoolBranding(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  // Check if branding exists
  const existingBranding = await prisma.schoolBranding.findUnique({
    where: { schoolId },
  })

  if (existingBranding) {
    // Update existing branding
    await prisma.schoolBranding.update({
      where: { schoolId },
      data: {
        primaryColor: DEMO_SCHOOL.primaryColor,
        secondaryColor: DEMO_SCHOOL.secondaryColor,
      },
    })
    logWarning("School Branding updated (already existed)")
  } else {
    // Create new branding
    await prisma.schoolBranding.create({
      data: {
        schoolId,
        primaryColor: DEMO_SCHOOL.primaryColor,
        secondaryColor: DEMO_SCHOOL.secondaryColor,
      },
    })
    logSuccess("School Branding", 1)
  }
}

// ============================================================================
// COMBINED SCHOOL SEED
// ============================================================================

/**
 * Seed School and Branding together
 */
export async function seedSchoolWithBranding(
  prisma: PrismaClient
): Promise<SchoolRef> {
  const school = await seedSchool(prisma)
  await seedSchoolBranding(prisma, school.id)
  return school
}
