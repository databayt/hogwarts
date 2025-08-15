"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { floorPlanSchema } from "./validation";

export type CapacityFormData = z.infer<typeof floorPlanSchema>;

export async function updateSchoolCapacity(
  schoolId: string,
  data: CapacityFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // TODO: Add schoolId validation to ensure user has access to this school
    // const hasAccess = await checkSchoolAccess(session.user.id, schoolId);
    // if (!hasAccess) {
    //   throw new Error("Access denied");
    // }

    const validatedData = floorPlanSchema.parse(data);

    // Update school capacity in database
    const updatedSchool = await db.school.update({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety with schoolId from session
        // schoolId: session.schoolId 
      },
      data: {
        maxStudents: validatedData.studentCount,
        maxTeachers: validatedData.teachers,
        // Note: facilityCount is not in schema, storing in description for now
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/capacity`);
    
    return {
      success: true,
      data: updatedSchool,
    };
  } catch (error) {
    console.error("Error updating school capacity:", error);
    
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

export async function getSchoolCapacity(schoolId: string) {
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
        maxStudents: true,
        maxTeachers: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    return {
      success: true,
      data: {
        studentCount: school.maxStudents || 400,
        teachers: school.maxTeachers || 10,
        facilities: 5, // Default since not in schema
      },
    };
  } catch (error) {
    console.error("Error fetching school capacity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function proceedToNextStep(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // Validate that capacity data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { maxStudents: true },
    });

    if (!school?.maxStudents) {
      throw new Error("Please set school capacity before proceeding");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to next step:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/location`);
}
