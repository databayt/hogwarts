"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

// Schema for school identity update
const schoolIdentitySchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  domain: z
    .string()
    .min(2, "Subdomain must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  timezone: z.string().optional(),
  description: z.string().optional(),
  schoolType: z.string().optional(),
  schoolLevel: z.string().optional(),
  timetableStructure: z.string().optional(),
  preferredLanguage: z.string().optional(),
})

// Schema for branding update
const brandingSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
    .optional()
    .or(z.literal("")),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid color")
    .optional()
    .or(z.literal("")),
  borderRadius: z.string().optional(),
})

type ActionResult = {
  success: boolean
  error?: string
}

// Tenant membership is not authorization — every school member (student,
// guardian, teacher) shares the schoolId, and these actions rewrite identity,
// pricing, capacity and module toggles for the whole school. Server Actions
// are public POST endpoints, so the role gate must live here, not in the UI.
const SCHOOL_CONFIG_ROLES: ReadonlySet<string> = new Set(["ADMIN", "DEVELOPER"])

export async function updateSchoolIdentity(
  schoolId: string,
  data: z.infer<typeof schoolIdentitySchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Validate input
    const validatedData = schoolIdentitySchema.parse(data)

    // Check if domain is unique (if changed)
    const existingSchool = await db.school.findFirst({
      where: {
        domain: validatedData.domain,
        NOT: { id: schoolId },
      },
    })

    if (existingSchool) {
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }

    // Update school
    const updated = await db.school.update({
      where: { id: schoolId },
      data: {
        name: validatedData.name,
        domain: validatedData.domain,
        email: validatedData.email || null,
        phoneNumber: validatedData.phoneNumber || null,
        address: validatedData.address || null,
        website: validatedData.website || null,
        timezone: validatedData.timezone || "Africa/Khartoum",
        description: validatedData.description || null,
        schoolType: validatedData.schoolType || null,
        schoolLevel: validatedData.schoolLevel || null,
        timetableStructure: validatedData.timetableStructure || null,
        preferredLanguage: validatedData.preferredLanguage || "ar",
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/identity")

    return { success: true }
  } catch (error) {
    console.error("Error updating school identity:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

export async function updateSchoolBranding(
  schoolId: string,
  data: z.infer<typeof brandingSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Validate input
    const validatedData = brandingSchema.parse(data)

    // Update school logoUrl (including clearing it)
    if (validatedData.logoUrl !== undefined) {
      await db.school.update({
        where: { id: schoolId },
        data: {
          logoUrl: validatedData.logoUrl || null,
        },
      })
    }

    // Upsert branding (create if doesn't exist, update if it does)
    const updated = await db.schoolBranding.upsert({
      where: {
        schoolId: schoolId,
      },
      create: {
        schoolId: schoolId,
        primaryColor: validatedData.primaryColor || null,
        secondaryColor: validatedData.secondaryColor || null,
        borderRadius: validatedData.borderRadius || null,
      },
      update: {
        primaryColor: validatedData.primaryColor || null,
        secondaryColor: validatedData.secondaryColor || null,
        borderRadius: validatedData.borderRadius || null,
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/branding")

    return { success: true }
  } catch (error) {
    console.error("Error updating school branding:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for hero image update
const heroImageSchema = z.object({
  heroImageUrl: z.string().url().optional().or(z.literal("")),
})

export async function updateHeroImage(
  schoolId: string,
  data: z.infer<typeof heroImageSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validatedData = heroImageSchema.parse(data)

    await db.schoolBranding.upsert({
      where: { schoolId },
      create: {
        schoolId,
        heroImageUrl: validatedData.heroImageUrl || null,
      },
      update: {
        heroImageUrl: validatedData.heroImageUrl || null,
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/hero")
    // Also revalidate the marketing page since it shows the hero
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error updating hero image:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for school location update
const schoolLocationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export async function updateSchoolLocation(
  schoolId: string,
  data: z.infer<typeof schoolLocationSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validatedData = schoolLocationSchema.parse(data)

    const updated = await db.school.update({
      where: { id: schoolId },
      data: {
        address: validatedData.address || null,
        city: validatedData.city || null,
        state: validatedData.state || null,
        country: validatedData.country || null,
        latitude: validatedData.latitude ?? null,
        longitude: validatedData.longitude ?? null,
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/location")
    return { success: true }
  } catch (error) {
    console.error("Error updating school location:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for school pricing update
const schoolPricingSchema = z.object({
  tuitionFee: z.number().min(0).optional().nullable(),
  registrationFee: z.number().min(0).optional().nullable(),
  applicationFee: z.number().min(0).optional().nullable(),
  currency: z.string().default("USD"),
  paymentSchedule: z.enum(["monthly", "quarterly", "semester", "annual"]),
})

export async function updateSchoolPricing(
  schoolId: string,
  data: z.infer<typeof schoolPricingSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validatedData = schoolPricingSchema.parse(data)

    const updated = await db.school.update({
      where: { id: schoolId },
      data: {
        tuitionFee: validatedData.tuitionFee ?? null,
        registrationFee: validatedData.registrationFee ?? null,
        applicationFee: validatedData.applicationFee ?? null,
        currency: validatedData.currency,
        paymentSchedule: validatedData.paymentSchedule,
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/pricing")
    return { success: true }
  } catch (error) {
    console.error("Error updating school pricing:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for plan and limits update
const planLimitsSchema = z.object({
  planType: z.enum(["basic", "premium", "enterprise"]),
  maxStudents: z.number().min(1).max(100000),
  maxTeachers: z.number().min(1).max(10000),
  maxClasses: z.number().min(1).max(1000),
  isActive: z.boolean(),
})

export async function updatePlanLimits(
  schoolId: string,
  data: z.infer<typeof planLimitsSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Only DEVELOPER can modify plan limits
    if (session?.user?.role !== "DEVELOPER") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Validate input
    const validatedData = planLimitsSchema.parse(data)

    // Update school
    const updated = await db.school.update({
      where: { id: schoolId },
      data: {
        planType: validatedData.planType,
        maxStudents: validatedData.maxStudents,
        maxTeachers: validatedData.maxTeachers,
        maxClasses: validatedData.maxClasses,
        isActive: validatedData.isActive,
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/plan")

    return { success: true }
  } catch (error) {
    console.error("Error updating plan limits:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for capacity update (max limits the school can configure)
const capacitySchema = z.object({
  maxStudents: z.number().min(1).max(100000),
  maxTeachers: z.number().min(1).max(10000),
})

export async function updateSchoolCapacity(
  schoolId: string,
  data: z.infer<typeof capacitySchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // Validate input
    const validatedData = capacitySchema.parse(data)

    // Update school
    const updated = await db.school.update({
      where: { id: schoolId },
      data: {
        maxStudents: validatedData.maxStudents,
        maxTeachers: validatedData.maxTeachers,
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/capacity")

    return { success: true }
  } catch (error) {
    console.error("Error updating school capacity:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for enabled modules update
const enabledModulesSchema = z.object({
  enabledModules: z.array(z.string()).nullable(),
})

export async function updateEnabledModules(
  schoolId: string,
  data: z.infer<typeof enabledModulesSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validatedData = enabledModulesSchema.parse(data)

    await db.school.update({
      where: { id: schoolId },
      data: {
        enabledModules:
          validatedData.enabledModules === null
            ? Prisma.DbNull
            : validatedData.enabledModules,
      },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/modules")

    return { success: true }
  } catch (error) {
    console.error("Error updating enabled modules:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for school name update (title config page - name only, no domain change)
const schoolNameSchema = z.object({
  name: z
    .string()
    .min(3, "School name must be at least 3 characters")
    .max(100)
    .trim(),
  // The UI language the editor was in when saving. Used to decide whether
  // we update the canonical `name` (stored language) or the `nameEn` mirror.
  editLang: z.enum(["ar", "en"]).optional(),
})

export async function updateSchoolName(
  schoolId: string,
  data: z.infer<typeof schoolNameSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validatedData = schoolNameSchema.parse(data)

    // Determine which field to write. Editing in the school's stored
    // language updates the canonical `name`; editing in English while
    // the school is stored in Arabic only updates the `nameEn` mirror.
    const existing = await db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const storedLang = (existing?.preferredLanguage || "ar") as "ar" | "en"
    const editLang = validatedData.editLang ?? storedLang

    const updateData =
      editLang === "en" && storedLang !== "en"
        ? { nameEn: validatedData.name }
        : { name: validatedData.name }

    await db.school.update({
      where: { id: schoolId },
      data: updateData,
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/title")

    return { success: true }
  } catch (error) {
    console.error("Error updating school name:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for subdomain change request. We don't mutate the subdomain
// directly -- it requires DNS coordination -- so this just emails the
// platform team with the requested value and an optional reason.
const subdomainRequestSchema = z.object({
  desiredSubdomain: z
    .string()
    .min(2, "Subdomain must be at least 2 characters")
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  reason: z.string().max(500).optional(),
})

export async function requestSubdomainChange(
  schoolId: string,
  data: z.infer<typeof subdomainRequestSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId
    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validated = subdomainRequestSchema.parse(data)

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { name: true, domain: true },
    })

    // Lazy import to keep this action tree-shakable for callers that
    // don't touch email infra.
    const { sendEmail } = await import("@/lib/email")
    const supportInbox =
      process.env.PLATFORM_SUPPORT_EMAIL || "support@databayt.org"

    await sendEmail({
      to: supportInbox,
      subject: `Subdomain change request: ${school?.domain ?? schoolId}`,
      template: "subdomain-change-request",
      data: {
        schoolId,
        schoolName: school?.name ?? "(unknown)",
        currentSubdomain: school?.domain ?? "",
        desiredSubdomain: validated.desiredSubdomain,
        reason: validated.reason ?? "",
        requestedBy: session?.user?.email ?? "(unknown)",
      },
    }).catch((err) => {
      console.error("[requestSubdomainChange] email failed", err)
      // Surface as failure so the UI can show an error toast.
      throw err
    })

    return { success: true }
  } catch (error) {
    console.error("Error submitting subdomain change request:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}

// Schema for name format update
const nameFormatSchema = z.object({
  nameFormat: z.enum(["split", "full"]),
})

export async function updateSchoolNameFormat(
  schoolId: string,
  data: z.infer<typeof nameFormatSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    if (!SCHOOL_CONFIG_ROLES.has(session?.user?.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const validatedData = nameFormatSchema.parse(data)

    await db.school.update({
      where: { id: schoolId },
      data: { nameFormat: validatedData.nameFormat },
    })

    revalidatePath("/school/configuration")
    revalidatePath("/school/configuration/name-format")

    return { success: true }
  } catch (error) {
    console.error("Error updating name format:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}
