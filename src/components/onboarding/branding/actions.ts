"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { brandingSchema } from "./validation";

export type BrandingFormData = z.infer<typeof brandingSchema>;

export async function updateSchoolBranding(
  schoolId: string,
  data: BrandingFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const validatedData = brandingSchema.parse(data);

    // Update school branding in database
    const updatedSchool = await db.school.update({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety with schoolId from session
        // schoolId: session.schoolId 
      },
      data: {
        logoUrl: validatedData.logoUrl,
        name: validatedData.brandName,
        // Note: primaryColor and secondaryColor are not in current schema
        // Store in available fields temporarily
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/branding`);
    
    return {
      success: true,
      data: updatedSchool,
    };
  } catch (error) {
    console.error("Error updating school branding:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.reduce((acc: Record<string, string>, curr: any) => {
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

export async function getSchoolBranding(schoolId: string) {
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
        logoUrl: true,
        name: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    return {
      success: true,
      data: {
        logoUrl: school.logoUrl || "",
        brandName: school.name || "",
        primaryColor: "#000000", // Default values since not in schema
        secondaryColor: "#ffffff",
        tagline: "",
      },
    };
  } catch (error) {
    console.error("Error fetching school branding:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function proceedToNext(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to next step:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/import`);
}
