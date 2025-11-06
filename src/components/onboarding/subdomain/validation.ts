import { z } from "zod";
import { getValidationMessages } from "@/components/internationalization/helpers";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { SUBDOMAIN_CONSTANTS, RESERVED_SUBDOMAINS } from "./config";

const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createSubdomainValidation(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    domain: z
      .string()
      .min(SUBDOMAIN_CONSTANTS.MIN_LENGTH, {
        message: v.get('subdomainMinLength', { min: SUBDOMAIN_CONSTANTS.MIN_LENGTH })
      })
      .max(SUBDOMAIN_CONSTANTS.MAX_LENGTH, {
        message: v.get('subdomainMaxLength', { max: SUBDOMAIN_CONSTANTS.MAX_LENGTH })
      })
      .toLowerCase()
      .regex(subdomainRegex, { message: v.get('subdomainInvalidFormat') })
      .refine(
        (val) => !val.includes('--'),
        { message: v.get('subdomainNoConsecutiveHyphens') }
      )
      .refine(
        (val) => !RESERVED_SUBDOMAINS.includes(val as any),
        { message: v.get('subdomainReserved') }
      ),
  });
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const subdomainValidation = z.object({
  domain: z
    .string()
    .min(SUBDOMAIN_CONSTANTS.MIN_LENGTH, `Subdomain must be at least ${SUBDOMAIN_CONSTANTS.MIN_LENGTH} characters`)
    .max(SUBDOMAIN_CONSTANTS.MAX_LENGTH, `Subdomain must be less than ${SUBDOMAIN_CONSTANTS.MAX_LENGTH} characters`)
    .toLowerCase()
    .regex(subdomainRegex, 'Invalid subdomain format')
    .refine(
      (val) => !val.includes('--'),
      'Subdomain cannot contain consecutive hyphens'
    )
    .refine(
      (val) => !RESERVED_SUBDOMAINS.includes(val as any),
      'This subdomain is reserved and cannot be used'
    ),
});

export function validateSubdomain(
  subdomain: string,
  dictionary?: Dictionary
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Use localized messages if dictionary available, otherwise fallback to English
  const v = dictionary ? getValidationMessages(dictionary) : null;

  // Length validation
  if (subdomain.length < SUBDOMAIN_CONSTANTS.MIN_LENGTH) {
    errors.push(
      v?.get('subdomainMinLength', { min: SUBDOMAIN_CONSTANTS.MIN_LENGTH }) ||
      `Must be at least ${SUBDOMAIN_CONSTANTS.MIN_LENGTH} characters long`
    );
  }
  if (subdomain.length > SUBDOMAIN_CONSTANTS.MAX_LENGTH) {
    errors.push(
      v?.get('subdomainMaxLength', { max: SUBDOMAIN_CONSTANTS.MAX_LENGTH }) ||
      `Must be less than ${SUBDOMAIN_CONSTANTS.MAX_LENGTH} characters long`
    );
  }

  // Character validation
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    errors.push(v?.get('subdomainInvalidChars') || 'Can only contain lowercase letters, numbers, and hyphens');
  }

  // Start/end validation
  if (!/^[a-z0-9]/.test(subdomain)) {
    errors.push(v?.get('subdomainMustStartWithLetterOrNumber') || 'Must start with a letter or number');
  }
  if (!/[a-z0-9]$/.test(subdomain)) {
    errors.push(v?.get('subdomainMustEndWithLetterOrNumber') || 'Must end with a letter or number');
  }

  // Consecutive hyphens
  if (subdomain.includes('--')) {
    errors.push(v?.get('subdomainNoConsecutiveHyphens') || 'Cannot contain consecutive hyphens');
  }

  // Reserved words
  if (RESERVED_SUBDOMAINS.includes(subdomain as any)) {
    errors.push(v?.get('subdomainReserved') || 'This subdomain is reserved and cannot be used');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateSubdomainFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, SUBDOMAIN_CONSTANTS.MAX_LENGTH);
}

export function isValidSubdomainLength(subdomain: string): boolean {
  return subdomain.length >= SUBDOMAIN_CONSTANTS.MIN_LENGTH && 
         subdomain.length <= SUBDOMAIN_CONSTANTS.MAX_LENGTH;
}

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain as any);
}

export type SubdomainValidation = z.infer<typeof subdomainValidation>;