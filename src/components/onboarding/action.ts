"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { 
  getAuthContext, 
  requireSchoolAccess,
  requireSchoolOwnership,
  requireRole,
  createActionResponse,
  createTenantSafeWhere,
  type ActionResponse 
} from "@/lib/auth-security";
import type { OnboardingSchoolData, OnboardingStep } from './type';
import { onboardingValidation } from './validation';

// Legacy interface for backward compatibility
export interface ListingFormData {
  id?: string;
  name?: string;
  description?: string;
  propertyType?: string;
  address?: string;
  maxStudents?: number;
  maxTeachers?: number;
  planType?: string;
  website?: string;
  pricePerNight?: number;
  domain?: string;
  // Branding fields
  logo?: string;
  primaryColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  // Capacity fields
  maxClasses?: number;
  maxFacilities?: number;
  // School fields
  schoolLevel?: 'primary' | 'secondary' | 'both';
  schoolType?: 'private' | 'public' | 'international' | 'technical' | 'special';
  // Pricing fields
  tuitionFee?: number;
  registrationFee?: number;
  applicationFee?: number;
  currency?: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  paymentSchedule?: 'monthly' | 'quarterly' | 'semester' | 'annual';
  // Listing fields
  title?: string;
  city?: string;
  state?: string;
  guestCount?: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  // Status fields
  draft?: boolean;
  isPublished?: boolean;
}

// Main onboarding school actions
export async function createSchool(data: OnboardingSchoolData): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();
    
    // Validate input data
    const validationResult = onboardingValidation.parse(data);
    
    // Sanitize and prepare data
    const sanitizedData = {
      ...validationResult,
      name: validationResult.name?.trim() || "New School",
      domain: validationResult.domain?.toLowerCase().trim() || `school-${Date.now()}`,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    // Validate domain uniqueness
    if (sanitizedData.domain && !sanitizedData.domain.includes(`school-${Date.now()}`)) {
      const existingDomain = await db.school.findFirst({
        where: { domain: sanitizedData.domain },
        select: { id: true }
      });

      if (existingDomain) {
        return createActionResponse(undefined, {
          message: "Domain already exists",
          name: "ValidationError"
        });
      }
    }

    const school = await db.school.create({
      data: sanitizedData,
    });

    revalidatePath("/onboarding");
    return createActionResponse(school);
  } catch (error) {
    console.error("Failed to create school:", error);
    return createActionResponse(undefined, error);
  }
}

// Legacy function for backward compatibility
export async function createListing(data: ListingFormData): Promise<ActionResponse> {
  return createSchool(data as OnboardingSchoolData);
}

export async function updateSchool(id: string, data: Partial<OnboardingSchoolData>): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(id);

    // Validate partial data if provided
    if (Object.keys(data).length > 0) {
      try {
        onboardingValidation.partial().parse(data);
      } catch (validationError) {
        return createActionResponse(undefined, {
          message: "Invalid data provided",
          name: "ValidationError"
        });
      }
    }

    const school = await db.school.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/onboarding");
    revalidatePath(`/onboarding/${id}`);
    return createActionResponse(school);
  } catch (error) {
    console.error(`Failed to update school ${id}:`, error);
    return createActionResponse(undefined, error);
  }
}

// Legacy function for backward compatibility
export async function updateListing(id: string, data: Partial<ListingFormData>): Promise<ActionResponse> {
  return updateSchool(id, data as Partial<OnboardingSchoolData>);
}

export async function getSchool(id: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(id);

    const school = await db.school.findUnique({
      where: { id },
      include: {
        // Include any related data needed for onboarding
        // users: true,
        // subscriptions: true,
      },
    });

    if (!school) {
      return createActionResponse(undefined, {
        message: "School not found",
        name: "NotFoundError"
      });
    }

    return createActionResponse(school);
  } catch (error) {
    console.error(`Failed to get school ${id}:`, error);
    return createActionResponse(undefined, error);
  }
}

// Legacy function for backward compatibility
export async function getListing(id: string): Promise<ActionResponse> {
  return getSchool(id);
}

export async function getUserSchools(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();

    // Get all schools associated with this user (drafts and completed)
    const schools = await db.school.findMany({
      where: createTenantSafeWhere({
        // Add user filtering when user-school relationship is available
        // ownerId: authContext.userId,
      }),
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
        updatedAt: true,
        maxStudents: true,
        maxTeachers: true,
        planType: true,
        address: true,
        website: true,
        // Additional fields for better UX
        description: true,
        logo: true,
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return createActionResponse(schools);
  } catch (error) {
    console.error("Failed to get user schools:", error);
    return createActionResponse(undefined, error);
  }
}

export async function initializeSchoolSetup(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();

    // Create a new school draft for the authenticated user
    const school = await db.school.create({
      data: {
        name: "New School",
        domain: `school-${Date.now()}`, // Temporary domain
        updatedAt: new Date(),
        createdAt: new Date(),
        // Set default values using available fields
        maxStudents: 400,
        maxTeachers: 10,
        // Link to user when field is available
        // ownerId: authContext.userId,
      },
    });

    revalidatePath("/onboarding");
    
    return createActionResponse(school);
  } catch (error) {
    console.error("Failed to initialize school setup:", error);
    return createActionResponse(undefined, error);
  }
}

/**
 * Reserve a subdomain for a school during onboarding
 */
export async function reserveSubdomainForSchool(
  schoolId: string,
  subdomain: string
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    // Import the subdomain actions
    const { reserveSubdomain } = await import('@/lib/subdomain-actions');
    
    // Reserve the subdomain
    const result = await reserveSubdomain(subdomain, schoolId);
    
    if (result.success) {
      revalidatePath("/onboarding");
    }
    
    return createActionResponse(result);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function getSchoolSetupStatus(schoolId: string): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        address: true,
        maxStudents: true,
        maxTeachers: true,
        planType: true,
        website: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        logo: true,
        domain: true,
      },
    });

    if (!school) {
      return createActionResponse(undefined, {
        message: "School not found",
        name: "NotFoundError"
      });
    }

    // Calculate setup completion percentage
    const checks = [
      !!school.name && school.name !== "New School",
      !!school.address,
      !!school.description,
      !!school.maxStudents && school.maxStudents > 0,
      !!school.maxTeachers && school.maxTeachers > 0,
      !!school.planType,
    ];
    
    const completionPercentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return createActionResponse({
      ...school,
      completionPercentage,
      nextStep: getNextStep(school),
    });
  } catch (error) {
    console.error(`Failed to get school setup status for ${schoolId}:`, error);
    return createActionResponse(undefined, error);
  }
}

function getNextStep(school: any): OnboardingStep {
  if (!school.name || school.name === "New School") {
    return "title";
  }
  if (!school.description) {
    return "description";
  }
  if (!school.address) {
    return "location";
  }
  if (!school.maxStudents || !school.maxTeachers) {
    return "capacity";
  }
  if (!school.logo) {
    return "branding";
  }
  if (!school.planType) {
    return "price";
  }
  return "finish-setup";
}

export async function proceedToNextStep(schoolId: string): Promise<void> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const statusResponse = await getSchoolSetupStatus(schoolId);
    if (!statusResponse.success || !statusResponse.data) {
      throw new Error("Failed to get school status");
    }

    const nextStep = statusResponse.data.nextStep;
    revalidatePath(`/onboarding/${schoolId}`);
    redirect(`/onboarding/${schoolId}/${nextStep}`);
  } catch (error) {
    console.error("Error proceeding to next step:", error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function proceedToTitle(schoolId: string): Promise<void> {
  return proceedToNextStep(schoolId);
}