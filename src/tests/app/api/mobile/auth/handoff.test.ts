// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { handoffIdentifier, hashHandoffCode } from "@/lib/app-handoff"

const { tx, dbMock } = vi.hoisted(() => {
  const tx = {
    verificationToken: { findUnique: vi.fn(), deleteMany: vi.fn() },
  }
  return {
    tx,
    dbMock: {
      $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
      user: { findUnique: vi.fn() },
    },
  }
})

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/audit-log", () => ({ logLoginAttempt: vi.fn() }))
vi.mock("@/lib/activity", () => ({ touchActivity: vi.fn() }))
vi.mock("@/app/api/mobile/auth/jwt", () => ({
  buildAuthResponse: vi.fn(async (u: { id: string }) => ({
    access_token: "a",
    refresh_token: "r",
    expires_at: 1,
    user: { id: u.id },
  })),
}))

const CODE = "x".repeat(43)
const user = {
  id: "u1",
  email: "u@e.com",
  schoolId: "s1",
  role: "STUDENT",
  username: "u",
  image: null,
  isSuspended: false,
  tokenVersion: 0,
}

function post(body: unknown) {
  return new NextRequest("http://localhost/api/mobile/auth/handoff", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
const live = (over = {}) => ({
  email: handoffIdentifier("u1", "s1"),
  expires: new Date(Date.now() + 30_000),
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  tx.verificationToken.deleteMany.mockResolvedValue({ count: 1 })
  dbMock.user.findUnique.mockResolvedValue(user)
})

describe("POST /api/mobile/auth/handoff", () => {
  it("valid code returns the login response and is consumed", async () => {
    tx.verificationToken.findUnique.mockResolvedValue(live())
    const { POST } = await import("@/app/api/mobile/auth/handoff/route")
    const res = await POST(post({ code: CODE }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      access_token: "a",
      refresh_token: "r",
      expires_at: 1,
      user: { id: "u1" },
    })
    expect(tx.verificationToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { token: hashHandoffCode(CODE) } })
    )
  })

  it("400 on a bad body", async () => {
    const { POST } = await import("@/app/api/mobile/auth/handoff/route")
    expect((await POST(post({}))).status).toBe(400)
  })

  it("reused code (delete removes nothing) is 401", async () => {
    tx.verificationToken.findUnique.mockResolvedValue(live())
    tx.verificationToken.deleteMany.mockResolvedValue({ count: 0 })
    const { POST } = await import("@/app/api/mobile/auth/handoff/route")
    expect((await POST(post({ code: CODE }))).status).toBe(401)
    expect(dbMock.user.findUnique).not.toHaveBeenCalled()
  })

  it("unknown code is 401", async () => {
    tx.verificationToken.findUnique.mockResolvedValue(null)
    const { POST } = await import("@/app/api/mobile/auth/handoff/route")
    expect((await POST(post({ code: CODE }))).status).toBe(401)
  })

  it("expired code is 401", async () => {
    tx.verificationToken.findUnique.mockResolvedValue(
      live({ expires: new Date(Date.now() - 1000) })
    )
    const { POST } = await import("@/app/api/mobile/auth/handoff/route")
    expect((await POST(post({ code: CODE }))).status).toBe(401)
  })

  it("user moved to another school is 401", async () => {
    tx.verificationToken.findUnique.mockResolvedValue(live())
    dbMock.user.findUnique.mockResolvedValue({ ...user, schoolId: "s2" })
    const { POST } = await import("@/app/api/mobile/auth/handoff/route")
    expect((await POST(post({ code: CODE }))).status).toBe(401)
  })

  it("suspended user is 401", async () => {
    tx.verificationToken.findUnique.mockResolvedValue(live())
    dbMock.user.findUnique.mockResolvedValue({ ...user, isSuspended: true })
    const { POST } = await import("@/app/api/mobile/auth/handoff/route")
    expect((await POST(post({ code: CODE }))).status).toBe(401)
  })
})
