"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
export async function createListing(data: ListingFormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const listing = await db.school.create({
      data: {
        ...data,
        // TODO: Add schoolId for multi-tenant safety
        // schoolId: session.schoolId,
        name: data.name || "New School", // Ensure required fields are set
        domain: data.domain || `school-${Date.now()}`,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/onboarding");
    return { success: true, data: listing };
  } catch (error) {
    console.error("Error creating listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function updateListing(id: string, data: Partial<ListingFormData>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const listing = await db.school.update({
      where: { 
        id,
        // TODO: Add multi-tenant safety
        // schoolId: session.schoolId 
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/onboarding");
    return { success: true, data: listing };
  } catch (error) {
    console.error("Error updating listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function getListing(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    const listing = await db.school.findUnique({
      where: { 
        id,
        // TODO: Add multi-tenant safety
        // schoolId: session.schoolId 
      },
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    return { success: true, data: listing };
  } catch (error) {
    console.error("Error fetching listing:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function initializeSchoolSetup(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    if (session.user.id !== userId) {
      throw new Error("Access denied");
    }

    // Create a new school draft for the user
    const school = await db.school.create({
      data: {
        name: "New School",
        domain: `school-${Date.now()}`, // Temporary domain
        // TODO: Add schoolId for multi-tenant safety
        // schoolId: session.schoolId,
        updatedAt: new Date(),
        // Set default values using available fields
        maxStudents: 400,
        maxTeachers: 10,
      },
    });

    revalidatePath("/onboarding");
    
    return {
      success: true,
      data: school,
    };
  } catch (error) {
    console.error("Error initializing school setup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function getSchoolSetupStatus(schoolId: string) {
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

    return {
      success: true,
      data: {
        ...school,
        completionPercentage,
        nextStep: getNextStep(school),
      },
    };
  } catch (error) {
    console.error("Error fetching school setup status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
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
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to title:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/title`);
}