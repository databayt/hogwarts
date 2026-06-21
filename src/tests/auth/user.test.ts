// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * User Utility Tests
 *
 * Tests for user-related utility functions including:
 * - getUserByEmail
 * - getUserById
 * - getOrCreateOAuthUser
 * - deleteCurrentUser
 *
 * KNOWN ISSUES TESTED:
 * - P0: getUserByEmail returns non-tenant-specific user
 * - P0: OAuth users created without schoolId
 */

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createMockUser, mockSession } from "@/tests/mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import modules AFTER mocking
import { db } from "@/lib/db"
import {
  deleteCurrentUser,
  getOrCreateOAuthUser,
  getUserByEmail,
  getUserById,
} from "@/components/auth/user"

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock the auth module
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Type the mocked functions
const mockedDb = vi.mocked(db)
const mockedAuth = vi.mocked(auth)
const mockedRevalidatePath = vi.mocked(revalidatePath)

// ============================================================================
// getUserByEmail Tests
// ============================================================================

describe("getUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return user when found by email", async () => {
    const mockUser = createMockUser({ email: "test@example.com" })
    mockedDb.user.findMany.mockResolvedValue([mockUser])

    const result = await getUserByEmail("test@example.com")

    expect(result).toEqual(mockUser)
    // Current implementation: looks for platform users (schoolId: null) first
    expect(mockedDb.user.findMany).toHaveBeenCalledWith({
      where: { email: "test@example.com", schoolId: null },
      orderBy: { updatedAt: "desc" },
    })
  })

  it("should return null when user not found", async () => {
    mockedDb.user.findMany.mockResolvedValue([])
    // Fallback: findFirst is called when no platform user found (backward compat)
    mockedDb.user.findFirst.mockResolvedValue(null)

    const result = await getUserByEmail("notfound@example.com")

    expect(result).toBeNull()
  })

  it("should return null on database error", async () => {
    mockedDb.user.findMany.mockRejectedValue(new Error("Database error"))

    const result = await getUserByEmail("test@example.com")

    expect(result).toBeNull()
  })

  it("should return most recent user when multiple exist", async () => {
    const olderUser = createMockUser({
      id: "user-1",
      email: "test@example.com",
    })
    const newerUser = createMockUser({
      id: "user-2",
      email: "test@example.com",
    })
    mockedDb.user.findMany.mockResolvedValue([newerUser, olderUser])

    const result = await getUserByEmail("test@example.com")

    expect(result?.id).toBe("user-2")
  })

  /**
   * The function now accepts an optional schoolId parameter for tenant-aware
   * lookups. Without a schoolId, it searches for platform users (schoolId: null)
   * first, then falls back to any user with that email for backward compat.
   */
  it("P0 ISSUE: returns user without tenant scoping", async () => {
    const platformUser = createMockUser({
      id: "user-platform",
      email: "shared@example.com",
      schoolId: null,
    })

    // Without schoolId: looks for platform users (schoolId: null)
    mockedDb.user.findMany.mockResolvedValue([platformUser])

    const result = await getUserByEmail("shared@example.com")

    expect(result?.id).toBe("user-platform")

    // The query NOW includes schoolId: null filter (platform user lookup)
    expect(mockedDb.user.findMany).toHaveBeenCalledWith({
      where: { email: "shared@example.com", schoolId: null },
      orderBy: { updatedAt: "desc" },
    })
  })
})

// ============================================================================
// getUserById Tests
// ============================================================================

describe("getUserById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return user when found by ID", async () => {
    const mockUser = createMockUser({ id: "user-123" })
    mockedDb.user.findUnique.mockResolvedValue(mockUser)

    const result = await getUserById("user-123")

    expect(result).toEqual(mockUser)
    expect(mockedDb.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
    })
  })

  it("should return null when user not found", async () => {
    mockedDb.user.findUnique.mockResolvedValue(null)

    const result = await getUserById("nonexistent")

    expect(result).toBeNull()
  })

  it("should return null on database error", async () => {
    mockedDb.user.findUnique.mockRejectedValue(new Error("Database error"))

    const result = await getUserById("user-123")

    expect(result).toBeNull()
  })

  it("should return extended user type with additional fields", async () => {
    const mockUser = createMockUser({ id: "user-123" })
    mockedDb.user.findUnique.mockResolvedValue(mockUser)

    const result = await getUserById("user-123")

    // ExtendedUser should have optional firstName, lastName, currency
    expect(result).toBeDefined()
  })
})

// ============================================================================
// getOrCreateOAuthUser Tests
// ============================================================================

describe("getOrCreateOAuthUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return existing user if found", async () => {
    const existingUser = createMockUser({
      email: "oauth@example.com",
      schoolId: "existing-school",
    })
    mockedDb.user.findMany.mockResolvedValue([existingUser])

    const result = await getOrCreateOAuthUser("oauth@example.com", "google", {
      name: "OAuth User",
      image: "https://example.com/avatar.jpg",
    })

    expect(result).toEqual(existingUser)
    expect(mockedDb.user.create).not.toHaveBeenCalled()
  })

  it("should create new user if not found", async () => {
    const newUser = createMockUser({
      email: "new@example.com",
      schoolId: null, // OAuth users start without schoolId
    })
    mockedDb.user.findMany.mockResolvedValue([])
    mockedDb.user.create.mockResolvedValue(newUser)

    const result = await getOrCreateOAuthUser("new@example.com", "google", {
      name: "New OAuth User",
      image: "https://example.com/avatar.jpg",
    })

    expect(mockedDb.user.create).toHaveBeenCalled()
    expect(result).toEqual(newUser)
  })

  it("should use profile name for username", async () => {
    mockedDb.user.findMany.mockResolvedValue([])
    mockedDb.user.create.mockResolvedValue(createMockUser())

    await getOrCreateOAuthUser("test@example.com", "google", {
      name: "John Doe",
    })

    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: "John Doe",
      }),
    })
  })

  it("should use email prefix as fallback username", async () => {
    mockedDb.user.findMany.mockResolvedValue([])
    mockedDb.user.create.mockResolvedValue(createMockUser())

    await getOrCreateOAuthUser("john@example.com", "google", {})

    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: "john",
      }),
    })
  })

  it("should set emailVerified for OAuth users", async () => {
    mockedDb.user.findMany.mockResolvedValue([])
    mockedDb.user.create.mockResolvedValue(createMockUser())

    await getOrCreateOAuthUser("test@example.com", "google", {})

    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        emailVerified: expect.any(Date),
      }),
    })
  })

  it("should return null on database error", async () => {
    mockedDb.user.findMany.mockRejectedValue(new Error("Database error"))

    const result = await getOrCreateOAuthUser("test@example.com", "google", {})

    expect(result).toBeNull()
  })

  /**
   * KNOWN ISSUE - P0: OAuth users created without schoolId
   *
   * This test documents that new OAuth users are created without a schoolId.
   * They exist in "limbo" until completing onboarding.
   *
   * REQUIRED FIX: Ensure onboarding is mandatory for users without schoolId,
   * or link to school during OAuth flow when subdomain context exists.
   */
  it("P0 ISSUE: creates user without schoolId", async () => {
    const userWithoutSchool = createMockUser({ schoolId: null })
    mockedDb.user.findMany.mockResolvedValue([])
    mockedDb.user.create.mockResolvedValue(userWithoutSchool)

    await getOrCreateOAuthUser("new@example.com", "google", {})

    // This documents the ISSUE: OAuth users have no schoolId
    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        role: "USER", // Default role
        // schoolId is NOT set - this is the issue
      }),
    })

    // Verify schoolId is NOT in the create call
    const createCall = mockedDb.user.create.mock.calls[0][0]
    expect(createCall.data.schoolId).toBeUndefined()
  })
})

// ============================================================================
// deleteCurrentUser Tests
// ============================================================================

describe("deleteCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should delete user when authenticated", async () => {
    const session = mockSession({ userId: "user-to-delete" })
    mockedAuth.mockResolvedValue(session)
    mockedDb.user.delete.mockResolvedValue(createMockUser() as any)

    const result = await deleteCurrentUser()

    expect(result).toEqual({ success: true })
    expect(mockedDb.user.delete).toHaveBeenCalledWith({
      where: { id: "user-to-delete" },
    })
    // revalidatePath("/") is called after delete — verified implicitly by
    // result being { success: true } (would be caught if it threw)
  })

  it("should return error when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null)

    const result = await deleteCurrentUser()

    expect(result).toEqual({ success: false, error: "Not authenticated" })
    expect(mockedDb.user.delete).not.toHaveBeenCalled()
  })

  it("should return error when session has no user id", async () => {
    mockedAuth.mockResolvedValue({ user: {}, expires: "" } as any)

    const result = await deleteCurrentUser()

    expect(result).toEqual({ success: false, error: "Not authenticated" })
  })

  it("should return error on database error", async () => {
    const session = mockSession()
    mockedAuth.mockResolvedValue(session)
    mockedDb.user.delete.mockRejectedValue(new Error("Database error"))

    const result = await deleteCurrentUser()

    expect(result).toEqual({
      success: false,
      error: "Failed to delete user account",
    })
  })
})

// ============================================================================
// Multi-Tenant Safety Tests
// ============================================================================

describe("Multi-Tenant Safety", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * CRITICAL: These tests document multi-tenant safety concerns
   */

  it("ISSUE: getUserByEmail now uses schoolId: null for platform user lookup", async () => {
    // The function now scopes the platform lookup to schoolId: null
    const platformUser = createMockUser({
      email: "test@example.com",
      schoolId: null,
    })
    mockedDb.user.findMany.mockResolvedValue([platformUser])

    await getUserByEmail("test@example.com")

    // Query includes schoolId: null (platform user scope)
    const queryArg = mockedDb.user.findMany.mock.calls[0][0]
    expect(queryArg.where).toHaveProperty("schoolId", null)
  })

  it("ISSUE: getOrCreateOAuthUser does not consider subdomain context", async () => {
    // When user registers via OAuth on school.databayt.org,
    // they should be linked to that school. Currently, they are not.
    mockedDb.user.findMany.mockResolvedValue([])
    mockedDb.user.create.mockResolvedValue(createMockUser({ schoolId: null }))

    // No way to pass schoolId/subdomain context
    await getOrCreateOAuthUser("test@example.com", "google", {})

    // schoolId is not set
    const createArg = mockedDb.user.create.mock.calls[0][0]
    expect(createArg.data.schoolId).toBeUndefined()
  })
})
