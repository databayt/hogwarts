"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";
import { brandingSchema } from "./validation";

export type BrandingFormData = z.infer<typeof brandingSchema>;

export async function updateSchoolBranding(
  schoolId: string,
  data: BrandingFormData
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const validatedData = brandingSchema.parse(data);

    // Update school branding in database
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        logoUrl: validatedData.logoUrl,
        name: validatedData.brandName,
        // Note: primaryColor and secondaryColor are not in current schema
        // Store in available fields temporarily
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/branding`);
    
    return createActionResponse(updatedSchool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, error);
    }
    
    return createActionResponse(undefined, error);
  }
}

export async function getSchoolBranding(schoolId: string): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        logoUrl: true,
        name: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    return createActionResponse({
      logoUrl: school.logoUrl || "",
      brandName: school.name || "",
      primaryColor: "#000000", // Default values since not in schema
      secondaryColor: "#ffffff",
      tagline: "",
    });
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function proceedToNext(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to next step:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/import`);
}
