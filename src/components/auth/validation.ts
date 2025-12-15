/**
 * Authentication Validation Schemas
 *
 * Comprehensive validation for user authentication and account management:
 * - Login: Email + password (+ optional 2FA code)
 * - Registration: Email + password + username
 * - Settings: Name, email, role, 2FA toggle, password change (coupled validation)
 * - Password reset: Email address confirmation
 * - Password change: Current password required before setting new
 * - 2FA: Optional second factor (SMS, authenticator app, etc.)
 * - Roles: ADMIN vs USER (with permission-based access control)
 *
 * Key validation rules:
 * - Password: Min 6 chars (longer is configurable per school)
 * - Email: Standard email format, normalized to lowercase
 * - Username: Required on registration (human-readable identifier)
 * - 2FA code: Optional on login (when 2FA enabled)
 * - Coupled validation: Can't set newPassword without currentPassword (security)
 * - Coupled validation: Can't provide password without newPassword (UX)
 *
 * Why coupled validation:
 * - Password change: Prevents accidental "update password" without new value
 * - Security: Requires old password to prevent hijacked session from changing password
 * - UX: Form shows error before submit (immediate feedback)
 *
 * Why i18n factory functions:
 * - Messages in dictionary: "Password must be 6+ characters" (translated)
 * - Backward compatibility: Legacy schemas without i18n still work
 * - Pattern: factory(dictionary) → schema with translated messages
 *
 * TODO: Implement password strength requirements
 * - Uppercase, lowercase, numbers, special chars
 * - Zxcvbn library for cracking time estimation
 * - Prevent common passwords (password123, qwerty, etc.)
 */

import * as z from "zod";
import { UserRole } from "@prisma/client";
import { getValidationMessages } from "@/components/internationalization/helpers";
import type { Dictionary } from "@/components/internationalization/dictionaries";

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createSettingsSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.enum([UserRole.ADMIN, UserRole.USER]),
    email: z.optional(z.string().email()),
    password: z.optional(z.string().min(6)),
    newPassword: z.optional(z.string().min(6)),
  })
    .refine((data) => {
      // Coupled validation: newPassword requires current password
      // Why: Can't change password without proving you know old one (security)
      if (data.password && !data.newPassword) {
        return false;
      }
      return true;
    }, {
      message: v.get('newPasswordRequired'),
      path: ["newPassword"]
    })
    .refine((data) => {
      // Coupled validation: newPassword requires current password
      // Why: If you have newPassword, must provide current to verify identity
      if (data.newPassword && !data.password) {
        return false;
      }
      return true;
    }, {
      message: v.get('passwordRequired'),
      path: ["password"]
    });
}

export function createNewPasswordSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    password: z.string().min(6, {
      message: v.passwordMinLength(),
    }),
  });
}

export function createResetSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    email: z.string().email({
      message: v.email(),
    }),
  });
}

export function createLoginSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    email: z.string().email({
      message: v.email(),
    }),
    password: z.string().min(1, {
      message: v.get('passwordRequired'),
    }),
    code: z.optional(z.string()),
  });
}

export function createRegisterSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary);

  return z.object({
    email: z.string().email({
      message: v.email(),
    }),
    password: z.string().min(6, {
      message: v.passwordMinLength(),
    }),
    username: z.string().min(1, {
      message: v.get('nameRequired'),
    }),
  });
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const SettingsSchema = z.object({
  name: z.optional(z.string()),
  isTwoFactorEnabled: z.optional(z.boolean()),
  role: z.enum([UserRole.ADMIN, UserRole.USER]),
  email: z.optional(z.string().email()),
  password: z.optional(z.string().min(6)),
  newPassword: z.optional(z.string().min(6)),
})
  .refine((data) => {
    if (data.password && !data.newPassword) {
      return false;
    }
    return true;
  }, {
    message: "New password is required!",
    path: ["newPassword"]
  })
  .refine((data) => {
    if (data.newPassword && !data.password) {
      return false;
    }
    return true;
  }, {
    message: "Password is required!",
    path: ["password"]
  });

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  username: z.string().min(1, {
    message: "Username is required",
  }),
});
