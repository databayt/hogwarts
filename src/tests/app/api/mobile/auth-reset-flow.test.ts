// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// verify-otp checks the code without consuming it; new-password consumes it.
// Deleting in verify-otp made the app's check → new-password flow always 401.

vi.mock("@/lib/db", () => ({
  db: {
    verificationToken: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    user: { update: vi.fn() },
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn().mockResolvedValue({ allowed: true }),
  createRateLimitResponse: vi.fn(),
  RATE_LIMITS: { AUTH: {} },
}))

vi.mock("@/components/auth/user", () => ({
  getUserByEmail: vi.fn().mockResolvedValue({ id: "user-1", email: "t@example.com" }),
}))

vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }))

const TOKEN = {
  id: "vt-1",
  email: "t@example.com",
  code: "123456",
  expires: new Date(Date.now() + 10 * 60_000),
}

function post(path: string, body: unknown) {
  return new NextRequest(`http://localhost/api/mobile/auth/${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

describe("mobile password reset flow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("verify-otp accepts a valid code and leaves it for new-password", async () => {
    vi.mocked(db.verificationToken.findFirst).mockResolvedValue(TOKEN as never)
    const { POST } = await import("@/app/api/mobile/auth/verify-otp/route")

    const res = await POST(post("verify-otp", { email: "T@example.com", otp: "123456" }))

    expect(res.status).toBe(200)
    expect(db.verificationToken.delete).not.toHaveBeenCalled()
  })

  it("verify-otp rejects a wrong code", async () => {
    vi.mocked(db.verificationToken.findFirst).mockResolvedValue(null)
    const { POST } = await import("@/app/api/mobile/auth/verify-otp/route")

    const res = await POST(post("verify-otp", { email: "t@example.com", otp: "000000" }))

    expect(res.status).toBe(401)
  })

  it("verify-otp deletes an expired code", async () => {
    vi.mocked(db.verificationToken.findFirst).mockResolvedValue({
      ...TOKEN,
      expires: new Date(Date.now() - 1000),
    } as never)
    const { POST } = await import("@/app/api/mobile/auth/verify-otp/route")

    const res = await POST(post("verify-otp", { email: "t@example.com", otp: "123456" }))

    expect(res.status).toBe(401)
    expect(db.verificationToken.delete).toHaveBeenCalledWith({ where: { id: "vt-1" } })
  })

  it("verify-otp is rate limited", async () => {
    const rl = await import("@/lib/rate-limit")
    vi.mocked(rl.checkRateLimitAsync).mockResolvedValueOnce({ allowed: false, resetTime: 1 } as never)
    vi.mocked(rl.createRateLimitResponse).mockReturnValueOnce(new Response(null, { status: 429 }) as never)
    const { POST } = await import("@/app/api/mobile/auth/verify-otp/route")

    const res = await POST(post("verify-otp", { email: "t@example.com", otp: "123456" }))

    expect(res.status).toBe(429)
    expect(db.verificationToken.findFirst).not.toHaveBeenCalled()
  })

  it("the same code then sets the new password and is consumed", async () => {
    vi.mocked(db.verificationToken.findFirst).mockResolvedValue(TOKEN as never)
    const verify = await import("@/app/api/mobile/auth/verify-otp/route")
    const reset = await import("@/app/api/mobile/auth/new-password/route")

    expect((await verify.POST(post("verify-otp", { email: "t@example.com", otp: "123456" }))).status).toBe(200)
    const res = await reset.POST(
      post("new-password", { email: "t@example.com", otp: "123456", new_password: "secret1" })
    )

    expect(res.status).toBe(200)
    expect(db.user.update).toHaveBeenCalled()
    expect(db.verificationToken.delete).toHaveBeenCalledTimes(1)
  })
})
