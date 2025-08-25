"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { titleSchema } from "./validation";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";

export type TitleFormData = z.infer<typeof titleSchema>;

export async function updateSchoolTitle(
  schoolId: string,
  data: TitleFormData
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const validatedData = titleSchema.parse(data);

    // Update school title in database
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        name: validatedData.title,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/title`);
    
    return createActionResponse(updatedSchool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, {
        message: "Validation failed",
        name: "ValidationError",
        issues: error.issues
      });
    }
    
    return createActionResponse(undefined, error);
  }
}

export async function getSchoolTitle(schoolId: string): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    return createActionResponse({
      title: school.name || "",
    });
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function proceedToDescription(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    // Validate that title exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });

    if (!school?.name?.trim()) {
      throw new Error("Please set school name before proceeding");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to description:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/description`);
}
