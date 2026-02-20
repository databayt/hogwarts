/**
 * Dictionary Mock Factory
 *
 * Provides mock i18n dictionary data for testing onboarding validation
 * and components that require internationalization.
 */

import type { Dictionary } from "@/components/internationalization/dictionaries"

// ============================================================================
// Validation Messages
// ============================================================================

const validationMessages = {
  // General
  required: "Required",
  email: "Valid email required",
  emailRequired: "Email is required",
  passwordRequired: "Password is required",
  passwordMinLength: "Minimum 6 characters required",
  newPasswordRequired: "New password is required",
  nameRequired: "Name is required",

  // Length validation
  minLength: "Must be at least {min} characters",
  maxLength: "Must be no more than {max} characters",
  min: "Must be at least {min}",
  max: "Must be no more than {max}",

  // Type validation
  positive: "Must be a positive number",
  nonNegative: "Cannot be negative",
  integer: "Must be a whole number",
  url: "Valid URL required",
  phone: "Valid phone number required",

  // Domain validation
  domainMinLength: "Domain must be at least 3 characters",
  domainInvalidFormat: "Only lowercase letters, numbers, and hyphens allowed",
  domainMustStartWithLetterOrNumber:
    "Domain must start with a letter or number",
  domainMustEndWithLetterOrNumber: "Domain must end with a letter or number",
  domainNoConsecutiveHyphens: "Domain cannot have consecutive hyphens",

  // Subdomain validation
  subdomainRequired: "Subdomain is required",
  subdomainTooShort: "Subdomain must be at least 3 characters",
  subdomainTooLong: "Subdomain must be no more than 63 characters",
  subdomainInvalidFormat:
    "Only lowercase letters, numbers, and hyphens allowed",
  subdomainCannotStartWithHyphen: "Cannot start with hyphen",
  subdomainCannotEndWithHyphen: "Cannot end with hyphen",
  subdomainAlreadyTaken: "Subdomain already taken",
  subdomainMinLength: "Subdomain must be at least 3 characters",
  subdomainMaxLength: "Subdomain must be no more than 63 characters",
  subdomainNoConsecutiveHyphens: "Subdomain cannot have consecutive hyphens",
  subdomainMustStartWithLetterOrNumber:
    "Subdomain must start with a letter or number",
  subdomainMustEndWithLetterOrNumber:
    "Subdomain must end with a letter or number",

  // Location validation
  addressRequired: "Address is required",
  cityRequired: "City is required",
  stateRequired: "State is required",
  countryRequired: "Country is required",

  // Capacity validation
  mustBeWholeNumber: "Must be a whole number",
  atLeastOneStudent: "At least one student is required",
  maxStudentsLimit: "Maximum students limit exceeded",
  atLeastOneTeacher: "At least one teacher is required",
  maxTeachersLimit: "Maximum teachers limit exceeded",
  atLeastOneClass: "At least one class is required",
  maxClassesLimit: "Maximum classes limit exceeded",

  // Price validation
  tuitionFeeTooHigh: "Tuition fee is too high",
  registrationFeeTooHigh: "Registration fee is too high",
  applicationFeeTooHigh: "Application fee is too high",

  // URL/Phone validation
  validUrlRequired: "Valid URL is required",
  validPhoneRequired: "Valid phone number is required",

  // Branding validation
  logoMustBeValidUrl: "Logo must be a valid URL",
  validHexColorRequired: "Valid hex color is required",

  // Legal validation
  termsAcceptanceRequired: "You must accept the terms and conditions",
  privacyAcceptanceRequired: "You must accept the privacy policy",
  dataProcessingConsentRequired: "Data processing consent is required",

  // Title/Description
  titleRequired: "Title is required",
  titleTooShort: "Title must be at least {min} characters",
  titleTooLong: "Title must be no more than {max} characters",
  descriptionRequired: "Description is required",
  descriptionTooShort: "Description must be at least {min} characters",
  descriptionTooLong: "Description must be no more than {max} characters",

  // Other
  invalidCredentials: "Invalid email or password",
  invalidFormat: "Invalid format",
  unique: "Already exists",
  notFound: "Not found",
}

// ============================================================================
// Toast Messages
// ============================================================================

const toastMessages = {
  success: {
    created: "Created successfully",
    updated: "Updated successfully",
    deleted: "Deleted successfully",
    saved: "Saved successfully",
    uploaded: "Uploaded successfully",
    sent: "Sent successfully",
    studentCreated: "Student created successfully",
    studentUpdated: "Student updated successfully",
    studentDeleted: "Student deleted successfully",
    teacherCreated: "Teacher created successfully",
    teacherUpdated: "Teacher updated successfully",
    teacherDeleted: "Teacher deleted successfully",
    classCreated: "Class created successfully",
    classUpdated: "Class updated successfully",
    classDeleted: "Class deleted successfully",
    invoiceCreated: "Invoice created successfully",
    invoiceUpdated: "Invoice updated successfully",
    invoiceDeleted: "Invoice deleted successfully",
    announcementCreated: "Announcement created successfully",
    announcementUpdated: "Announcement updated successfully",
    announcementDeleted: "Announcement deleted successfully",
  },
  error: {
    generic: "Something went wrong",
    createFailed: "Failed to create",
    updateFailed: "Failed to update",
    deleteFailed: "Failed to delete",
    saveFailed: "Failed to save",
    uploadFailed: "Failed to upload",
    studentCreateFailed: "Failed to create student",
    studentUpdateFailed: "Failed to update student",
    studentDeleteFailed: "Failed to delete student",
    teacherCreateFailed: "Failed to create teacher",
    teacherUpdateFailed: "Failed to update teacher",
    teacherDeleteFailed: "Failed to delete teacher",
    classCreateFailed: "Failed to create class",
    classUpdateFailed: "Failed to update class",
    classDeleteFailed: "Failed to delete class",
    invoiceCreateFailed: "Failed to create invoice",
    invoiceUpdateFailed: "Failed to update invoice",
    invoiceDeleteFailed: "Failed to delete invoice",
    announcementCreateFailed: "Failed to create announcement",
    announcementUpdateFailed: "Failed to update announcement",
    announcementDeleteFailed: "Failed to delete announcement",
  },
  warning: {
    unsavedChanges: "You have unsaved changes",
    confirmDelete: "Are you sure you want to delete?",
    confirmCancel: "Are you sure you want to cancel?",
    dataLoss: "This action may result in data loss",
    irreversible: "This action cannot be undone",
  },
  info: {
    loading: "Loading...",
    saving: "Saving...",
    uploading: "Uploading...",
    processing: "Processing...",
    syncing: "Syncing...",
  },
}

// ============================================================================
// Error Messages
// ============================================================================

const errorMessages = {
  server: {
    internalError: "Internal server error",
    databaseError: "Database error",
    connectionError: "Connection error",
    timeoutError: "Request timeout",
    serviceUnavailable: "Service unavailable",
    badGateway: "Bad gateway",
    maintenanceMode: "System under maintenance",
  },
  auth: {
    invalidCredentials: "Invalid email or password",
    accountNotFound: "Account not found",
    accountDisabled: "Your account has been disabled",
    accountLocked: "Account locked due to multiple failed attempts",
    emailNotVerified: "Please verify your email",
    emailAlreadyExists: "Email already in use with different provider",
    sessionExpired: "Your session has expired. Please log in again",
    invalidToken: "Invalid or expired token",
    twoFactorRequired: "Two-factor authentication required",
    twoFactorInvalid: "Invalid two-factor code",
    permissionDenied: "You don't have permission to perform this action",
    notAuthenticated: "Please log in to continue",
  },
  tenant: {
    missingSchoolContext: "School information not found",
    invalidSchool: "Invalid school",
    schoolNotFound: "School not found",
    subdomainTaken: "Subdomain already taken",
    tenantIsolationViolation: "Tenant isolation violation",
  },
  resource: {
    notFound: "Resource not found",
    alreadyExists: "Resource already exists",
    relationshipError: "Related resource not found",
    dependencyError: "Cannot delete due to dependencies",
    cannotModify: "Cannot modify this resource",
    cannotDelete: "Cannot delete this resource",
  },
  file: {
    uploadFailed: "File upload failed",
    fileTooLarge: "File size exceeds limit",
    invalidType: "Invalid file type",
    corrupted: "File appears to be corrupted",
    scanFailed: "Virus scan failed",
    notFound: "File not found",
  },
  payment: {
    processingFailed: "Payment processing failed",
    insufficientFunds: "Insufficient funds",
    cardDeclined: "Card declined",
    cardExpired: "Card expired",
    invalidCard: "Invalid card information",
    transactionFailed: "Transaction failed",
    refundFailed: "Refund failed",
  },
  integration: {
    apiError: "External API error",
    webhookFailed: "Webhook delivery failed",
    syncError: "Synchronization error",
    configurationError: "Integration configuration error",
    rateLimitExceeded: "Rate limit exceeded for external service",
  },
}

// ============================================================================
// Main Dictionary Factory
// ============================================================================

/**
 * Create a mock dictionary with all validation messages
 * for testing i18n-enabled schemas
 */
export function createMockDictionary(): Dictionary {
  return {
    messages: {
      validation: validationMessages,
      toast: toastMessages,
      errors: errorMessages,
    },
  } as unknown as Dictionary
}

/**
 * Create a mock dictionary with custom validation messages
 * @param customValidation - Custom validation messages to merge
 */
export function createMockDictionaryWithOverrides(
  customValidation: Partial<typeof validationMessages> = {}
): Dictionary {
  return {
    messages: {
      validation: { ...validationMessages, ...customValidation },
      toast: toastMessages,
      errors: errorMessages,
    },
  } as unknown as Dictionary
}

/**
 * Create a minimal dictionary for quick tests
 */
export function createMinimalDictionary(): Dictionary {
  return {
    messages: {
      validation: {
        required: "Required",
        email: "Valid email required",
        minLength: "Min {min} chars",
        maxLength: "Max {max} chars",
      },
      toast: {
        success: { created: "Created" },
        error: { generic: "Error" },
        warning: {},
        info: {},
      },
      errors: {
        server: {},
        auth: {},
        tenant: {},
        resource: {},
        file: {},
        payment: {},
        integration: {},
      },
    },
  } as unknown as Dictionary
}

/**
 * Create an Arabic dictionary mock for RTL testing
 */
export function createArabicDictionary(): Dictionary {
  return {
    messages: {
      validation: {
        ...validationMessages,
        required: "مطلوب",
        email: "بريد إلكتروني صالح مطلوب",
        minLength: "يجب أن يكون على الأقل {min} حرف",
        maxLength: "يجب ألا يتجاوز {max} حرف",
        addressRequired: "العنوان مطلوب",
        cityRequired: "المدينة مطلوبة",
        stateRequired: "الولاية مطلوبة",
        termsAcceptanceRequired: "يجب قبول الشروط والأحكام",
        privacyAcceptanceRequired: "يجب قبول سياسة الخصوصية",
        dataProcessingConsentRequired: "موافقة معالجة البيانات مطلوبة",
      },
      toast: toastMessages,
      errors: errorMessages,
    },
  } as unknown as Dictionary
}

// ============================================================================
// Exports for Direct Access
// ============================================================================

export const mockValidationMessages = validationMessages
export const mockToastMessages = toastMessages
export const mockErrorMessages = errorMessages
