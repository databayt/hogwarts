"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";
import { locationSchema } from "./validation";

export type LocationFormData = z.infer<typeof locationSchema>;

export async function updateSchoolLocation(
  schoolId: string,
  data: LocationFormData
): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const validatedData = locationSchema.parse(data);

    // Format full address without postal code
    const addressParts = [
      validatedData.address,
      validatedData.city,
      validatedData.state,
      validatedData.country
    ].filter(Boolean); // Remove empty parts
    
    const fullAddress = addressParts.join(', ');
    
    // Update school location in database
    const updatedSchool = await db.school.update({
      where: { id: schoolId },
      data: {
        address: fullAddress,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}/location`);
    
    return createActionResponse(updatedSchool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createActionResponse(undefined, error);
    }
    
    return createActionResponse(undefined, error);
  }
}

export async function getSchoolLocation(schoolId: string): Promise<ActionResponse> {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        address: true,
      },
    });

    if (!school) {
      throw new Error("School not found");
    }

    // Parse the concatenated address string
    let parsedAddress = {
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
    };

    if (school.address) {
      // Simple parsing of "address, city, state, country"
      const parts = school.address.split(',').map(part => part.trim());
      if (parts.length >= 1) {
        parsedAddress.address = parts[0] || "";
        parsedAddress.city = parts[1] || "";
        parsedAddress.state = parts[2] || "";
        parsedAddress.country = parts[3] || "";
      }
    }

    return createActionResponse(parsedAddress);
  } catch (error) {
    return createActionResponse(undefined, error);
  }
}

export async function proceedToCapacity(schoolId: string) {
  try {
    // Validate user has ownership/access to this school
    await requireSchoolOwnership(schoolId);

    // Validate that location data exists
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { address: true },
    });

    if (!school?.address?.trim()) {
      throw new Error("Please complete location information before proceeding");
    }

    revalidatePath(`/onboarding/${schoolId}`);
  } catch (error) {
    console.error("Error proceeding to capacity:", error);
    throw error;
  }

  redirect(`/onboarding/${schoolId}/capacity`);
}
