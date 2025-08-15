"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { locationSchema } from "./validation";

export type LocationFormData = z.infer<typeof locationSchema>;

export async function updateSchoolLocation(
  schoolId: string,
  data: LocationFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const validatedData = locationSchema.parse(data);

    // Update school location in database
    const updatedSchool = await db.school.update({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety with schoolId from session
        // schoolId: session.schoolId 
      },
      data: {
        address: `${validatedData.address}, ${validatedData.city}, ${validatedData.state}, ${validatedData.country} ${validatedData.postalCode}`,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/location`);
    
    return {
      success: true,
      data: updatedSchool,
    };
  } catch (error) {
    console.error("Error updating school location:", error);
    
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

export async function getSchoolLocation(schoolId: string) {
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
        address: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    return {
      success: true,
      data: {
        address: school.address || "",
      },
    };
  } catch (error) {
    console.error("Error fetching school location:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function proceedToCapacity(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Validate that location data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { address: true },
    });

    if (!school?.address?.trim()) {
      throw new Error("Please complete location information before proceeding");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to capacity:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/capacity`);
}
