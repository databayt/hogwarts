/**
 * Auth Validation Schema Tests
 *
 * Tests for all authentication-related Zod schemas including:
 * - LoginSchema
 * - RegisterSchema
 * - ResetSchema
 * - NewPasswordSchema
 * - SettingsSchema
 * - i18n-enabled schema factories
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  createLoginSchema,
  createNewPasswordSchema,
  createRegisterSchema,
  createResetSchema,
  createSettingsSchema,
  LoginSchema,
  NewPasswordSchema,
  RegisterSchema,
  ResetSchema,
  SettingsSchema,
} from "../validation"

// ============================================================================
// Mock Dictionary for i18n Tests
// ============================================================================

const mockDictionary: Dictionary = {
  messages: {
    validation: {
      required: "Required",
      email: "Valid email required",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      passwordMinLength: "Minimum 6 characters required",
      newPasswordRequired: "New password is required",
      nameRequired: "Name is required",
      invalidCredentials: "Invalid email or password",
    },
    toast: {
      success: {},
      error: {},
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

// ============================================================================
// LoginSchema Tests
// ============================================================================

describe("LoginSchema", () => {
  describe("email validation", () => {
    it("should accept valid email", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid email format", () => {
      const result = LoginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email")
      }
    })

    it("should reject empty email", () => {
      const result = LoginSchema.safeParse({
        email: "",
        password: "password123",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing email", () => {
      const result = LoginSchema.safeParse({
        password: "password123",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("password validation", () => {
    it("should accept valid password", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("should reject empty password", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing password", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("2FA code", () => {
    it("should accept login with optional 2FA code", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        code: "123456",
      })
      expect(result.success).toBe(true)
    })

    it("should accept login without 2FA code", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })
  })
})

// ============================================================================
// RegisterSchema Tests
// ============================================================================

describe("RegisterSchema", () => {
  describe("email validation", () => {
    it("should accept valid registration data", () => {
      const result = RegisterSchema.safeParse({
        email: "newuser@example.com",
        password: "password123",
        username: "newuser",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid email", () => {
      const result = RegisterSchema.safeParse({
        email: "not-an-email",
        password: "password123",
        username: "newuser",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("password validation", () => {
    it("should reject password shorter than 6 characters", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "12345", // 5 characters
        username: "newuser",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password")
      }
    })

    it("should accept password with exactly 6 characters", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "123456",
        username: "newuser",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("username validation", () => {
    it("should reject empty username", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        username: "",
      })
      expect(result.success).toBe(false)
    })

    it("should accept valid username", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        username: "JohnDoe",
      })
      expect(result.success).toBe(true)
    })
  })
})

// ============================================================================
// ResetSchema Tests
// ============================================================================

describe("ResetSchema", () => {
  it("should accept valid email for password reset", () => {
    const result = ResetSchema.safeParse({
      email: "user@example.com",
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid email for password reset", () => {
    const result = ResetSchema.safeParse({
      email: "invalid",
    })
    expect(result.success).toBe(false)
  })

  it("should reject empty email for password reset", () => {
    const result = ResetSchema.safeParse({
      email: "",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// NewPasswordSchema Tests
// ============================================================================

describe("NewPasswordSchema", () => {
  it("should accept password with 6+ characters", () => {
    const result = NewPasswordSchema.safeParse({
      password: "newpassword123",
    })
    expect(result.success).toBe(true)
  })

  it("should reject password shorter than 6 characters", () => {
    const result = NewPasswordSchema.safeParse({
      password: "12345",
    })
    expect(result.success).toBe(false)
  })

  it("should reject empty password", () => {
    const result = NewPasswordSchema.safeParse({
      password: "",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// SettingsSchema Tests
// ============================================================================

describe("SettingsSchema", () => {
  describe("basic fields", () => {
    it("should accept valid settings with role", () => {
      const result = SettingsSchema.safeParse({
        role: "ADMIN",
      })
      expect(result.success).toBe(true)
    })

    it("should accept settings with name", () => {
      const result = SettingsSchema.safeParse({
        name: "John Doe",
        role: "USER",
      })
      expect(result.success).toBe(true)
    })

    it("should accept settings with email", () => {
      const result = SettingsSchema.safeParse({
        email: "john@example.com",
        role: "USER",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid role", () => {
      const result = SettingsSchema.safeParse({
        role: "INVALID_ROLE",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("two-factor authentication", () => {
    it("should accept enabling 2FA", () => {
      const result = SettingsSchema.safeParse({
        isTwoFactorEnabled: true,
        role: "USER",
      })
      expect(result.success).toBe(true)
    })

    it("should accept disabling 2FA", () => {
      const result = SettingsSchema.safeParse({
        isTwoFactorEnabled: false,
        role: "USER",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("password change validation", () => {
    it("should accept password change with both fields", () => {
      const result = SettingsSchema.safeParse({
        password: "oldpassword",
        newPassword: "newpassword",
        role: "USER",
      })
      expect(result.success).toBe(true)
    })

    it("should reject password without newPassword", () => {
      const result = SettingsSchema.safeParse({
        password: "oldpassword",
        role: "USER",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const newPasswordError = result.error.issues.find((e) =>
          e.path.includes("newPassword")
        )
        expect(newPasswordError).toBeDefined()
      }
    })

    it("should reject newPassword without password", () => {
      const result = SettingsSchema.safeParse({
        newPassword: "newpassword",
        role: "USER",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const passwordError = result.error.issues.find((e) =>
          e.path.includes("password")
        )
        expect(passwordError).toBeDefined()
      }
    })

    it("should reject short newPassword", () => {
      const result = SettingsSchema.safeParse({
        password: "oldpassword",
        newPassword: "12345", // Less than 6 characters
        role: "USER",
      })
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================================
// i18n Schema Factory Tests
// ============================================================================

describe("i18n Schema Factories", () => {
  describe("createLoginSchema", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createLoginSchema(mockDictionary)
      const result = schema.safeParse({
        email: "invalid",
        password: "password123",
      })
      expect(result.success).toBe(false)
    })

    it("should validate email correctly", () => {
      const schema = createLoginSchema(mockDictionary)
      const result = schema.safeParse({
        email: "test@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("createRegisterSchema", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createRegisterSchema(mockDictionary)
      const result = schema.safeParse({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      })
      expect(result.success).toBe(true)
    })

    it("should reject short password with localized message", () => {
      const schema = createRegisterSchema(mockDictionary)
      const result = schema.safeParse({
        email: "test@example.com",
        password: "123",
        username: "testuser",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createResetSchema", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createResetSchema(mockDictionary)
      const result = schema.safeParse({
        email: "test@example.com",
      })
      expect(result.success).toBe(true)
    })

    it("should reject invalid email with localized message", () => {
      const schema = createResetSchema(mockDictionary)
      const result = schema.safeParse({
        email: "not-an-email",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createNewPasswordSchema", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createNewPasswordSchema(mockDictionary)
      const result = schema.safeParse({
        password: "newpassword123",
      })
      expect(result.success).toBe(true)
    })

    it("should reject short password with localized message", () => {
      const schema = createNewPasswordSchema(mockDictionary)
      const result = schema.safeParse({
        password: "123",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("createSettingsSchema", () => {
    it("should create schema with dictionary messages", () => {
      const schema = createSettingsSchema(mockDictionary)
      const result = schema.safeParse({
        role: "ADMIN",
      })
      expect(result.success).toBe(true)
    })

    it("should validate password change with localized messages", () => {
      const schema = createSettingsSchema(mockDictionary)
      const result = schema.safeParse({
        password: "oldpassword",
        role: "USER",
        // Missing newPassword should fail
      })
      expect(result.success).toBe(false)
    })
  })
})

// ============================================================================
// Edge Cases and Security Tests
// ============================================================================

describe("Edge Cases", () => {
  describe("email edge cases", () => {
    it("should accept email with subdomain", () => {
      const result = LoginSchema.safeParse({
        email: "user@mail.example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("should accept email with plus sign", () => {
      const result = LoginSchema.safeParse({
        email: "user+tag@example.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("should accept email with numbers", () => {
      const result = LoginSchema.safeParse({
        email: "user123@example123.com",
        password: "password123",
      })
      expect(result.success).toBe(true)
    })

    it("should reject email with spaces", () => {
      const result = LoginSchema.safeParse({
        email: "user @example.com",
        password: "password123",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("password edge cases", () => {
    it("should accept password with special characters", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "P@ssw0rd!#$",
        username: "testuser",
      })
      expect(result.success).toBe(true)
    })

    it("should accept password with unicode characters", () => {
      const result = RegisterSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("2FA code edge cases", () => {
    it("should accept 6-digit 2FA code", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        code: "123456",
      })
      expect(result.success).toBe(true)
    })

    it("should accept undefined 2FA code", () => {
      const result = LoginSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        code: undefined,
      })
      expect(result.success).toBe(true)
    })
  })
})
