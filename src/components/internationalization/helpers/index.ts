/**
 * i18n Helper Utilities
 *
 * Provides easy access to validation messages, toast messages, and error messages
 * with support for parameter interpolation.
 */

import type { Dictionary } from '../dictionaries';
import type { Locale } from '../config';

// ============================================================================
// Type Definitions
// ============================================================================

export type Messages = Dictionary['messages'];
export type ValidationMessages = Messages['validation'];
export type ToastMessages = Messages['toast'];
export type ErrorMessages = Messages['errors'];

// Parameter interpolation type
type MessageParams = Record<string, string | number>;

// ============================================================================
// Interpolation Utility
// ============================================================================

/**
 * Interpolate parameters into a message string
 * @param message - Message template (e.g., "Must be at least {min} characters")
 * @param params - Parameters to interpolate (e.g., { min: 3 })
 * @returns Interpolated string (e.g., "Must be at least 3 characters")
 */
export function interpolate(message: string, params?: MessageParams): string {
  if (!params) return message;

  return Object.entries(params).reduce((msg, [key, value]) => {
    return msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, message);
}

// ============================================================================
// Validation Message Helpers
// ============================================================================

export class ValidationHelper {
  constructor(private messages: ValidationMessages) {}

  /**
   * Get a required field message
   */
  required(): string {
    return this.messages.required;
  }

  /**
   * Get an email validation message
   */
  email(): string {
    return this.messages.email;
  }

  /**
   * Get a minimum length message
   * @param min - Minimum length
   */
  minLength(min: number): string {
    return interpolate(this.messages.minLength, { min });
  }

  /**
   * Get a maximum length message
   * @param max - Maximum length
   */
  maxLength(max: number): string {
    return interpolate(this.messages.maxLength, { max });
  }

  /**
   * Get a minimum value message
   * @param min - Minimum value
   */
  min(min: number): string {
    return interpolate(this.messages.min, { min });
  }

  /**
   * Get a maximum value message
   * @param max - Maximum value
   */
  max(max: number): string {
    return interpolate(this.messages.max, { max });
  }

  /**
   * Get a positive number message
   */
  positive(): string {
    return this.messages.positive;
  }

  /**
   * Get a password minimum length message
   */
  passwordMinLength(): string {
    return this.messages.passwordMinLength;
  }

  /**
   * Get a password mismatch message
   */
  passwordMismatch(): string {
    return this.messages.passwordMismatch;
  }

  /**
   * Get title validation messages
   */
  title = {
    required: (): string => this.messages.titleRequired,
    tooShort: (min: number): string => interpolate(this.messages.titleTooShort, { min }),
    tooLong: (max: number): string => interpolate(this.messages.titleTooLong, { max }),
  };

  /**
   * Get subdomain validation messages
   */
  subdomain = {
    required: (): string => this.messages.subdomainRequired,
    tooShort: (): string => this.messages.subdomainTooShort,
    invalidFormat: (): string => this.messages.subdomainInvalidFormat,
    alreadyTaken: (): string => this.messages.subdomainAlreadyTaken,
  };

  /**
   * Get amount validation messages
   */
  amount = {
    required: (): string => this.messages.amountRequired,
    positive: (): string => this.messages.amountPositive,
  };

  /**
   * Get score validation messages
   */
  score = {
    required: (): string => this.messages.scoreRequired,
    invalidRange: (min: number, max: number): string =>
      interpolate(this.messages.scoreInvalidRange, { min, max }),
  };

  /**
   * Get any validation message by key
   * @param key - Validation message key
   * @param params - Optional parameters for interpolation
   */
  get(key: keyof ValidationMessages, params?: MessageParams): string {
    const message = this.messages[key];
    return typeof message === 'string' ? interpolate(message, params) : String(message);
  }
}

// ============================================================================
// Toast Message Helpers
// ============================================================================

export class ToastHelper {
  constructor(private messages: ToastMessages) {}

  /**
   * Success messages
   */
  success = {
    created: (): string => this.messages.success.created,
    updated: (): string => this.messages.success.updated,
    deleted: (): string => this.messages.success.deleted,
    saved: (): string => this.messages.success.saved,
    uploaded: (): string => this.messages.success.uploaded,
    sent: (): string => this.messages.success.sent,

    // Entity-specific
    student: {
      created: (): string => this.messages.success.studentCreated,
      updated: (): string => this.messages.success.studentUpdated,
      deleted: (): string => this.messages.success.studentDeleted,
    },
    teacher: {
      created: (): string => this.messages.success.teacherCreated,
      updated: (): string => this.messages.success.teacherUpdated,
      deleted: (): string => this.messages.success.teacherDeleted,
    },
    class: {
      created: (): string => this.messages.success.classCreated,
      updated: (): string => this.messages.success.classUpdated,
      deleted: (): string => this.messages.success.classDeleted,
    },
    invoice: {
      created: (): string => this.messages.success.invoiceCreated,
      updated: (): string => this.messages.success.invoiceUpdated,
      deleted: (): string => this.messages.success.invoiceDeleted,
    },
    announcement: {
      created: (): string => this.messages.success.announcementCreated,
      updated: (): string => this.messages.success.announcementUpdated,
      deleted: (): string => this.messages.success.announcementDeleted,
    },
  };

  /**
   * Error messages
   */
  error = {
    generic: (): string => this.messages.error.generic,
    createFailed: (): string => this.messages.error.createFailed,
    updateFailed: (): string => this.messages.error.updateFailed,
    deleteFailed: (): string => this.messages.error.deleteFailed,
    saveFailed: (): string => this.messages.error.saveFailed,
    uploadFailed: (): string => this.messages.error.uploadFailed,

    // Entity-specific
    student: {
      createFailed: (): string => this.messages.error.studentCreateFailed,
      updateFailed: (): string => this.messages.error.studentUpdateFailed,
      deleteFailed: (): string => this.messages.error.studentDeleteFailed,
    },
    teacher: {
      createFailed: (): string => this.messages.error.teacherCreateFailed,
      updateFailed: (): string => this.messages.error.teacherUpdateFailed,
      deleteFailed: (): string => this.messages.error.teacherDeleteFailed,
    },
    class: {
      createFailed: (): string => this.messages.error.classCreateFailed,
      updateFailed: (): string => this.messages.error.classUpdateFailed,
      deleteFailed: (): string => this.messages.error.classDeleteFailed,
    },
    invoice: {
      createFailed: (): string => this.messages.error.invoiceCreateFailed,
      updateFailed: (): string => this.messages.error.invoiceUpdateFailed,
      deleteFailed: (): string => this.messages.error.invoiceDeleteFailed,
    },
    announcement: {
      createFailed: (): string => this.messages.error.announcementCreateFailed,
      updateFailed: (): string => this.messages.error.announcementUpdateFailed,
      deleteFailed: (): string => this.messages.error.announcementDeleteFailed,
    },
  };

  /**
   * Warning messages
   */
  warning = {
    unsavedChanges: (): string => this.messages.warning.unsavedChanges,
    confirmDelete: (): string => this.messages.warning.confirmDelete,
    confirmCancel: (): string => this.messages.warning.confirmCancel,
    dataLoss: (): string => this.messages.warning.dataLoss,
    irreversible: (): string => this.messages.warning.irreversible,
  };

  /**
   * Info messages
   */
  info = {
    loading: (): string => this.messages.info.loading,
    saving: (): string => this.messages.info.saving,
    uploading: (): string => this.messages.info.uploading,
    processing: (): string => this.messages.info.processing,
    syncing: (): string => this.messages.info.syncing,
  };
}

// ============================================================================
// Error Message Helpers
// ============================================================================

export class ErrorHelper {
  constructor(private messages: ErrorMessages) {}

  /**
   * Server errors
   */
  server = {
    internalError: (): string => this.messages.server.internalError,
    databaseError: (): string => this.messages.server.databaseError,
    connectionError: (): string => this.messages.server.connectionError,
    serviceUnavailable: (): string => this.messages.server.serviceUnavailable,
  };

  /**
   * Authentication errors
   */
  auth = {
    invalidCredentials: (): string => this.messages.auth.invalidCredentials,
    accountNotFound: (): string => this.messages.auth.accountNotFound,
    accountDisabled: (): string => this.messages.auth.accountDisabled,
    sessionExpired: (): string => this.messages.auth.sessionExpired,
    permissionDenied: (): string => this.messages.auth.permissionDenied,
    notAuthenticated: (): string => this.messages.auth.notAuthenticated,
  };

  /**
   * Tenant errors
   */
  tenant = {
    missingSchoolContext: (): string => this.messages.tenant.missingSchoolContext,
    schoolNotFound: (): string => this.messages.tenant.schoolNotFound,
    subdomainTaken: (): string => this.messages.tenant.subdomainTaken,
  };

  /**
   * Resource errors
   */
  resource = {
    notFound: (): string => this.messages.resource.notFound,
    alreadyExists: (): string => this.messages.resource.alreadyExists,
    cannotDelete: (): string => this.messages.resource.cannotDelete,
    cannotModify: (): string => this.messages.resource.cannotModify,
  };

  /**
   * File errors
   */
  file = {
    uploadFailed: (): string => this.messages.file.uploadFailed,
    fileTooLarge: (): string => this.messages.file.fileTooLarge,
    invalidType: (): string => this.messages.file.invalidType,
    notFound: (): string => this.messages.file.notFound,
  };

  /**
   * Payment errors
   */
  payment = {
    processingFailed: (): string => this.messages.payment.processingFailed,
    cardDeclined: (): string => this.messages.payment.cardDeclined,
    insufficientFunds: (): string => this.messages.payment.insufficientFunds,
  };
}

// ============================================================================
// Main i18n Helper Factory
// ============================================================================

/**
 * Create i18n helpers from dictionary messages
 * @param messages - Messages from dictionary
 * @returns Helper objects for validation, toast, and errors
 */
export function createI18nHelpers(messages: Messages) {
  return {
    validation: new ValidationHelper(messages.validation),
    toast: new ToastHelper(messages.toast),
    error: new ErrorHelper(messages.errors),
  };
}

/**
 * Hook for using i18n helpers in components
 * @param dictionary - Full dictionary object
 * @returns Helper objects
 */
export function useI18nMessages(dictionary: Dictionary) {
  return createI18nHelpers(dictionary.messages);
}

// ============================================================================
// Direct Access Utilities (for server components/actions)
// ============================================================================

/**
 * Get validation messages from dictionary
 */
export function getValidationMessages(dictionary: Dictionary) {
  return new ValidationHelper(dictionary.messages.validation);
}

/**
 * Get toast messages from dictionary
 */
export function getToastMessages(dictionary: Dictionary) {
  return new ToastHelper(dictionary.messages.toast);
}

/**
 * Get error messages from dictionary
 */
export function getErrorMessages(dictionary: Dictionary) {
  return new ErrorHelper(dictionary.messages.errors);
}

// ============================================================================
// Note: ValidationHelper, ToastHelper, and ErrorHelper are already exported
// at their class definitions above (lines 45, 166, 274)
// ============================================================================
