import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createCapacitySchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    studentCount: z
      .number()
      .min(1, { message: v.get("atLeastOneStudent") })
      .max(10000, { message: v.get("maxStudentsLimit") }),
    teachers: z
      .number()
      .min(1, { message: v.get("atLeastOneTeacher") })
      .max(500, { message: v.get("maxTeachersLimit") }),
    classrooms: z
      .number()
      .min(1, { message: v.get("atLeastOneClassroom") })
      .max(100, { message: v.get("maxClassroomsLimit") }),
    facilities: z
      .number()
      .min(1, { message: v.get("atLeastOneFacility") })
      .max(50, { message: v.get("maxFacilitiesLimit") }),
  })
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const capacitySchema = z.object({
  studentCount: z
    .number()
    .min(1, "School must accommodate at least 1 student")
    .max(10000, "Student count cannot exceed 10,000"),
  teachers: z
    .number()
    .min(1, "School must have at least 1 teacher")
    .max(500, "Teacher count cannot exceed 500"),
  classrooms: z
    .number()
    .min(1, "School must have at least 1 classroom")
    .max(100, "Classroom count cannot exceed 100"),
  facilities: z
    .number()
    .min(1, "School must have at least 1 facility")
    .max(50, "Facilities count cannot exceed 50"),
})

export type CapacityFormData = z.infer<typeof capacitySchema>
