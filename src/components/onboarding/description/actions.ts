"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Define description schema
export const descriptionSchema = z.object({
  schoolLevel: z.enum(['primary', 'secondary', 'both'], {
    required_error: "Please select a school level",
  }),
  schoolType: z.enum(['private', 'public', 'international', 'technical', 'special'], {
    required_error: "Please select a school type",
  }),
});

export type DescriptionFormData = z.infer<typeof descriptionSchema>;

export async function updateSchoolDescription(
  schoolId: string,
  data: DescriptionFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const validatedData = descriptionSchema.parse(data);

    // Update school description in database
    // Note: schoolLevel and schoolType are not in current schema
    // Storing in planType as a temporary solution until schema is updated
    const schoolInfo = `${validatedData.schoolLevel}-${validatedData.schoolType}`;
    const updatedSchool = await db.school.update({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety with schoolId from session
        // schoolId: session.schoolId 
      },
      data: {
        planType: schoolInfo, // Temporary storage until proper fields are added
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/description`);
    
    return {
      success: true,
      data: updatedSchool,
    };
  } catch (error) {
    console.error("Error updating school description:", error);
    
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

export async function getSchoolDescription(schoolId: string) {
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
        planType: true, // Temporary field for school info
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Parse stored school info from planType field
    const [schoolLevel, schoolType] = school.planType?.includes('-') 
      ? school.planType.split('-') 
      : [null, null];

    return {
      success: true,
      data: {
        schoolLevel: schoolLevel as 'primary' | 'secondary' | 'both' | null,
        schoolType: schoolType as 'private' | 'public' | 'international' | 'technical' | 'special' | null,
      },
    };
  } catch (error) {
    console.error("Error fetching school description:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function proceedToLocation(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Validate that description data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { planType: true },
    });

    if (!school?.planType?.includes('-')) {
      throw new Error("Please complete school description before proceeding");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to location:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/location`);
}
