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
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }).refine((date) => {
    const age = new Date().getFullYear() - date.getFullYear();
    return age >= 3 && age <= 25;
  }, "Student must be between 3 and 25 years old"),

  gender: z.enum(["Male", "Female", "Other"], {
    required_error: "Gender is required",
  }),

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