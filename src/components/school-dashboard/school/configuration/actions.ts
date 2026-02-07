"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

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
  data?: unknown
}

export async function updateSchoolIdentity(
  schoolId: string,
  data: z.infer<typeof schoolIdentitySchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return { success: false, error: "Unauthorized" }
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
      return { success: false, error: "This subdomain is already taken" }
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
      },
    })

    revalidatePath("/school/configuration")

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating school identity:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return { success: false, error: "Failed to update school information" }
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
      return { success: false, error: "Unauthorized" }
    }

    // Validate input
    const validatedData = brandingSchema.parse(data)

    // Update school logoUrl if provided
    if (validatedData.logoUrl) {
      await db.school.update({
        where: { id: schoolId },
        data: {
          logoUrl: validatedData.logoUrl,
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

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating school branding:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return { success: false, error: "Failed to update branding" }
  }
}

// Schema for school location update
const schoolLocationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
})

export async function updateSchoolLocation(
  schoolId: string,
  data: z.infer<typeof schoolLocationSchema>
): Promise<ActionResult> {
  try {
    const session = await auth()
    const userSchoolId = session?.user?.schoolId

    if (!userSchoolId || userSchoolId !== schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validatedData = schoolLocationSchema.parse(data)

    const updated = await db.school.update({
      where: { id: schoolId },
      data: {
        city: validatedData.city || null,
        state: validatedData.state || null,
        country: validatedData.country || null,
      },
    })

    revalidatePath("/school/configuration")
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating school location:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return { success: false, error: "Failed to update school location" }
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
      return { success: false, error: "Unauthorized" }
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
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating school pricing:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return { success: false, error: "Failed to update school pricing" }
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
      return { success: false, error: "Unauthorized" }
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

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating plan limits:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return { success: false, error: "Failed to update plan limits" }
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
      return { success: false, error: "Unauthorized" }
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

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating school capacity:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues.map((e) => e.message).join(", "),
      }
    }
    return { success: false, error: "Failed to update capacity" }
  }
}
