import { z } from "zod"

export const staffCreateSchema = z.object({
  // Basic Information
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  gender: z.string().optional(),
  emailAddress: z.string().email("Invalid email address"),
  birthDate: z.coerce.date().optional(),

  // Position Information
  employeeId: z.string().optional(),
  position: z.string().optional(),
  departmentId: z.string().optional(),
  employmentStatus: z
    .enum(["ACTIVE", "ON_LEAVE", "TERMINATED", "RETIRED"])
    .default("ACTIVE"),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"])
    .default("FULL_TIME"),
  joiningDate: z.coerce.date().optional(),
  contractStartDate: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),

  // Contact Information
  phoneNumber: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),

  // Emergency Contact
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),

  // Profile
  profilePhotoUrl: z.string().optional(),
})

export const staffUpdateSchema = staffCreateSchema.partial()

export type StaffCreateInput = z.infer<typeof staffCreateSchema>
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>
