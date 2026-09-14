// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { NextRequest } from "next/server"
import { decodeJwt, SignJWT } from "jose"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// jwt.ts refuses to load without a secret.
vi.hoisted(() => {
  process.env.AUTH_SECRET = "test-auth-secret-for-mobile-jwt"
})

vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    student: { findUnique: vi.fn() },
  },
}))
vi.mock("@/components/auth/user", () => ({ getUserByIdentifier: vi.fn() }))

const USER = "user-1"

function user(tokenVersion: number, extra: Record<string, unknown> = {}) {
  return {
    id: USER,
    email: "u@e.com",
    schoolId: "school-1",
    role: "TEACHER",
    username: "Test User",
    image: null,
    isSuspended: false,
    tokenVersion,
    ...extra,
  }
}

function refresh(token: string) {
  return new NextRequest("http://localhost/api/mobile/auth", {
    method: "PUT",
    headers: { "X-Refresh-Token": token },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("mobile JWTs carry the tv claim", () => {
  it("access and refresh tokens both carry the user's tokenVersion", async () => {
    const { buildAuthResponse } = await import("@/app/api/mobile/auth/jwt")
    const res = await buildAuthResponse(user(3))
    expect(decodeJwt(res.access_token).tv).toBe(3)
    expect(decodeJwt(res.refresh_token).tv).toBe(3)
  })

  it("defaults tv to 0 when the caller has no tokenVersion", async () => {
    const { buildAuthResponse } = await import("@/app/api/mobile/auth/jwt")
    const { tokenVersion: _tv, ...legacy } = user(0)
    const res = await buildAuthResponse(legacy)
    expect(decodeJwt(res.access_token).tv).toBe(0)
  })
})

describe("PUT /api/mobile/auth (refresh)", () => {
  it("mints new tokens when tv matches", async () => {
    const { generateRefreshToken } = await import("@/app/api/mobile/auth/jwt")
    vi.mocked(db.user.findUnique).mockResolvedValue(user(2) as never)
    const { PUT } = await import("@/app/api/mobile/auth/route")
    const res = await PUT(refresh(await generateRefreshToken(USER, 2)))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(decodeJwt(body.access_token).tv).toBe(2)
  })

  it("401 when the refresh token's tv is stale (user logged out)", async () => {
    const { generateRefreshToken } = await import("@/app/api/mobile/auth/jwt")
    vi.mocked(db.user.findUnique).mockResolvedValue(user(3) as never)
    const { PUT } = await import("@/app/api/mobile/auth/route")
    const res = await PUT(refresh(await generateRefreshToken(USER, 2)))
    expect(res.status).toBe(401)
  })

  it("treats a legacy refresh token without tv as version 0", async () => {
    const { JWT_SECRET } = await import("@/app/api/mobile/auth/jwt")
    const legacy = await new SignJWT({ sub: USER, type: "refresh" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET)
    const { PUT } = await import("@/app/api/mobile/auth/route")

    vi.mocked(db.user.findUnique).mockResolvedValue(user(0) as never)
    expect((await PUT(refresh(legacy))).status).toBe(200)

    vi.mocked(db.user.findUnique).mockResolvedValue(user(1) as never)
    expect((await PUT(refresh(legacy))).status).toBe(401)
  })

  it("403 for a suspended user", async () => {
    const { generateRefreshToken } = await import("@/app/api/mobile/auth/jwt")
    vi.mocked(db.user.findUnique).mockResolvedValue(
      user(0, { isSuspended: true }) as never
    )
    const { PUT } = await import("@/app/api/mobile/auth/route")
    const res = await PUT(refresh(await generateRefreshToken(USER, 0)))
    expect(res.status).toBe(403)
  })

  it("401 when an access token is sent as the refresh token", async () => {
    const { generateAccessToken } = await import("@/app/api/mobile/auth/jwt")
    const access = await generateAccessToken({
      id: USER,
      email: "u@e.com",
      schoolId: "school-1",
      role: "TEACHER",
    })
    const { PUT } = await import("@/app/api/mobile/auth/route")
    expect((await PUT(refresh(access))).status).toBe(401)
  })
})
