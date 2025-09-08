"use server";

import { revalidatePath } from "next/cache";
import { 
  getAuthContext, 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";

// About School step - informational only, no data to update
export async function markAboutSchoolViewed(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    // This is just an informational step, so we just validate access
    // and mark it as viewed for analytics if needed
    
    revalidatePath(`/onboarding/${schoolId}`);
    return createActionResponse({ viewed: true });
  } catch (error) {
    console.error("Failed to mark about school viewed:", error);
    return createActionResponse(undefined, error);
  }
}

export async function getOnboardingWelcomeData(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    // Return welcome data and stats if needed
    const welcomeData = {
      totalSteps: 10,
      estimatedTime: "10-15 minutes",
      completionRate: 85, // percentage of users who complete
    };
    
    return createActionResponse(welcomeData);
  } catch (error) {
    console.error("Failed to get welcome data:", error);
    return createActionResponse(undefined, error);
  }
}