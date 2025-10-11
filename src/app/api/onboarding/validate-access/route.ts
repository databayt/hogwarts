import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { 
  getOrCreateSchoolForOnboarding,
  syncUserSchoolContext 
} from '@/lib/school-access';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { schoolId: requestedSchoolId } = await request.json();
    const userId = session.user.id;

    console.log("🔍 [API] Validating school access:", {
      userId,
      requestedSchoolId,
      sessionSchoolId: session.user.schoolId,
    });

    // Get or create school for onboarding
    const { schoolId, isNew, school } = await getOrCreateSchoolForOnboarding(
      userId,
      requestedSchoolId
    );

    // If the school ID doesn't match what was requested, return redirect
    if (requestedSchoolId && requestedSchoolId !== schoolId) {
      console.log("🔄 [API] School ID mismatch, suggesting redirect:", {
        requested: requestedSchoolId,
        actual: schoolId,
      });
      
      return NextResponse.json({
        success: false,
        redirectTo: `/onboarding/${schoolId}/title`,
      });
    }

    // Sync the user's school context
    await syncUserSchoolContext(userId);

    return NextResponse.json({
      success: true,
      schoolId,
      schoolName: school.name,
      isNew,
    });

  } catch (error) {
    console.error("❌ [API] Error validating access:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate access' 
      },
      { status: 500 }
    );
  }
}