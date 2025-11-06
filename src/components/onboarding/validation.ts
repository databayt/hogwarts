import { z } from "zod";
import { getValidationMessages } from "@/components/internationalization/helpers";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type {
  OnboardingStep,
  SchoolType,
  SchoolCategory,
  Currency,
  PaymentSchedule,
  BorderRadius,
  ShadowSize
} from "./types";

// Base validation schemas
export const schoolTypeSchema = z.enum(['primary', 'secondary', 'both']);
export const schoolCategorySchema = z.enum(['private', 'public', 'international', 'technical', 'special']);
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']);
export const paymentScheduleSchema = z.enum(['monthly', 'quarterly', 'semester', 'annual']);
export const borderRadiusSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']);
export const shadowSizeSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl']);

// Domain validation
export const domainSchema = z
  .string()
  .min(3, "Domain must be at least 3 characters")
  .max(63, "Domain must be less than 63 characters")
  .regex(/^[a-z0-9-]+$/, "Domain can only contain lowercase letters, numbers, and hyphens")
  .regex(/^[a-z0-9]/, "Domain must start with a letter or number")
  .regex(/[a-z0-9]$/, "Domain must end with a letter or number")
  .refine(val => !val.includes('--'), "Domain cannot contain consecutive hyphens");

// Email validation
export const emailSchema = z
  .string()
  .email("Please enter a valid email address");

// URL validation
export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .optional()
  .or(z.literal(""));

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number")
  .optional()
  .or(z.literal(""));

// Main onboarding validation schema
export const onboardingValidation = z.object({
  // Basic information
  name: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(100, "School name must be less than 100 characters")
    .trim()
    .optional(),
    
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .trim()
    .optional(),
    
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters")
    .trim()
    .optional(),
    
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be less than 50 characters")
    .trim()
    .optional(),
    
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State must be less than 50 characters")
    .trim()
    .optional(),
    
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must be less than 50 characters")
    .trim()
    .optional(),
    
  domain: domainSchema.optional(),
  website: urlSchema,
  
  // Contact information
  email: emailSchema.optional(),
  phone: phoneSchema,
  
  // Capacity
  maxStudents: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 student")
    .max(10000, "Cannot exceed 10,000 students")
    .optional(),
    
  maxTeachers: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 teacher")
    .max(1000, "Cannot exceed 1,000 teachers")
    .optional(),
    
  maxClasses: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must have at least 1 class")
    .max(500, "Cannot exceed 500 classes")
    .optional(),
    
  maxFacilities: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(100, "Cannot exceed 100 facilities")
    .optional(),
    
  // School details
  schoolLevel: schoolTypeSchema.optional(),
  schoolType: schoolCategorySchema.optional(),
  planType: z.string().optional(),
  
  // Pricing
  tuitionFee: z
    .number()
    .min(0, "Tuition fee cannot be negative")
    .max(100000, "Tuition fee seems too high")
    .optional(),
    
  registrationFee: z
    .number()
    .min(0, "Registration fee cannot be negative")
    .max(10000, "Registration fee seems too high")
    .optional(),
    
  applicationFee: z
    .number()
    .min(0, "Application fee cannot be negative")
    .max(1000, "Application fee seems too high")
    .optional(),
    
  currency: currencySchema.optional(),
  paymentSchedule: paymentScheduleSchema.optional(),
  
  // Branding
  logo: z
    .string()
    .url("Logo must be a valid URL")
    .optional()
    .or(z.literal("")),
    
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Primary color must be a valid hex color")
    .optional(),
    
  borderRadius: borderRadiusSchema.optional(),
  shadow: shadowSizeSchema.optional(),
  
  // Status fields
  draft: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isComplete: z.boolean().optional(),
  
  // Metadata
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Step-specific validation schemas
export const titleStepValidation = onboardingValidation.pick({
  name: true,
}).required({
  name: true,
});

export const descriptionStepValidation = onboardingValidation.pick({
  description: true,
  schoolLevel: true,
  schoolType: true,
}).required({
  description: true,
});

export const locationStepValidation = onboardingValidation.pick({
  address: true,
  city: true,
  state: true,
  country: true,
}).required({
  address: true,
  city: true,
  state: true,
});

export const capacityStepValidation = onboardingValidation.pick({
  maxStudents: true,
  maxTeachers: true,
  maxClasses: true,
}).required({
  maxStudents: true,
  maxTeachers: true,
});

export const brandingStepValidation = onboardingValidation.pick({
  logo: true,
  primaryColor: true,
  borderRadius: true,
  shadow: true,
});

export const priceStepValidation = onboardingValidation.pick({
  tuitionFee: true,
  registrationFee: true,
  applicationFee: true,
  currency: true,
  paymentSchedule: true,
}).required({
  tuitionFee: true,
  currency: true,
  paymentSchedule: true,
});

export const legalStepValidation = z.object({
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the privacy policy",
  }),
  dataProcessingAccepted: z.boolean().refine(val => val === true, {
    message: "You must consent to data processing",
  }),
});

// Validation helper functions
export function validateStep(step: OnboardingStep, data: any): { isValid: boolean; errors: Record<string, string> } {
  try {
    switch (step) {
      case 'title':
        titleStepValidation.parse(data);
        break;
      case 'description':
        descriptionStepValidation.parse(data);
        break;
      case 'location':
        locationStepValidation.parse(data);
        break;
      case 'capacity':
        capacityStepValidation.parse(data);
        break;
      case 'branding':
        brandingStepValidation.parse(data);
        break;
      case 'price':
        priceStepValidation.parse(data);
        break;
      case 'legal':
        legalStepValidation.parse(data);
        break;
      default:
        // For steps without specific validation, just validate the full schema partially
        onboardingValidation.partial().parse(data);
    }
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach(err => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
}

export function getRequiredFieldsForStep(step: OnboardingStep): string[] {
  switch (step) {
    case 'title':
      return ['name'];
    case 'description':
      return ['description'];
    case 'location':
      return ['address', 'city', 'state'];
    case 'capacity':
      return ['maxStudents', 'maxTeachers'];
    case 'price':
      return ['tuitionFee', 'currency', 'paymentSchedule'];
    case 'legal':
      return ['termsAccepted', 'privacyAccepted', 'dataProcessingAccepted'];
    default:
      return [];
  }
}

// Export types inferred from schemas
export type OnboardingValidationData = z.infer<typeof onboardingValidation>;
export type TitleStepData = z.infer<typeof titleStepValidation>;
export type DescriptionStepData = z.infer<typeof descriptionStepValidation>;
export type LocationStepData = z.infer<typeof locationStepValidation>;
export type CapacityStepData = z.infer<typeof capacityStepValidation>;
export type BrandingStepData = z.infer<typeof brandingStepValidation>;
export type PriceStepData = z.infer<typeof priceStepValidation>;
export type LegalStepData = z.infer<typeof legalStepValidation>;

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createDomainSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);
  return z
    .string()
    .min(3, { message: v.get('domainMinLength') })
    .max(63, { message: v.maxLength(63) })
    .regex(/^[a-z0-9-]+$/, { message: v.get('domainInvalidFormat') })
    .regex(/^[a-z0-9]/, { message: v.get('domainMustStartWithLetterOrNumber') })
    .regex(/[a-z0-9]$/, { message: v.get('domainMustEndWithLetterOrNumber') })
    .refine(val => !val.includes('--'), { message: v.get('domainNoConsecutiveHyphens') });
}

export function createEmailSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);
  return z.string().email({ message: v.email() });
}

export function createUrlSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);
  return z
    .string()
    .url({ message: v.get('validUrlRequired') })
    .optional()
    .or(z.literal(""));
}

export function createPhoneSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);
  return z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, { message: v.get('validPhoneRequired') })
    .optional()
    .or(z.literal(""));
}

export function createOnboardingValidation(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    // Basic information
    name: z
      .string()
      .min(2, { message: v.minLength(2) })
      .max(100, { message: v.maxLength(100) })
      .trim()
      .optional(),

    description: z
      .string()
      .min(10, { message: v.minLength(10) })
      .max(500, { message: v.maxLength(500) })
      .trim()
      .optional(),

    address: z
      .string()
      .min(5, { message: v.get('addressRequired') })
      .max(200, { message: v.maxLength(200) })
      .trim()
      .optional(),

    city: z
      .string()
      .min(2, { message: v.get('cityRequired') })
      .max(50, { message: v.maxLength(50) })
      .trim()
      .optional(),

    state: z
      .string()
      .min(2, { message: v.get('stateRequired') })
      .max(50, { message: v.maxLength(50) })
      .trim()
      .optional(),

    country: z
      .string()
      .min(2, { message: v.get('countryRequired') })
      .max(50, { message: v.maxLength(50) })
      .trim()
      .optional(),

    domain: createDomainSchema(dictionary).optional(),
    website: createUrlSchema(dictionary),

    // Contact information
    email: createEmailSchema(dictionary).optional(),
    phone: createPhoneSchema(dictionary),

    // Capacity
    maxStudents: z
      .number()
      .int({ message: v.get('mustBeWholeNumber') })
      .min(1, { message: v.get('atLeastOneStudent') })
      .max(10000, { message: v.get('maxStudentsLimit') })
      .optional(),

    maxTeachers: z
      .number()
      .int({ message: v.get('mustBeWholeNumber') })
      .min(1, { message: v.get('atLeastOneTeacher') })
      .max(1000, { message: v.get('maxTeachersLimit') })
      .optional(),

    maxClasses: z
      .number()
      .int({ message: v.get('mustBeWholeNumber') })
      .min(1, { message: v.get('atLeastOneClass') })
      .max(500, { message: v.get('maxClassesLimit') })
      .optional(),

    maxFacilities: z
      .number()
      .int({ message: v.get('mustBeWholeNumber') })
      .min(0, { message: v.get('nonNegative') })
      .max(100, { message: v.get('maxFacilitiesLimit') })
      .optional(),

    // School details
    schoolLevel: schoolTypeSchema.optional(),
    schoolType: schoolCategorySchema.optional(),
    planType: z.string().optional(),

    // Pricing
    tuitionFee: z
      .number()
      .min(0, { message: v.get('nonNegative') })
      .max(100000, { message: v.get('tuitionFeeTooHigh') })
      .optional(),

    registrationFee: z
      .number()
      .min(0, { message: v.get('nonNegative') })
      .max(10000, { message: v.get('registrationFeeTooHigh') })
      .optional(),

    applicationFee: z
      .number()
      .min(0, { message: v.get('nonNegative') })
      .max(1000, { message: v.get('applicationFeeTooHigh') })
      .optional(),

    currency: currencySchema.optional(),
    paymentSchedule: paymentScheduleSchema.optional(),

    // Branding
    logo: z
      .string()
      .url({ message: v.get('logoMustBeValidUrl') })
      .optional()
      .or(z.literal("")),

    primaryColor: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, { message: v.get('validHexColorRequired') })
      .optional(),

    borderRadius: borderRadiusSchema.optional(),
    shadow: shadowSizeSchema.optional(),

    // Status fields
    draft: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    isComplete: z.boolean().optional(),

    // Metadata
    id: z.string().uuid().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  });
}

export function createTitleStepValidation(dictionary: Dictionary) {
  const baseSchema = createOnboardingValidation(dictionary);
  return baseSchema.pick({
    name: true,
  }).required({
    name: true,
  });
}

export function createDescriptionStepValidation(dictionary: Dictionary) {
  const baseSchema = createOnboardingValidation(dictionary);
  return baseSchema.pick({
    description: true,
    schoolLevel: true,
    schoolType: true,
  }).required({
    description: true,
  });
}

export function createLocationStepValidation(dictionary: Dictionary) {
  const baseSchema = createOnboardingValidation(dictionary);
  return baseSchema.pick({
    address: true,
    city: true,
    state: true,
    country: true,
  }).required({
    address: true,
    city: true,
    state: true,
  });
}

export function createCapacityStepValidation(dictionary: Dictionary) {
  const baseSchema = createOnboardingValidation(dictionary);
  return baseSchema.pick({
    maxStudents: true,
    maxTeachers: true,
    maxClasses: true,
  }).required({
    maxStudents: true,
    maxTeachers: true,
  });
}

export function createBrandingStepValidation(dictionary: Dictionary) {
  const baseSchema = createOnboardingValidation(dictionary);
  return baseSchema.pick({
    logo: true,
    primaryColor: true,
    borderRadius: true,
    shadow: true,
  });
}

export function createPriceStepValidation(dictionary: Dictionary) {
  const baseSchema = createOnboardingValidation(dictionary);
  return baseSchema.pick({
    tuitionFee: true,
    registrationFee: true,
    applicationFee: true,
    currency: true,
    paymentSchedule: true,
  }).required({
    tuitionFee: true,
    currency: true,
    paymentSchedule: true,
  });
}

export function createLegalStepValidation(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    termsAccepted: z.boolean().refine(val => val === true, {
      message: v.get('termsAcceptanceRequired'),
    }),
    privacyAccepted: z.boolean().refine(val => val === true, {
      message: v.get('privacyAcceptanceRequired'),
    }),
    dataProcessingAccepted: z.boolean().refine(val => val === true, {
      message: v.get('dataProcessingConsentRequired'),
    }),
  });
}