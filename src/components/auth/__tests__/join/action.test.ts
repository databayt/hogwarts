/**
 * Registration Action Tests
 *
 * Tests for the registration server action including:
 * - Validation
 * - User creation
 * - Email verification
 * - Error handling
 *
 * KNOWN ISSUES TESTED:
 * - P0: User created without schoolId (multi-tenant isolation)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies BEFORE any imports
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/components/auth/user', () => ({
  getUserByEmail: vi.fn(),
}))

vi.mock('@/components/auth/tokens', () => ({
  generateVerificationToken: vi.fn(),
}))

vi.mock('@/components/auth/mail', () => ({
  sendVerificationEmail: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$10$hashedPassword'),
    compare: vi.fn(),
  },
}))

// Import modules AFTER mocking
import { db } from '@/lib/db'
import { getUserByEmail } from '@/components/auth/user'
import { generateVerificationToken } from '@/components/auth/tokens'
import { sendVerificationEmail } from '@/components/auth/mail'
import bcrypt from 'bcryptjs'
import { register } from '../../join/action'

// Type the mocked functions
const mockedDb = vi.mocked(db)
const mockedGetUserByEmail = vi.mocked(getUserByEmail)
const mockedGenerateVerificationToken = vi.mocked(generateVerificationToken)
const mockedSendVerificationEmail = vi.mocked(sendVerificationEmail)
const mockedBcrypt = vi.mocked(bcrypt)

// ============================================================================
// Validation Tests
// ============================================================================

describe('Register Action - Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return error for invalid email', async () => {
    const result = await register({
      email: 'invalid-email',
      password: 'password123',
      username: 'testuser',
    })

    expect(result).toEqual({ error: 'Invalid fields!' })
    expect(mockedGetUserByEmail).not.toHaveBeenCalled()
  })

  it('should return error for short password', async () => {
    const result = await register({
      email: 'test@example.com',
      password: '12345', // Less than 6 characters
      username: 'testuser',
    })

    expect(result).toEqual({ error: 'Invalid fields!' })
  })

  it('should return error for empty username', async () => {
    const result = await register({
      email: 'test@example.com',
      password: 'password123',
      username: '',
    })

    expect(result).toEqual({ error: 'Invalid fields!' })
  })
})

// ============================================================================
// User Existence Tests
// ============================================================================

describe('Register Action - User Existence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return error when email is already in use', async () => {
    mockedGetUserByEmail.mockResolvedValue({
      id: 'existing-user',
      email: 'existing@example.com',
    } as never)

    const result = await register({
      email: 'existing@example.com',
      password: 'password123',
      username: 'testuser',
    })

    expect(result).toEqual({ error: 'Email already in use!' })
    expect(mockedDb.user.create).not.toHaveBeenCalled()
  })
})

// ============================================================================
// User Creation Tests
// ============================================================================

describe('Register Action - User Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetUserByEmail.mockResolvedValue(null)
    mockedGenerateVerificationToken.mockResolvedValue({
      id: 'token-id',
      email: 'new@example.com',
      token: 'verification-token',
      expires: new Date(),
    })
  })

  it('should hash password before storing', async () => {
    await register({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })

    expect(mockedBcrypt.hash).toHaveBeenCalledWith('password123', 10)
    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        password: '$2a$10$hashedPassword',
      }),
    })
  })

  it('should create user with correct fields', async () => {
    await register({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })

    expect(mockedDb.user.create).toHaveBeenCalledWith({
      data: {
        username: 'newuser',
        email: 'new@example.com',
        password: '$2a$10$hashedPassword',
      },
    })
  })

  /**
   * KNOWN ISSUE - P0: User created without schoolId
   *
   * This test documents that new users are created without a schoolId.
   * In a multi-tenant system, this means the user exists in "limbo"
   * until completing onboarding.
   *
   * REQUIRED FIX: Either:
   * 1. Require school context during registration (subdomain-based)
   * 2. Force onboarding for users without schoolId
   */
  it('P0 ISSUE: creates user without schoolId', async () => {
    await register({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })

    // Document the ISSUE: schoolId is NOT set
    const createCall = mockedDb.user.create.mock.calls[0][0]
    expect(createCall.data.schoolId).toBeUndefined()
  })
})

// ============================================================================
// Email Verification Tests
// ============================================================================

describe('Register Action - Email Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetUserByEmail.mockResolvedValue(null)
  })

  it('should generate verification token after user creation', async () => {
    mockedGenerateVerificationToken.mockResolvedValue({
      id: 'token-id',
      email: 'new@example.com',
      token: 'verification-token',
      expires: new Date(),
    })

    await register({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })

    expect(mockedGenerateVerificationToken).toHaveBeenCalledWith('new@example.com')
  })

  it('should send verification email with correct token', async () => {
    mockedGenerateVerificationToken.mockResolvedValue({
      id: 'token-id',
      email: 'new@example.com',
      token: 'verification-token',
      expires: new Date(),
    })

    await register({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })

    expect(mockedSendVerificationEmail).toHaveBeenCalledWith(
      'new@example.com',
      'verification-token'
    )
  })

  it('should return success message after sending email', async () => {
    mockedGenerateVerificationToken.mockResolvedValue({
      id: 'token-id',
      email: 'new@example.com',
      token: 'verification-token',
      expires: new Date(),
    })

    const result = await register({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })

    expect(result).toEqual({ success: 'Confirmation email sent!' })
  })
})

// ============================================================================
// Multi-Tenant Safety Tests
// ============================================================================

describe('Register Action - Multi-Tenant Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * CRITICAL: These tests document multi-tenant concerns in registration
   */

  it('ISSUE: registration does not consider subdomain context', async () => {
    mockedGetUserByEmail.mockResolvedValue(null)
    mockedGenerateVerificationToken.mockResolvedValue({
      id: 'token-id',
      email: 'new@example.com',
      token: 'token',
      expires: new Date(),
    })

    // Registration should ideally accept schoolId from subdomain context
    // Currently, it creates users without any school association
    await register({
      email: 'new@example.com',
      password: 'password123',
      username: 'newuser',
    })

    // User is created without schoolId
    const createCall = mockedDb.user.create.mock.calls[0][0]
    expect(createCall.data).not.toHaveProperty('schoolId')
  })

  it('ISSUE: same email can register multiple times across different contexts', async () => {
    // First registration
    mockedGetUserByEmail.mockResolvedValueOnce(null)
    mockedGenerateVerificationToken.mockResolvedValue({
      id: 'token-id',
      email: 'shared@example.com',
      token: 'token',
      expires: new Date(),
    })

    const result1 = await register({
      email: 'shared@example.com',
      password: 'password123',
      username: 'user1',
    })

    expect(result1).toEqual({ success: 'Confirmation email sent!' })

    // If getUserByEmail doesn't scope by schoolId, second registration would fail
    // even if it should succeed for a different school
    mockedGetUserByEmail.mockResolvedValueOnce({
      id: 'existing-user',
      email: 'shared@example.com',
      schoolId: 'other-school',
    } as never)

    const result2 = await register({
      email: 'shared@example.com',
      password: 'password456',
      username: 'user2',
    })

    // Currently: blocks registration because email exists (regardless of school)
    // Expected: should allow registration if schoolId is different
    expect(result2).toEqual({ error: 'Email already in use!' })
  })
})
