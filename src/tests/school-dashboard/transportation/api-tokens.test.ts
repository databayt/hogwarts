// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { generateApiToken } from "@/lib/api-tokens"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  createApiToken,
  listApiTokens,
  revokeApiToken,
} from "@/components/school-dashboard/transportation/actions/api-tokens"

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  db: {
    schoolApiToken: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// Mock the bcrypt-backed generator so we can deterministically assert that the
// action persists hash + prefix (never plaintext) and returns plaintext once.
vi.mock("@/lib/api-tokens", () => ({
  generateApiToken: vi.fn(),
}))

const SCHOOL_A = "school-A"
const SCHOOL_B = "school-B"
const GEOFENCE_SCOPE = "transportation.geofence_boarding"

function mockUser(
  role: string,
  schoolId: string | null = SCHOOL_A,
  userId = "user-1"
) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId, role } } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role,
    isPlatformAdmin: role === "DEVELOPER",
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ----------------------------------------------------------------------------
// listApiTokens
// ----------------------------------------------------------------------------
describe("listApiTokens", () => {
  it("scopes findMany by schoolId + deletedAt:null and selects only safe columns (no hash/plaintext)", async () => {
    mockUser("ADMIN", SCHOOL_A)
    const rows = [
      {
        id: "tok-1",
        name: "Webhook",
        tokenPrefix: "abcd1234",
        scopes: [GEOFENCE_SCOPE],
        createdAt: new Date("2026-01-01"),
        lastUsedAt: null,
      },
    ]
    vi.mocked(db.schoolApiToken.findMany).mockResolvedValue(rows as never)

    const result = await listApiTokens()

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(rows)

    expect(db.schoolApiToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: SCHOOL_A, deletedAt: null },
        orderBy: { createdAt: "desc" },
      })
    )

    // The select must NOT expose the secret hash; only safe display fields.
    const call = vi.mocked(db.schoolApiToken.findMany).mock.calls[0][0]
    expect(call.select).toEqual({
      id: true,
      name: true,
      tokenPrefix: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
    })
    expect(call.select).not.toHaveProperty("tokenHash")
  })

  it("never queries another school's tokens", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.schoolApiToken.findMany).mockResolvedValue([] as never)

    await listApiTokens()

    expect(db.schoolApiToken.findMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_B }),
      })
    )
  })

  it("returns UNAUTHORIZED for STAFF (manage_settings gate) and does not query", async () => {
    mockUser("STAFF", SCHOOL_A)

    const result = await listApiTokens()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.schoolApiToken.findMany).not.toHaveBeenCalled()
  })

  it("returns LOAD_FAILED when the query throws", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.schoolApiToken.findMany).mockRejectedValue(
      new Error("db down")
    )

    const result = await listApiTokens()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("LOAD_FAILED")
  })
})

// ----------------------------------------------------------------------------
// createApiToken
// ----------------------------------------------------------------------------
describe("createApiToken", () => {
  it("persists ONLY tokenHash + tokenPrefix (never plaintext) and returns plaintext exactly once", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(generateApiToken).mockResolvedValue({
      plaintext: "abcd1234.deadbeefsecret",
      tokenPrefix: "abcd1234",
      tokenHash: "$2a$10$hashedvalue",
    } as never)
    vi.mocked(db.schoolApiToken.create).mockResolvedValue({
      id: "tok-new",
      name: "Geofence",
    } as never)

    const result = await createApiToken({ name: "Geofence" })

    expect(result.success).toBe(true)
    if (result.success) {
      // plaintext is surfaced to the caller exactly once.
      expect(result.data.plaintext).toBe("abcd1234.deadbeefsecret")
      expect(result.data).toEqual({
        id: "tok-new",
        name: "Geofence",
        plaintext: "abcd1234.deadbeefsecret",
      })
    }

    expect(db.schoolApiToken.create).toHaveBeenCalledTimes(1)
    const createArg = vi.mocked(db.schoolApiToken.create).mock.calls[0][0]
    expect(createArg.data).toEqual({
      schoolId: SCHOOL_A,
      name: "Geofence",
      tokenHash: "$2a$10$hashedvalue",
      tokenPrefix: "abcd1234",
      scopes: [GEOFENCE_SCOPE],
    })
    // Critically: the plaintext secret must NOT be written to the DB.
    expect(createArg.data).not.toHaveProperty("plaintext")
    expect(JSON.stringify(createArg.data)).not.toContain(
      "abcd1234.deadbeefsecret"
    )
  })

  it("scopes the created token to the tenant schoolId", async () => {
    mockUser("DEVELOPER", SCHOOL_A)
    vi.mocked(generateApiToken).mockResolvedValue({
      plaintext: "p.t",
      tokenPrefix: "prefix01",
      tokenHash: "hash",
    } as never)
    vi.mocked(db.schoolApiToken.create).mockResolvedValue({
      id: "tok-x",
      name: "T",
    } as never)

    await createApiToken({ name: "T" })

    expect(db.schoolApiToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ schoolId: SCHOOL_A }),
        select: { id: true, name: true },
      })
    )
  })

  it("returns UNAUTHORIZED for TEACHER and neither generates nor persists a token", async () => {
    mockUser("TEACHER", SCHOOL_A)

    const result = await createApiToken({ name: "Hack" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(generateApiToken).not.toHaveBeenCalled()
    expect(db.schoolApiToken.create).not.toHaveBeenCalled()
  })

  it("returns VALIDATION_ERROR for an empty name and does not persist", async () => {
    mockUser("ADMIN", SCHOOL_A)

    const result = await createApiToken({ name: "" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    expect(generateApiToken).not.toHaveBeenCalled()
    expect(db.schoolApiToken.create).not.toHaveBeenCalled()
  })

  it("returns API_TOKEN_CREATE_FAILED when the create throws", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(generateApiToken).mockResolvedValue({
      plaintext: "p.t",
      tokenPrefix: "prefix01",
      tokenHash: "hash",
    } as never)
    vi.mocked(db.schoolApiToken.create).mockRejectedValue(
      new Error("unique violation")
    )

    const result = await createApiToken({ name: "Geofence" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("API_TOKEN_CREATE_FAILED")
  })
})

// ----------------------------------------------------------------------------
// revokeApiToken
// ----------------------------------------------------------------------------
describe("revokeApiToken", () => {
  it("soft-deletes via a single updateMany scoped by id + schoolId + deletedAt:null", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.schoolApiToken.updateMany).mockResolvedValue({
      count: 1,
    } as never)

    const result = await revokeApiToken("tok-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "tok-1" })

    // schoolId lives IN the write predicate (no separate findFirst-then-update),
    // so the soft-delete can never touch another school's token.
    const arg = vi.mocked(db.schoolApiToken.updateMany).mock.calls[0][0]
    expect(arg.where).toEqual({
      id: "tok-1",
      schoolId: SCHOOL_A,
      deletedAt: null,
    })
    expect((arg.data as { deletedAt: Date }).deletedAt).toBeInstanceOf(Date)
    expect(db.schoolApiToken.findFirst).not.toHaveBeenCalled()
  })

  it("is idempotent: returns success even when the token is already gone (updateMany count 0)", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.schoolApiToken.updateMany).mockResolvedValue({
      count: 0,
    } as never)

    const result = await revokeApiToken("missing-or-other-tenant")

    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toEqual({ id: "missing-or-other-tenant" })
  })

  it("cannot revoke a token from another tenant (schoolId in the write predicate → 0 rows touched)", async () => {
    mockUser("ADMIN", SCHOOL_A)
    // Token belongs to SCHOOL_B → the schoolId-scoped updateMany matches nothing.
    vi.mocked(db.schoolApiToken.updateMany).mockResolvedValue({
      count: 0,
    } as never)

    const result = await revokeApiToken("tok-of-B")

    expect(result.success).toBe(true)
    expect(db.schoolApiToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_A }),
      })
    )
  })

  it("returns UNAUTHORIZED for STAFF (manage_settings gate) and does not touch the db", async () => {
    mockUser("STAFF", SCHOOL_A)

    const result = await revokeApiToken("tok-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.schoolApiToken.updateMany).not.toHaveBeenCalled()
  })

  it("returns API_TOKEN_REVOKE_FAILED when the soft-delete write throws", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.schoolApiToken.updateMany).mockRejectedValue(
      new Error("db error")
    )

    const result = await revokeApiToken("tok-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("API_TOKEN_REVOKE_FAILED")
  })

  it("returns NOT_AUTHENTICATED when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_A,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    } as never)

    const result = await revokeApiToken("tok-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
    expect(db.schoolApiToken.updateMany).not.toHaveBeenCalled()
  })
})
