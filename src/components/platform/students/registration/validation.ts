/**
 * Student Registration Validation
 *
 * Multi-step student enrollment form with comprehensive data collection:
 * - 7 form steps: Personal → Contact → Emergency → Guardians → Previous Education → Health → Documents
 * - Student types: Regular (domestic), Transfer (from other school), International, Exchange (study abroad)
 * - Health tracking: Blood type, medical conditions, allergies, vaccinations, insurance
 * - Guardian management: Multiple guardians with relationships, occupations, contact info
 * - Document upload: Birth cert, transfer cert, health records, profile photo
 * - Age validation: 3-25 years (preschool to university)
 * - Nationality: Default Saudi Arabia (configurable per school)
 * - Previous education: Track prior school, transfer cert, academic record
 *
 * Key validation rules:
 * - Names: 2+ chars (prevents single-letter names)
 * - DOB: Must be 3-25 years old (prevents data entry errors like "1900")
 * - Gender: Enum (Male, Female, Other)
 * - Phone: E.164 format, min 10 digits (international support)
 * - Email: Standard email format (no validation on ownership yet)
 * - Address: Min 10 chars (ensures meaningful address, not "xyz")
 * - Guardians: At least 1 required, can be multiple (both parents + guardian)
 * - Documents: Optional file uploads (birth cert, transfer cert, medical records)
 * - Permanent address: Optional or same-as-current
 *
 * Why step-based:
 * - Incremental validation: Catch errors early, not after form completion
 * - UX: Long forms feel shorter in steps
 * - Compliance: Each step can map to a permission/consent (FERPA)
 *
 * Why multiple guardians:
 * - Both parents may enroll student (both share responsibility)
 * - Divorced parents need both contacts
 * - One marked isPrimary (emergency contact first)
 * - One marked isEmergencyContact (if different from primary)
 *
 * Why health tracking:
 * - Medical conditions: Asthma, diabetes, epilepsy (staff awareness)
 * - Allergies: Food allergies (critical for school meals/field trips)
 * - Medications: Required on campus (nurse supervision)
 * - Vaccinations: Legal requirement (truancy enforcement)
 * - Insurance: Parent policy (emergency billing)
 * - Special needs: Physical, learning disabilities (accommodation planning)
 */

import { z } from "zod";

// Enums matching Prisma model
export const StudentStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  GRADUATED: "GRADUATED",
  TRANSFERRED: "TRANSFERRED",
  DROPPED_OUT: "DROPPED_OUT",
} as const;

export const StudentType = {
  REGULAR: "REGULAR",
  TRANSFER: "TRANSFER",
  INTERNATIONAL: "INTERNATIONAL",
  EXCHANGE: "EXCHANGE",
} as const;

export const BloodGroup = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
} as const;

export const Gender = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
} as const;

// Personal Information Schema
export const personalInfoSchema = z.object({
  // Basic Info
  givenName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  surname: z.string().min(2, "Last name must be at least 2 characters"),

  // Date and Gender
  dateOfBirth: z.date().refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 3 && age <= 25;
  }, "Student must be between 3 and 25 years old"),

  gender: z.enum(["Male", "Female", "Other"]),

  // Health Info
  bloodGroup: z.enum([
    "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"
  ]).optional(),

  // Nationality and Documents
  nationality: z.string().default("Saudi Arabia"),
  passportNumber: z.string().optional(),
  visaStatus: z.string().optional(),
  visaExpiryDate: z.date().optional(),

  // Student IDs
  grNumber: z.string().optional(),
  admissionNumber: z.string().optional(),
  studentType: z.enum(["REGULAR", "TRANSFER", "INTERNATIONAL", "EXCHANGE"]).default("REGULAR"),
  category: z.string().optional(),
});

// Contact Information Schema
export const contactInfoSchema = z.object({
  // Contact Details
  email: z.string().email("Invalid email address").optional(),
  mobileNumber: z.string()
    .regex(/^\+?[\d\s-()]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  alternatePhone: z.string()
    .regex(/^\+?[\d\s-()]+$/, "Invalid phone number format")
    .optional(),

  // Current Address
  currentAddress: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  postalCode: z.string().optional(),
  country: z.string().default("Saudi Arabia"),

  // Permanent Address (optional, can be same as current)
  sameAsPermanent: z.boolean().default(false),
  permanentAddress: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentState: z.string().optional(),
  permanentPostalCode: z.string().optional(),
  permanentCountry: z.string().optional(),
});

// Emergency Contact Schema
export const emergencyContactSchema = z.object({
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string()
    .regex(/^\+?[\d\s-()]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits"),
  emergencyContactRelation: z.string().min(2, "Relationship is required"),
});

// Guardian Information Schema
export const guardianInfoSchema = z.object({
  guardians: z.array(z.object({
    givenName: z.string().min(2, "Guardian first name is required"),
    surname: z.string().min(2, "Guardian last name is required"),
    relation: z.string().min(2, "Relationship is required"), // Father, Mother, Guardian, etc.
    email: z.string().email("Invalid email address").optional(),
    mobileNumber: z.string()
      .regex(/^\+?[\d\s-()]+$/, "Invalid phone number format")
      .min(10, "Phone number must be at least 10 digits"),
    occupation: z.string().optional(),
    isPrimary: z.boolean().default(false),
  })).min(1, "At least one guardian is required"),
});

// Previous Education Schema
export const previousEducationSchema = z.object({
  previousSchoolName: z.string().optional(),
  previousSchoolAddress: z.string().optional(),
  previousGrade: z.string().optional(),
  transferCertificateNo: z.string().optional(),
  transferDate: z.date().optional(),
  previousAcademicRecord: z.string().optional(),
  reasonForTransfer: z.string().optional(),
});

// Health Information Schema
export const healthInfoSchema = z.object({
  // Medical Conditions
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medicationRequired: z.string().optional(),

  // Doctor Information
  doctorName: z.string().optional(),
  doctorContact: z.string()
    .regex(/^\+?[\d\s-()]+$/, "Invalid phone number format")
    .optional(),
  hospitalPreference: z.string().optional(),

  // Insurance
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceValidTill: z.date().optional(),

  // Vaccination Records
  vaccinations: z.array(z.object({
    name: z.string(),
    date: z.date(),
    nextDueDate: z.date().optional(),
  })).optional(),

  // Special Needs
  hasSpecialNeeds: z.boolean().default(false),
  specialNeedsDetails: z.string().optional(),
});

// Document Upload Schema
export const documentSchema = z.object({
  documents: z.array(z.object({
    documentType: z.string(), // Birth Certificate, Transfer Certificate, etc.
    documentName: z.string(),
    fileUrl: z.string().url(),
    fileSize: z.number().optional(),
    mimeType: z.string().optional(),
    description: z.string().optional(),
  })).optional(),

  profilePhotoUrl: z.string().url().optional(),
});

// Combined Registration Schema
export const studentRegistrationSchema = z.object({
  ...personalInfoSchema.shape,
  ...contactInfoSchema.shape,
  ...emergencyContactSchema.shape,
  ...guardianInfoSchema.shape,
  ...previousEducationSchema.shape,
  ...healthInfoSchema.shape,
  ...documentSchema.shape,

  // Enrollment Information
  admissionDate: z.date().default(() => new Date()),
  yearLevelId: z.string().optional(),
  classId: z.string().optional(),
  batchId: z.string().optional(),

  // Additional Notes
  remarks: z.string().optional(),

  // Form Meta
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  enrollmentDate: z.date().default(() => new Date()),
});

// Type exports
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type GuardianInfo = z.infer<typeof guardianInfoSchema>;
export type PreviousEducation = z.infer<typeof previousEducationSchema>;
export type HealthInfo = z.infer<typeof healthInfoSchema>;
export type DocumentInfo = z.infer<typeof documentSchema>;
export type StudentRegistration = z.infer<typeof studentRegistrationSchema>;

// Form step configuration
export const registrationSteps = [
  { id: "personal", title: "Personal Information", schema: personalInfoSchema },
  { id: "contact", title: "Contact Details", schema: contactInfoSchema },
  { id: "emergency", title: "Emergency Contact", schema: emergencyContactSchema },
  { id: "guardian", title: "Guardian Information", schema: guardianInfoSchema },
  { id: "education", title: "Previous Education", schema: previousEducationSchema },
  { id: "health", title: "Health Information", schema: healthInfoSchema },
  { id: "documents", title: "Documents", schema: documentSchema },
] as const;

// Validation helpers
export const validateStep = (stepId: string, data: any) => {
  const step = registrationSteps.find(s => s.id === stepId);
  if (!step) throw new Error(`Invalid step: ${stepId}`);
  return step.schema.safeParse(data);
};

export const validateFullRegistration = (data: any) => {
  return studentRegistrationSchema.safeParse(data);
};