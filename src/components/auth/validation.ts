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
      if (data.password && !data.newPassword) {
        return false;
      }
      return true;
    }, {
      message: v.get('newPasswordRequired'),
      path: ["newPassword"]
    })
    .refine((data) => {
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
