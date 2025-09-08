"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { 
  requireSchoolOwnership,
  createActionResponse,
  type ActionResponse 
} from "@/lib/auth-security";
import { standOutValidation } from './validation';
import type { StandOutFormData } from './type';

export async function updateStandOutFeatures(
  schoolId: string, 
  data: StandOutFormData
): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    // Validate input data
    const validatedData = standOutValidation.parse(data);
    
    // Update school with stand-out features
    const school = await db.school.update({
      where: { id: schoolId },
      data: {
        // Store features in a way that fits your schema
        // This could be in a JSON field or separate table
        description: validatedData.features.length > 0 
          ? `${validatedData.description || ''}\n\nKey Features:\n${validatedData.features.join(', ')}`
          : validatedData.description,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/onboarding/${schoolId}`);
    return createActionResponse(school);
  } catch (error) {
    console.error("Failed to update stand-out features:", error);
    return createActionResponse(undefined, error);
  }
}

export async function getStandOutData(schoolId: string): Promise<ActionResponse> {
  try {
    await requireSchoolOwnership(schoolId);
    
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: {
        description: true,
        // Add other fields that might contain stand-out features
      },
    });

    if (!school) {
      return createActionResponse(undefined, {
        message: "School not found",
        name: "NotFoundError"
      });
    }

    // Extract stand-out features from description or other fields
    // This is a simplified approach - you might have a dedicated field/table
    const features: string[] = [];
    if (school.description?.includes('Key Features:')) {
      const featuresSection = school.description.split('Key Features:')[1];
      features.push(...featuresSection.split(',').map(f => f.trim()).filter(Boolean));
    }

    return createActionResponse({
      description: school.description,
      features,
    });
  } catch (error) {
    console.error("Failed to get stand-out data:", error);
    return createActionResponse(undefined, error);
  }
}