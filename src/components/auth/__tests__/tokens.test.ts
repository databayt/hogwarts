/**
 * Token Management Tests
 *
 * Tests for token generation and retrieval functions:
 * - generateTwoFactorToken
 * - generatePasswordResetToken
 * - generateVerificationToken
 * - Token retrieval helpers (by email, by token)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    twoFactorToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    passwordResetToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    verificationToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock the token retrieval functions
vi.mock('@/components/auth/verification/2f-token', () => ({
  getTwoFactorTokenByEmail: vi.fn(),
  getTwoFactorTokenByToken: vi.fn(),
}))

vi.mock('@/components/auth/password/token', () => ({
  getPasswordResetTokenByEmail: vi.fn(),
  getPasswordResetTokenByToken: vi.fn(),
}))

vi.mock('@/components/auth/verification/verificiation-token', () => ({
  getVerificationTokenByEmail: vi.fn(),
  getVerificationTokenByToken: vi.fn(),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-token'),
}))

// Import modules AFTER mocking
import { db } from '@/lib/db'
import { getTwoFactorTokenByEmail } from '@/components/auth/verification/2f-token'
import { getPasswordResetTokenByEmail } from '@/components/auth/password/token'
import { getVerificationTokenByEmail } from '@/components/auth/verification/verificiation-token'
import {
  generateTwoFactorToken,
  generatePasswordResetToken,
  generateVerificationToken,
} from '../tokens'

// Type the mocked functions
const mockedDb = vi.mocked(db)
const mockedGetTwoFactorTokenByEmail = vi.mocked(getTwoFactorTokenByEmail)
const mockedGetPasswordResetTokenByEmail = vi.mocked(getPasswordResetTokenByEmail)
const mockedGetVerificationTokenByEmail = vi.mocked(getVerificationTokenByEmail)

// ============================================================================
// generateTwoFactorToken Tests
// ============================================================================

describe('generateTwoFactorToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a 6-digit token', async () => {
    mockedGetTwoFactorTokenByEmail.mockResolvedValue(null)
    mockedDb.twoFactorToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(),
    })

    const result = await generateTwoFactorToken('test@example.com')

    expect(mockedDb.twoFactorToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        token: expect.stringMatching(/^\d{6}$/),
      }),
    })
    expect(result).toBeDefined()
  })

  it('should set expiration to 5 minutes from now', async () => {
    mockedGetTwoFactorTokenByEmail.mockResolvedValue(null)
    mockedDb.twoFactorToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(),
    })

    const beforeCall = new Date()
    await generateTwoFactorToken('test@example.com')
    const afterCall = new Date()

    const createCall = mockedDb.twoFactorToken.create.mock.calls[0][0]
    const expiresDate = createCall.data.expires as Date

    // Token should expire ~5 minutes from now (300000ms)
    const expectedExpiry = 5 * 60 * 1000
    expect(expiresDate.getTime()).toBeGreaterThanOrEqual(
      beforeCall.getTime() + expectedExpiry - 1000
    )
    expect(expiresDate.getTime()).toBeLessThanOrEqual(
      afterCall.getTime() + expectedExpiry + 1000
    )
  })

  it('should delete existing token before creating new one', async () => {
    const existingToken = {
      id: 'existing-token-id',
      email: 'test@example.com',
      token: '654321',
      expires: new Date(),
    }
    mockedGetTwoFactorTokenByEmail.mockResolvedValue(existingToken)
    mockedDb.twoFactorToken.create.mockResolvedValue({
      id: 'new-token-id',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(),
    })

    await generateTwoFactorToken('test@example.com')

    expect(mockedDb.twoFactorToken.delete).toHaveBeenCalledWith({
      where: { id: 'existing-token-id' },
    })
    expect(mockedDb.twoFactorToken.create).toHaveBeenCalled()
  })

  it('should not delete when no existing token', async () => {
    mockedGetTwoFactorTokenByEmail.mockResolvedValue(null)
    mockedDb.twoFactorToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(),
    })

    await generateTwoFactorToken('test@example.com')

    expect(mockedDb.twoFactorToken.delete).not.toHaveBeenCalled()
    expect(mockedDb.twoFactorToken.create).toHaveBeenCalled()
  })

  it('should return the created token', async () => {
    const createdToken = {
      id: 'token-id',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(),
    }
    mockedGetTwoFactorTokenByEmail.mockResolvedValue(null)
    mockedDb.twoFactorToken.create.mockResolvedValue(createdToken)

    const result = await generateTwoFactorToken('test@example.com')

    expect(result).toEqual(createdToken)
  })
})

// ============================================================================
// generatePasswordResetToken Tests
// ============================================================================

describe('generatePasswordResetToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a UUID token', async () => {
    mockedGetPasswordResetTokenByEmail.mockResolvedValue(null)
    mockedDb.passwordResetToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    await generatePasswordResetToken('test@example.com')

    expect(mockedDb.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        token: 'mock-uuid-token',
      }),
    })
  })

  it('should set expiration to 1 hour from now', async () => {
    mockedGetPasswordResetTokenByEmail.mockResolvedValue(null)
    mockedDb.passwordResetToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    const beforeCall = new Date()
    await generatePasswordResetToken('test@example.com')
    const afterCall = new Date()

    const createCall = mockedDb.passwordResetToken.create.mock.calls[0][0]
    const expiresDate = createCall.data.expires as Date

    // Token should expire ~1 hour from now (3600000ms)
    const expectedExpiry = 3600 * 1000
    expect(expiresDate.getTime()).toBeGreaterThanOrEqual(
      beforeCall.getTime() + expectedExpiry - 1000
    )
    expect(expiresDate.getTime()).toBeLessThanOrEqual(
      afterCall.getTime() + expectedExpiry + 1000
    )
  })

  it('should delete existing token before creating new one', async () => {
    const existingToken = {
      id: 'existing-token-id',
      email: 'test@example.com',
      token: 'old-uuid-token',
      expires: new Date(),
    }
    mockedGetPasswordResetTokenByEmail.mockResolvedValue(existingToken)
    mockedDb.passwordResetToken.create.mockResolvedValue({
      id: 'new-token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    await generatePasswordResetToken('test@example.com')

    expect(mockedDb.passwordResetToken.delete).toHaveBeenCalledWith({
      where: { id: 'existing-token-id' },
    })
  })

  it('should return the created token', async () => {
    const createdToken = {
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    }
    mockedGetPasswordResetTokenByEmail.mockResolvedValue(null)
    mockedDb.passwordResetToken.create.mockResolvedValue(createdToken)

    const result = await generatePasswordResetToken('test@example.com')

    expect(result).toEqual(createdToken)
  })
})

// ============================================================================
// generateVerificationToken Tests
// ============================================================================

describe('generateVerificationToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a UUID token', async () => {
    mockedGetVerificationTokenByEmail.mockResolvedValue(null)
    mockedDb.verificationToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    await generateVerificationToken('test@example.com')

    expect(mockedDb.verificationToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'test@example.com',
        token: 'mock-uuid-token',
      }),
    })
  })

  it('should set expiration to 24 hours from now', async () => {
    mockedGetVerificationTokenByEmail.mockResolvedValue(null)
    mockedDb.verificationToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    const beforeCall = new Date()
    await generateVerificationToken('test@example.com')
    const afterCall = new Date()

    const createCall = mockedDb.verificationToken.create.mock.calls[0][0]
    const expiresDate = createCall.data.expires as Date

    // Token should expire ~24 hours from now
    const expectedExpiry = 24 * 3600 * 1000
    expect(expiresDate.getTime()).toBeGreaterThanOrEqual(
      beforeCall.getTime() + expectedExpiry - 1000
    )
    expect(expiresDate.getTime()).toBeLessThanOrEqual(
      afterCall.getTime() + expectedExpiry + 1000
    )
  })

  it('should delete existing token before creating new one', async () => {
    const existingToken = {
      id: 'existing-token-id',
      email: 'test@example.com',
      token: 'old-uuid-token',
      expires: new Date(),
    }
    mockedGetVerificationTokenByEmail.mockResolvedValue(existingToken)
    mockedDb.verificationToken.create.mockResolvedValue({
      id: 'new-token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    await generateVerificationToken('test@example.com')

    expect(mockedDb.verificationToken.delete).toHaveBeenCalledWith({
      where: { id: 'existing-token-id' },
    })
  })

  it('should return the created token', async () => {
    const createdToken = {
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    }
    mockedGetVerificationTokenByEmail.mockResolvedValue(null)
    mockedDb.verificationToken.create.mockResolvedValue(createdToken)

    const result = await generateVerificationToken('test@example.com')

    expect(result).toEqual(createdToken)
  })
})

// ============================================================================
// Token Expiry Tests
// ============================================================================

describe('Token Expiry Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('2FA token expires in 5 minutes', async () => {
    mockedGetTwoFactorTokenByEmail.mockResolvedValue(null)
    mockedDb.twoFactorToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: '123456',
      expires: new Date(),
    })

    const now = Date.now()
    await generateTwoFactorToken('test@example.com')

    const createCall = mockedDb.twoFactorToken.create.mock.calls[0][0]
    const expiresDate = createCall.data.expires as Date
    const fiveMinutes = 5 * 60 * 1000

    // Should be approximately 5 minutes
    expect(expiresDate.getTime() - now).toBeGreaterThan(fiveMinutes - 1000)
    expect(expiresDate.getTime() - now).toBeLessThan(fiveMinutes + 1000)
  })

  it('Password reset token expires in 1 hour', async () => {
    mockedGetPasswordResetTokenByEmail.mockResolvedValue(null)
    mockedDb.passwordResetToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    const now = Date.now()
    await generatePasswordResetToken('test@example.com')

    const createCall = mockedDb.passwordResetToken.create.mock.calls[0][0]
    const expiresDate = createCall.data.expires as Date
    const oneHour = 3600 * 1000

    expect(expiresDate.getTime() - now).toBeGreaterThan(oneHour - 1000)
    expect(expiresDate.getTime() - now).toBeLessThan(oneHour + 1000)
  })

  it('Verification token expires in 24 hours', async () => {
    mockedGetVerificationTokenByEmail.mockResolvedValue(null)
    mockedDb.verificationToken.create.mockResolvedValue({
      id: 'token-id',
      email: 'test@example.com',
      token: 'mock-uuid-token',
      expires: new Date(),
    })

    const now = Date.now()
    await generateVerificationToken('test@example.com')

    const createCall = mockedDb.verificationToken.create.mock.calls[0][0]
    const expiresDate = createCall.data.expires as Date
    const twentyFourHours = 24 * 3600 * 1000

    expect(expiresDate.getTime() - now).toBeGreaterThan(twentyFourHours - 1000)
    expect(expiresDate.getTime() - now).toBeLessThan(twentyFourHours + 1000)
  })
})
