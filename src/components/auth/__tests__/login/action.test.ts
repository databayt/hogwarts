/**
 * Login Action Tests
 *
 * Tests for the login server action including:
 * - Validation
 * - User existence checks
 * - Email verification flow
 * - Two-factor authentication flow
 * - Smart subdomain redirect
 * - Error handling
 */

import { signIn } from "@/auth"
import { createMockUser } from "@/test/mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import modules AFTER mocking
import { db } from "@/lib/db"
import {
  sendTwoFactorTokenEmail,
  sendVerificationEmail,
} from "@/components/auth/mail"
import {
  generateTwoFactorToken,
  generateVerificationToken,
} from "@/components/auth/tokens"
import { getUserByEmail } from "@/components/auth/user"
import { getTwoFactorConfirmationByUserId } from "@/components/auth/verification/2f-confirmation"
import { getTwoFactorTokenByEmail } from "@/components/auth/verification/2f-token"

import { login } from "../../login/action"

// Mock all dependencies BEFORE any imports
// These need to be hoisted to avoid next-auth import issues
vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    twoFactorToken: {
      delete: vi.fn(),
    },
    twoFactorConfirmation: {
      delete: vi.fn(),
      create: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/components/auth/user", () => ({
  getUserByEmail: vi.fn(),
}))

vi.mock("@/components/auth/verification/2f-token", () => ({
  getTwoFactorTokenByEmail: vi.fn(),
}))

vi.mock("@/components/auth/verification/2f-confirmation", () => ({
  getTwoFactorConfirmationByUserId: vi.fn(),
}))

vi.mock("@/components/auth/tokens", () => ({
  generateTwoFactorToken: vi.fn(),
  generateVerificationToken: vi.fn(),
}))

vi.mock("@/components/auth/mail", () => ({
  sendTwoFactorTokenEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}))

vi.mock("@/routes", () => ({
  DEFAULT_LOGIN_REDIRECT: "/dashboard",
}))

// Mock next-auth to prevent import issues
vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    type: string
    constructor(message: string, options?: { type: string }) {
      super(message)
      this.type = options?.type || "Error"
    }
  },
}))

// Type the mocked functions
const mockedDb = vi.mocked(db)
const mockedGetUserByEmail = vi.mocked(getUserByEmail)
const mockedGetTwoFactorTokenByEmail = vi.mocked(getTwoFactorTokenByEmail)
const mockedGetTwoFactorConfirmationByUserId = vi.mocked(
  getTwoFactorConfirmationByUserId
)
const mockedGenerateTwoFactorToken = vi.mocked(generateTwoFactorToken)
const mockedGenerateVerificationToken = vi.mocked(generateVerificationToken)
const mockedSendTwoFactorTokenEmail = vi.mocked(sendTwoFactorTokenEmail)
const mockedSendVerificationEmail = vi.mocked(sendVerificationEmail)
const mockedSignIn = vi.mocked(signIn)

// ============================================================================
// Validation Tests
// ============================================================================

describe("Login Action - Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return error for invalid email", async () => {
    const result = await login({
      email: "invalid-email",
      password: "password123",
    })

    expect(result).toEqual({ error: "Invalid fields!" })
    expect(mockedGetUserByEmail).not.toHaveBeenCalled()
  })

  it("should return error for empty password", async () => {
    const result = await login({
      email: "test@example.com",
      password: "",
    })

    expect(result).toEqual({ error: "Invalid fields!" })
  })

  it("should return error for missing required fields", async () => {
    const result = await login({
      email: "",
      password: "",
    })

    expect(result).toEqual({ error: "Invalid fields!" })
  })
})

// ============================================================================
// User Existence Tests
// ============================================================================

describe("Login Action - User Existence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return error when user does not exist", async () => {
    mockedGetUserByEmail.mockResolvedValue(null)

    const result = await login({
      email: "notfound@example.com",
      password: "password123",
    })

    expect(result).toEqual({ error: "Email does not exist!" })
  })

  it("should return error when user has no password (OAuth user)", async () => {
    // Use raw object because createMockUser's ?? doesn't handle null properly
    mockedGetUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "oauth@example.com",
      emailVerified: new Date(),
      password: null, // OAuth users have no password
      role: "USER",
      schoolId: null,
      isTwoFactorEnabled: false,
      image: null,
      username: null,
    } as never)

    const result = await login({
      email: "oauth@example.com",
      password: "password123",
    })

    expect(result).toEqual({ error: "Email does not exist!" })
  })

  it("should return error when user email is missing", async () => {
    mockedGetUserByEmail.mockResolvedValue({
      id: "user-1",
      email: null, // Missing email
      emailVerified: new Date(),
      password: "hashedpassword",
      role: "USER",
      schoolId: null,
      isTwoFactorEnabled: false,
      image: null,
      username: null,
    } as never)

    const result = await login({
      email: "test@example.com",
      password: "password123",
    })

    expect(result).toEqual({ error: "Email does not exist!" })
  })
})

// ============================================================================
// Email Verification Flow Tests
// ============================================================================

describe("Login Action - Email Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should send verification email when user is not verified", async () => {
    // Use raw object to properly set emailVerified to null
    const unverifiedUser = {
      id: "user-1",
      email: "unverified@example.com",
      emailVerified: null, // Not verified
      password: "hashedpassword",
      role: "USER",
      schoolId: null,
      isTwoFactorEnabled: false,
      image: null,
      username: null,
    }
    mockedGetUserByEmail.mockResolvedValue(unverifiedUser as never)
    mockedGenerateVerificationToken.mockResolvedValue({
      id: "token-id",
      email: "unverified@example.com",
      token: "verification-token",
      expires: new Date(),
    })

    const result = await login({
      email: "unverified@example.com",
      password: "password123",
    })

    expect(result).toEqual({ success: "Confirmation email sent!" })
    expect(mockedGenerateVerificationToken).toHaveBeenCalledWith(
      "unverified@example.com"
    )
    expect(mockedSendVerificationEmail).toHaveBeenCalledWith(
      "unverified@example.com",
      "verification-token"
    )
  })

  it("should not proceed to sign in when not verified", async () => {
    // Use raw object to properly set emailVerified to null
    mockedGetUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      emailVerified: null, // Not verified
      password: "hashedpassword",
      role: "USER",
      schoolId: null,
      isTwoFactorEnabled: false,
      image: null,
      username: null,
    } as never)
    mockedGenerateVerificationToken.mockResolvedValue({
      id: "token-id",
      email: "test@example.com",
      token: "token",
      expires: new Date(),
    })

    await login({
      email: "test@example.com",
      password: "password123",
    })

    expect(mockedSignIn).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Two-Factor Authentication Tests
// ============================================================================

describe("Login Action - Two-Factor Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should send 2FA email when enabled and no code provided", async () => {
    const user2FA = createMockUser({
      email: "2fa@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: true,
    })
    mockedGetUserByEmail.mockResolvedValue(user2FA)
    mockedGenerateTwoFactorToken.mockResolvedValue({
      id: "token-id",
      email: "2fa@example.com",
      token: "123456",
      expires: new Date(),
    })

    const result = await login({
      email: "2fa@example.com",
      password: "password123",
    })

    expect(result).toEqual({ twoFactor: true })
    expect(mockedGenerateTwoFactorToken).toHaveBeenCalledWith("2fa@example.com")
    expect(mockedSendTwoFactorTokenEmail).toHaveBeenCalledWith(
      "2fa@example.com",
      "123456"
    )
  })

  it("should return error for invalid 2FA code", async () => {
    const user2FA = createMockUser({
      email: "2fa@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: true,
    })
    mockedGetUserByEmail.mockResolvedValue(user2FA)
    mockedGetTwoFactorTokenByEmail.mockResolvedValue({
      id: "token-id",
      email: "2fa@example.com",
      token: "654321",
      expires: new Date(Date.now() + 300000), // Not expired
    })

    const result = await login({
      email: "2fa@example.com",
      password: "password123",
      code: "123456", // Wrong code
    })

    expect(result).toEqual({ error: "Invalid code!" })
  })

  it("should return error when no 2FA token exists", async () => {
    const user2FA = createMockUser({
      email: "2fa@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: true,
    })
    mockedGetUserByEmail.mockResolvedValue(user2FA)
    mockedGetTwoFactorTokenByEmail.mockResolvedValue(null)

    const result = await login({
      email: "2fa@example.com",
      password: "password123",
      code: "123456",
    })

    expect(result).toEqual({ error: "Invalid code!" })
  })

  it("should return error for expired 2FA code", async () => {
    const user2FA = createMockUser({
      email: "2fa@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: true,
    })
    mockedGetUserByEmail.mockResolvedValue(user2FA)
    mockedGetTwoFactorTokenByEmail.mockResolvedValue({
      id: "token-id",
      email: "2fa@example.com",
      token: "123456",
      expires: new Date(Date.now() - 1000), // Expired
    })

    const result = await login({
      email: "2fa@example.com",
      password: "password123",
      code: "123456",
    })

    expect(result).toEqual({ error: "Code expired!" })
  })

  it("should delete token and create confirmation on valid 2FA", async () => {
    const user2FA = createMockUser({
      id: "user-2fa",
      email: "2fa@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: true,
    })
    mockedGetUserByEmail.mockResolvedValue(user2FA)
    mockedGetTwoFactorTokenByEmail.mockResolvedValue({
      id: "token-id",
      email: "2fa@example.com",
      token: "123456",
      expires: new Date(Date.now() + 300000),
    })
    mockedGetTwoFactorConfirmationByUserId.mockResolvedValue(null)
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "2fa@example.com",
      password: "password123",
      code: "123456",
    })

    expect(mockedDb.twoFactorToken.delete).toHaveBeenCalledWith({
      where: { id: "token-id" },
    })
    expect(mockedDb.twoFactorConfirmation.create).toHaveBeenCalledWith({
      data: { userId: "user-2fa" },
    })
  })

  it("should delete existing confirmation before creating new one", async () => {
    const user2FA = createMockUser({
      id: "user-2fa",
      email: "2fa@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: true,
    })
    mockedGetUserByEmail.mockResolvedValue(user2FA)
    mockedGetTwoFactorTokenByEmail.mockResolvedValue({
      id: "token-id",
      email: "2fa@example.com",
      token: "123456",
      expires: new Date(Date.now() + 300000),
    })
    mockedGetTwoFactorConfirmationByUserId.mockResolvedValue({
      id: "existing-confirmation-id",
      userId: "user-2fa",
    })
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "2fa@example.com",
      password: "password123",
      code: "123456",
    })

    expect(mockedDb.twoFactorConfirmation.delete).toHaveBeenCalledWith({
      where: { id: "existing-confirmation-id" },
    })
  })
})

// ============================================================================
// Smart Subdomain Redirect Tests
// ============================================================================

describe("Login Action - Smart Subdomain Redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should redirect to school subdomain for regular users", async () => {
    const user = createMockUser({
      email: "teacher@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      schoolId: "school-123",
      role: "TEACHER",
    })
    mockedGetUserByEmail.mockResolvedValue(user)
    mockedDb.school.findUnique.mockResolvedValue({
      id: "school-123",
      domain: "hogwarts",
    } as never)
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "teacher@example.com",
      password: "password123",
    })

    // In development, should use localhost
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email: "teacher@example.com",
      password: "password123",
      redirectTo: expect.stringContaining("hogwarts"),
    })
  })

  it("should use default redirect for DEVELOPER role", async () => {
    const developer = createMockUser({
      email: "dev@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      schoolId: "school-123",
      role: "DEVELOPER",
    })
    mockedGetUserByEmail.mockResolvedValue(developer)
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "dev@example.com",
      password: "password123",
    })

    // Should NOT lookup school for developers
    expect(mockedDb.school.findUnique).not.toHaveBeenCalled()
    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email: "dev@example.com",
      password: "password123",
      redirectTo: "/dashboard",
    })
  })

  it("should use default redirect when user has no schoolId", async () => {
    // Use raw object to properly set schoolId to null
    mockedGetUserByEmail.mockResolvedValue({
      id: "user-1",
      email: "noschool@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      schoolId: null, // No school
      role: "USER",
      isTwoFactorEnabled: false,
      image: null,
      username: null,
    } as never)
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "noschool@example.com",
      password: "password123",
    })

    expect(mockedDb.school.findUnique).not.toHaveBeenCalled()
  })

  it("should fallback to default redirect if school lookup fails", async () => {
    const user = createMockUser({
      email: "user@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      schoolId: "school-123",
      role: "TEACHER",
    })
    mockedGetUserByEmail.mockResolvedValue(user)
    mockedDb.school.findUnique.mockRejectedValue(new Error("Database error"))
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "user@example.com",
      password: "password123",
    })

    // Should still call signIn with default redirect
    expect(mockedSignIn).toHaveBeenCalled()
  })

  it("should use callbackUrl when provided", async () => {
    const user = createMockUser({
      email: "user@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      schoolId: null,
      role: "USER",
    })
    mockedGetUserByEmail.mockResolvedValue(user)
    mockedSignIn.mockResolvedValue(undefined)

    await login(
      {
        email: "user@example.com",
        password: "password123",
      },
      "/custom/callback"
    )

    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: "/custom/callback",
    })
  })
})

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("Login Action - Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return error for invalid credentials", async () => {
    const user = createMockUser({
      email: "user@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
    })
    mockedGetUserByEmail.mockResolvedValue(user)

    // Import AuthError from our mock
    const { AuthError } = await import("next-auth")
    const authError = new AuthError("CredentialsSignin", {
      type: "CredentialsSignin",
    })
    mockedSignIn.mockRejectedValue(authError)

    const result = await login({
      email: "user@example.com",
      password: "wrongpassword",
    })

    expect(result).toEqual({ error: "Invalid credentials!" })
  })

  it("should re-throw redirect errors", async () => {
    const user = createMockUser({
      email: "user@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
    })
    mockedGetUserByEmail.mockResolvedValue(user)

    const redirectError = {
      digest: "NEXT_REDIRECT;replace;/dashboard",
    }
    mockedSignIn.mockRejectedValue(redirectError)

    await expect(
      login({
        email: "user@example.com",
        password: "password123",
      })
    ).rejects.toEqual(redirectError)
  })

  it("should return generic error for unexpected errors", async () => {
    const user = createMockUser({
      email: "user@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
    })
    mockedGetUserByEmail.mockResolvedValue(user)
    mockedSignIn.mockRejectedValue(new Error("Unexpected error"))

    const result = await login({
      email: "user@example.com",
      password: "password123",
    })

    expect(result).toEqual({
      error: "An unexpected error occurred. Please try again.",
    })
  })
})

// ============================================================================
// Successful Login Tests
// ============================================================================

describe("Login Action - Successful Login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should call signIn with correct credentials", async () => {
    const user = createMockUser({
      email: "user@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: false,
    })
    mockedGetUserByEmail.mockResolvedValue(user)
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "user@example.com",
      password: "password123",
    })

    expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
      email: "user@example.com",
      password: "password123",
      redirectTo: expect.any(String),
    })
  })

  it("should not send 2FA email for users without 2FA enabled", async () => {
    const user = createMockUser({
      email: "user@example.com",
      emailVerified: new Date(),
      password: "hashedpassword",
      isTwoFactorEnabled: false,
    })
    mockedGetUserByEmail.mockResolvedValue(user)
    mockedSignIn.mockResolvedValue(undefined)

    await login({
      email: "user@example.com",
      password: "password123",
    })

    expect(mockedGenerateTwoFactorToken).not.toHaveBeenCalled()
    expect(mockedSendTwoFactorTokenEmail).not.toHaveBeenCalled()
  })
})
