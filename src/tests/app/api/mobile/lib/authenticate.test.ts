// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { verifyToken } from "@/app/api/mobile/auth/jwt"
import {
  _resetAuthCache,
  authenticate,
  invalidateAuthCache,
} from "@/app/api/mobile/lib/authenticate"
import { hasRole } from "@/app/api/mobile/lib/roles"

vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: vi.fn() } },
}))

vi.mock("@/app/api/mobile/auth/jwt", () => ({ verifyToken: vi.fn() }))

const USER = "user-1"
const SCHOOL = "school-1"

function req(token?: string) {
  return new NextRequest("http://localhost/api/mobile/dashboard", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

function tokenWith(payload: Record<string, unknown>) {
  vi.mocked(verifyToken).mockResolvedValue({
    payload: {
      sub: USER,
      email: "u@e.com",
      schoolId: SCHOOL,
      role: "TEACHER",
      type: "access",
      ...payload,
    },
  } as never)
}

function userState(state: { isSuspended: boolean; tokenVersion: number }) {
  vi.mocked(db.user.findUnique).mockResolvedValue(state as never)
}

async function status(res: unknown) {
  expect(res).toBeInstanceOf(NextResponse)
  const r = res as NextResponse
  return { status: r.status, body: await r.json() }
}

beforeEach(() => {
  vi.clearAllMocks()
  _resetAuthCache()
})

describe("authenticate", () => {
  it("401 without a bearer token", async () => {
    expect((await status(await authenticate(req()))).status).toBe(401)
  })

  it("401 when the token does not verify", async () => {
    vi.mocked(verifyToken).mockRejectedValue(new Error("bad sig"))
    expect((await status(await authenticate(req("t")))).status).toBe(401)
  })

  it("401 for a refresh token used as an access token", async () => {
    tokenWith({ type: "refresh" })
    expect((await status(await authenticate(req("t")))).status).toBe(401)
  })

  it("400 when the token carries no school", async () => {
    tokenWith({ schoolId: null })
    expect((await status(await authenticate(req("t")))).status).toBe(400)
  })

  it("401 when the user no longer exists", async () => {
    tokenWith({ tv: 0 })
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    expect((await status(await authenticate(req("t")))).status).toBe(401)
  })

  it("403 {error:'suspended'} for a suspended user", async () => {
    tokenWith({ tv: 0 })
    userState({ isSuspended: true, tokenVersion: 0 })
    const res = await status(await authenticate(req("t")))
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: "suspended" })
  })

  it("401 when the token version is behind the user's (revoked)", async () => {
    tokenWith({ tv: 1 })
    userState({ isSuspended: false, tokenVersion: 2 })
    expect((await status(await authenticate(req("t")))).status).toBe(401)
  })

  it("accepts a legacy token without tv while tokenVersion is 0", async () => {
    tokenWith({})
    userState({ isSuspended: false, tokenVersion: 0 })
    expect(await authenticate(req("t"))).toEqual({
      userId: USER,
      email: "u@e.com",
      schoolId: SCHOOL,
      role: "TEACHER",
    })
  })

  it("rejects a legacy token without tv once the user logged out", async () => {
    tokenWith({})
    userState({ isSuspended: false, tokenVersion: 1 })
    expect((await status(await authenticate(req("t")))).status).toBe(401)
  })

  it("caches the user state for 60s, and invalidateAuthCache forces a re-read", async () => {
    tokenWith({ tv: 0 })
    userState({ isSuspended: false, tokenVersion: 0 })
    await authenticate(req("t"))
    await authenticate(req("t"))
    expect(db.user.findUnique).toHaveBeenCalledTimes(1)

    invalidateAuthCache(USER)
    userState({ isSuspended: false, tokenVersion: 1 })
    expect((await status(await authenticate(req("t")))).status).toBe(401)
    expect(db.user.findUnique).toHaveBeenCalledTimes(2)
  })

  it("re-reads after the cache TTL", async () => {
    vi.useFakeTimers()
    try {
      tokenWith({ tv: 0 })
      userState({ isSuspended: false, tokenVersion: 0 })
      await authenticate(req("t"))
      vi.advanceTimersByTime(61_000)
      userState({ isSuspended: true, tokenVersion: 0 })
      expect((await status(await authenticate(req("t")))).status).toBe(403)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("hasRole", () => {
  it("matches any of the listed Prisma roles", () => {
    expect(hasRole({ role: "DEVELOPER" }, "ADMIN", "DEVELOPER")).toBe(true)
    expect(hasRole({ role: "TEACHER" }, "ADMIN", "DEVELOPER")).toBe(false)
    expect(hasRole({ role: "SUPER_ADMIN" }, "ADMIN", "DEVELOPER")).toBe(false)
  })
})
