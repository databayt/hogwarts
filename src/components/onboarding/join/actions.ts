"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { joinSchema } from "./validation";

export type JoinFormData = z.infer<typeof joinSchema>;

export async function updateJoinSettings(
  schoolId: string,
  data: JoinFormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const validatedData = joinSchema.parse(data);

    // Update school join settings in database
    // Note: These fields are not in current schema, storing in email field temporarily
    const joinSettings = JSON.stringify(validatedData);
    const updatedSchool = await db.school.update({
      where: { 
        id: schoolId,
        // TODO: Add multi-tenant safety with schoolId from session
        // schoolId: session.schoolId 
      },
      data: {
        email: `join-settings:${joinSettings}`, // Temporary storage
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/join`);
    
    return {
      success: true,
      data: updatedSchool,
    };
  } catch (error) {
    console.error("Error updating join settings:", error);
    
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

export async function getJoinSettings(schoolId: string) {
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
        email: true, // Temporary field for join settings
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Parse join settings from email field
    let joinSettings: JoinFormData = {
      joinMethod: 'invite-with-codes',
      autoApproval: false,
      requireParentApproval: true,
      allowSelfEnrollment: false,
    };

    if (school.email?.startsWith('join-settings:')) {
      try {
        const parsed = JSON.parse(school.email.replace('join-settings:', ''));
        joinSettings = { ...joinSettings, ...parsed };
      } catch (e) {
        console.warn('Failed to parse join settings');
      }
    }

    return {
      success: true,
      data: joinSettings,
    };
  } catch (error) {
    console.error("Error fetching join settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function proceedToVisibility(schoolId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to visibility:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/visibility`);
}
