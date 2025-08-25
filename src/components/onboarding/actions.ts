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

// Types for listing actions
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

// Listing CRUD actions
export async function createListing(data: ListingFormData): Promise<ActionResponse> {
  try {
    // Authentication is now handled at middleware level - just get the context for user ID
    const authContext = await getAuthContext();

    // Sanitize and validate input data
    const sanitizedData = {
      ...data,
      name: data.name?.trim() || "New School",
      domain: data.domain?.toLowerCase().trim() || `school-${Date.now()}`,
      updatedAt: new Date(),
      // Link to the authenticated user (ensure this field exists in your schema)
      // ownerId: authContext.userId, // Uncomment if you have this field
    };

    // Validate domain uniqueness
    if (sanitizedData.domain !== `school-${Date.now()}`) {
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

    const listing = await db.school.create({
      data: sanitizedData,
    });

    revalidatePath("/onboarding");
    return createActionResponse(listing);
  } catch (error) {
    console.error("Failed to create school listing:", error);
    return createActionResponse(undefined, error);
  }
}

export async function updateListing(id: string, data: Partial<ListingFormData>): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(id);

    const listing = await db.school.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/onboarding");
    return createActionResponse(listing);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function getListing(id: string): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(id);

    const listing = await db.school.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new Error("School not found");
    }

    return createActionResponse(listing);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function getUserSchools(): Promise<ActionResponse> {
  try {
    const authContext = await getAuthContext();

    // Get all schools associated with this user (drafts and completed)
    const schools = await db.school.findMany({
      where: {
        // Add your user relationship field here when available
        // ownerId: authContext.userId,
        // For now, we'll use a different approach or get all and filter by session
      },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
        updatedAt: true,
        maxStudents: true,
        maxTeachers: true,
        planType: true, // This contains school level/type info
        address: true,
        website: true, // This contains pricing info
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
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Calculate setup completion percentage
    const checks = [
      !!school.name && school.name !== "New School",
      !!school.address,
      !!school.planType?.includes('-'), // Has school description
      !!school.website?.startsWith('pricing-set-'), // Has pricing
      !!school.maxStudents,
      !!school.maxTeachers,
    ];
    
    const completionPercentage = Math.round((checks.filter(Boolean).length / checks.length) * 100);

    return createActionResponse({
      ...school,
      completionPercentage,
      nextStep: getNextStep(school),
    });
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

function getNextStep(school: any) {
  if (!school.name || school.name === "New School") {
    return "title";
  }
  if (!school.planType?.includes('-')) {
    return "description";
  }
  if (!school.address) {
    return "location";
  }
  if (!school.maxStudents || !school.maxTeachers) {
    return "capacity";
  }
  if (!school.website?.startsWith('pricing-set-')) {
    return "price";
  }
  return "finish-setup";
}

export async function proceedToTitle(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to title:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/title`);
}