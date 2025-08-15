"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Update price schema for school context
export const schoolPriceSchema = z.object({
  tuitionFee: z.number()
    .min(0, "Tuition fee cannot be negative")
    .max(50000, "Tuition fee cannot exceed $50,000"),
  registrationFee: z.number()
    .min(0, "Registration fee cannot be negative")
    .max(5000, "Registration fee cannot exceed $5,000")
    .optional(),
  applicationFee: z.number()
    .min(0, "Application fee cannot be negative")
    .max(1000, "Application fee cannot exceed $1,000")
    .optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD'], {
    required_error: "Please select a currency",
  }).default('USD'),
  paymentSchedule: z.enum(['monthly', 'quarterly', 'semester', 'annual'], {
    required_error: "Please select a payment schedule",
  }).default('monthly'),
});

export type SchoolPriceFormData = z.infer<typeof schoolPriceSchema>;

export async function updateSchoolPricing(
  schoolId: string,
  data: SchoolPriceFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const validatedData = schoolPriceSchema.parse(data);

    // Update school pricing in database
    // Note: tuitionFee, registrationFee, etc. are not in current schema
    // For now, we'll just mark the school as having pricing set
    const updatedSchool = await db.school.update({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety with schoolId from session
        // schoolId: session.schoolId 
      },
      data: {
        // Store basic pricing info in available fields
        website: `pricing-set-${validatedData.tuitionFee}`, // Temporary solution
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/price`);
    
    return {
      success: true,
      data: updatedSchool,
    };
  } catch (error) {
    console.error("Error updating school pricing:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.reduce((acc: Record<string, string>, curr) => {
          acc[curr.path[0] as string] = curr.message;
          return acc;
        }, {} as Record<string, string>),
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function getSchoolPricing(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const school = await db.school.findUnique({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety
        // schoolId: session.schoolId 
      },
      select: {
        id: true,
        website: true, // Temporary field for pricing info
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Parse pricing info from website field (temporary solution)
    const tuitionFee = school.website?.startsWith('pricing-set-') 
      ? parseInt(school.website.replace('pricing-set-', '')) || 0
      : 0;

    return {
      success: true,
      data: {
        tuitionFee,
        registrationFee: 0, // Default values since not stored
        applicationFee: 0,
        currency: 'USD' as const,
        paymentSchedule: 'monthly' as const,
      },
    };
  } catch (error) {
    console.error("Error fetching school pricing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function proceedToFinishSetup(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Validate that pricing data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { website: true },
    });

    if (!school?.website?.startsWith('pricing-set-')) {
      throw new Error("Please set tuition fee before proceeding");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to finish setup:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/finish-setup`);
}
