import { z } from "zod";
import { SUBDOMAIN_CONSTANTS, RESERVED_SUBDOMAINS } from "./config";

const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

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

export function validateSubdomain(subdomain: string): { 
  isValid: boolean; 
  errors: string[]; 
} {
  const errors: string[] = [];

  // Length validation
  if (subdomain.length < SUBDOMAIN_CONSTANTS.MIN_LENGTH) {
    errors.push(`Must be at least ${SUBDOMAIN_CONSTANTS.MIN_LENGTH} characters long`);
  }
  if (subdomain.length > SUBDOMAIN_CONSTANTS.MAX_LENGTH) {
    errors.push(`Must be less than ${SUBDOMAIN_CONSTANTS.MAX_LENGTH} characters long`);
  }

  // Character validation
  if (!/^[a-z0-9-]+$/.test(subdomain)) {
    errors.push('Can only contain lowercase letters, numbers, and hyphens');
  }

  // Start/end validation
  if (!/^[a-z0-9]/.test(subdomain)) {
    errors.push('Must start with a letter or number');
  }
  if (!/[a-z0-9]$/.test(subdomain)) {
    errors.push('Must end with a letter or number');
  }

  // Consecutive hyphens
  if (subdomain.includes('--')) {
    errors.push('Cannot contain consecutive hyphens');
  }

  // Reserved words
  if (RESERVED_SUBDOMAINS.includes(subdomain as any)) {
    errors.push('This subdomain is reserved and cannot be used');
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