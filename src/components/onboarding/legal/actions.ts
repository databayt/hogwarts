"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";

export async function completeOnboarding(
  schoolId: string,
  legalData: {
    operationalStatus: string;
    safetyFeatures: string[];
  }
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    // Update school with legal data and mark as onboarded
    const school = await db.school.update({
      where: { id: schoolId },
      data: {
        operationalStatus: legalData.operationalStatus,
        safetyFeatures: legalData.safetyFeatures,
        isActive: true,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        domain: true,
      }
    });

    if (!school.domain) {
      throw new Error("School subdomain not configured. Please complete the subdomain step.");
    }

    // Revalidate the onboarding path
    revalidatePath(`/onboarding/${schoolId}`);
    
    return createActionResponse({
      success: true,
      school,
      redirectUrl: `/onboarding/${schoolId}/congratulations`
    });
  } catch (error) {
    console.error("Failed to complete onboarding:", error);
    return createActionResponse(undefined, error);
  }
}

export async function getSchoolOnboardingStatus(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
        onboardingCompletedAt: true,
      }
    });

    if (!school) {
      throw new Error("School not found");
    }

    return createActionResponse({
      isCompleted: !!school.onboardingCompletedAt,
      isActive: school.isActive,
      domain: school.domain,
      name: school.name
    });
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}