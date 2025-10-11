/**
 * Onboarding Route Handler
 * Ensures proper school context and access for onboarding flow
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  getOrCreateSchoolForOnboarding,
  syncUserSchoolContext 
} from "@/lib/school-access";

export async function ensureOnboardingAccess(requestedSchoolId?: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    console.log("🔒 [ONBOARDING] No authenticated user, redirecting to login");
    redirect("/login");
  }

  const userId = session.user.id;
  
  try {
    // Get or create school for onboarding
    const { schoolId, isNew, school } = await getOrCreateSchoolForOnboarding(
      userId,
      requestedSchoolId
    );

    console.log("🎯 [ONBOARDING] School context established:", {
      userId,
      schoolId,
      isNew,
      schoolName: school.name,
      requestedSchoolId,
      sessionSchoolId: session.user.schoolId,
    });

    // If the school ID doesn't match what was requested, redirect to correct URL
    if (requestedSchoolId && requestedSchoolId !== schoolId) {
      console.log("🔄 [ONBOARDING] Redirecting to correct school:", {
        from: requestedSchoolId,
        to: schoolId,
      });
      redirect(`/onboarding/${schoolId}`);
    }

    // Sync the user's school context to ensure session consistency
    await syncUserSchoolContext(userId);

    return {
      schoolId,
      school,
      userId,
      isNew,
    };
  } catch (error) {
    console.error("❌ [ONBOARDING] Error ensuring access:", error);
    
    // Fallback: redirect to onboarding overview
    redirect("/onboarding");
  }
}