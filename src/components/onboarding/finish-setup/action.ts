"use server";

import { revalidatePath } from "next/cache";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";

// Finish Setup step - just marks completion
export async function markFinishSetupViewed(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    // This is just a declaration step for completion
    revalidatePath(`/onboarding/${schoolId}`);
    return createActionResponse({ viewed: true });
  } catch (error) {
    console.error("Failed to mark finish setup viewed:", error);
    return createActionResponse(undefined, error);
  }
}