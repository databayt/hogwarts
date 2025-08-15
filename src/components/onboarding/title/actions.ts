"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { titleSchema } from "./validation";

export type TitleFormData = z.infer<typeof titleSchema>;

export async function updateSchoolTitle(
  schoolId: string,
  data: TitleFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const validatedData = titleSchema.parse(data);

    // Update school title in database
    const updatedSchool = await db.school.update({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety with schoolId from session
        // schoolId: session.schoolId 
      },
      data: {
        name: validatedData.title,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/title`);
    
    return {
      success: true,
      data: updatedSchool,
    };
  } catch (error) {
    console.error("Error updating school title:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.reduce((acc: Record<string, string>, curr) => {
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

export async function getSchoolTitle(schoolId: string) {
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
        name: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    return {
      success: true,
      data: {
        title: school.name || "",
      },
    };
  } catch (error) {
    console.error("Error fetching school title:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function proceedToDescription(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

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
