/**
 * School Access Control and Management
 * Handles school creation, ownership, and access permissions
 */

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

/**
 * School access result types
 */
export interface SchoolAccessResult {
  hasAccess: boolean;
  school?: any;
  userRole?: UserRole;
  isOwner?: boolean;
  reason?: string;
}

/**
 * School creation result
 */
export interface SchoolCreationResult {
  success: boolean;
  schoolId?: string;
  school?: any;
  error?: string;
}

/**
 * Check if user can access a specific school
 */
export async function canUserAccessSchool(
  userId: string,
  schoolId: string
): Promise<SchoolAccessResult> {
  try {
    // Get user with their school association
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    });

    if (!user) {
      return { hasAccess: false, reason: "User not found" };
    }

    // Developers (platform admins) can access any school
    if (user.role === "DEVELOPER") {
      const school = await db.school.findUnique({
        where: { id: schoolId },
      });

      return {
        hasAccess: true,
        school,
        userRole: user.role,
        isOwner: false,
        reason: "Platform admin access",
      };
    }

    // Check if user belongs to this school
    if (user.schoolId === schoolId) {
      const school = await db.school.findUnique({
        where: { id: schoolId },
      });

      return {
        hasAccess: true,
        school,
        userRole: user.role,
        isOwner: true,
        reason: "User belongs to school",
      };
    }

    // Check if this is a new/orphaned school that user can claim
    const orphanedSchool = await db.school.findFirst({
      where: {
        id: schoolId,
        users: {
          none: {}, // No users associated
        },
      },
    });

    if (orphanedSchool) {
      // Allow user to claim orphaned school
      return {
        hasAccess: true,
        school: orphanedSchool,
        userRole: user.role,
        isOwner: false,
        reason: "Orphaned school can be claimed",
      };
    }

    // Check if user has been invited or has secondary access
    const schoolWithUsers = await db.school.findFirst({
      where: {
        id: schoolId,
        users: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (schoolWithUsers) {
      return {
        hasAccess: true,
        school: schoolWithUsers,
        userRole: user.role,
        isOwner: false,
        reason: "User has secondary access",
      };
    }

    return {
      hasAccess: false,
      reason: "User does not have access to this school",
    };
  } catch (error) {
    console.error("Error checking school access:", error);
    return {
      hasAccess: false,
      reason: "Error checking access permissions",
    };
  }
}

/**
 * Create or get user's school for onboarding
 */
export async function ensureUserSchool(userId: string): Promise<SchoolCreationResult> {
  try {
    // Check if user already has a school
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // If user already has a school, return it
    if (user.schoolId && user.school) {
      console.log("📚 User already has a school:", {
        userId,
        schoolId: user.schoolId,
        schoolName: user.school.name,
      });

      return {
        success: true,
        schoolId: user.schoolId,
        school: user.school,
      };
    }

    // Create a new school for the user
    console.log("🏫 Creating new school for user:", userId);

    const newSchool = await db.school.create({
      data: {
        name: "New School",
        domain: `school-${Date.now()}`,
        maxStudents: 500,
        maxTeachers: 50,
        isActive: true,
        planType: "starter",
      },
    });

    // Update user with the new school
    await db.user.update({
      where: { id: userId },
      data: { 
        schoolId: newSchool.id,
        // Set appropriate role if not set
        role: user.role || "ADMIN",
      },
    });

    console.log("✅ School created and linked to user:", {
      userId,
      schoolId: newSchool.id,
      schoolName: newSchool.name,
    });

    return {
      success: true,
      schoolId: newSchool.id,
      school: newSchool,
    };
  } catch (error) {
    console.error("Error ensuring user school:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create school",
    };
  }
}

/**
 * Switch user to a different school (for multi-school scenarios)
 */
export async function switchUserSchool(
  userId: string,
  newSchoolId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify user can access the new school
    const accessResult = await canUserAccessSchool(userId, newSchoolId);

    if (!accessResult.hasAccess) {
      return {
        success: false,
        error: accessResult.reason || "Access denied",
      };
    }

    // Update user's current school
    await db.user.update({
      where: { id: userId },
      data: { 
        schoolId: newSchoolId,
        updatedAt: new Date(), // Force session refresh
      },
    });

    console.log("🔄 User switched to school:", {
      userId,
      newSchoolId,
    });

    return { success: true };
  } catch (error) {
    console.error("Error switching school:", error);
    return {
      success: false,
      error: "Failed to switch school",
    };
  }
}

/**
 * Get or create school for onboarding flow
 */
export async function getOrCreateSchoolForOnboarding(
  userId: string,
  requestedSchoolId?: string
): Promise<{ schoolId: string; isNew: boolean; school: any }> {
  // If a specific school is requested, check access
  if (requestedSchoolId) {
    const accessResult = await canUserAccessSchool(userId, requestedSchoolId);
    
    if (accessResult.hasAccess && accessResult.school) {
      return {
        schoolId: requestedSchoolId,
        isNew: false,
        school: accessResult.school,
      };
    }
  }

  // Otherwise, ensure user has a school
  const result = await ensureUserSchool(userId);
  
  if (!result.success || !result.schoolId || !result.school) {
    throw new Error(result.error || "Failed to ensure user school");
  }

  return {
    schoolId: result.schoolId,
    isNew: !requestedSchoolId, // New if no specific school was requested
    school: result.school,
  };
}

/**
 * Validate school ownership for sensitive operations
 */
export async function validateSchoolOwnership(
  userId: string,
  schoolId: string,
  requiredRole?: UserRole
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    });

    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    // Developers (platform admins) bypass all checks
    if (user.role === "DEVELOPER") {
      return { isValid: true };
    }

    // Check school association
    if (user.schoolId !== schoolId) {
      // For onboarding, allow access to orphaned schools
      const isOrphaned = await db.school.findFirst({
        where: {
          id: schoolId,
          users: { none: {} },
        },
      });

      if (!isOrphaned) {
        return { isValid: false, error: "User does not own this school" };
      }
    }

    // Check role requirements
    if (requiredRole) {
      const roleHierarchy: Record<UserRole, number> = {
        USER: 1,
        STUDENT: 2,
        GUARDIAN: 3,
        STAFF: 4,
        ACCOUNTANT: 5,
        TEACHER: 6,
        ADMIN: 7,
        DEVELOPER: 8,
      };

      if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
        return { isValid: false, error: "Insufficient permissions" };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error validating ownership:", error);
    return { isValid: false, error: "Validation error" };
  }
}

/**
 * Sync user session with school context
 */
export async function syncUserSchoolContext(userId: string): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        schoolId: true,
        updatedAt: true,
      },
    });

    if (user) {
      // Force a session update by updating the user record
      await db.user.update({
        where: { id: userId },
        data: { updatedAt: new Date() },
      });

      console.log("🔄 User school context synced:", {
        userId,
        schoolId: user.schoolId,
      });
    }
  } catch (error) {
    console.error("Error syncing school context:", error);
  }
}