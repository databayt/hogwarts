// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

const { completeSocialLogin } = vi.hoisted(() => ({
  completeSocialLogin: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    account: { findFirst: vi.fn(), create: vi.fn() },
  },
}))
vi.mock("@/app/api/mobile/auth/social-school", () => ({ completeSocialLogin }))

function post(body: unknown) {
  return new NextRequest("http://localhost/api/mobile/auth/google", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        email: "Parent@Example.com",
        email_verified: "true",
        name: "Parent",
        sub: "g-1",
        aud: process.env.GOOGLE_CLIENT_ID ?? "any",
      }),
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("POST /api/mobile/auth/google", () => {
  it("hands the verified identity and school_id to completeSocialLogin", async () => {
    const platform = {
      id: "p1",
      email: "parent@example.com",
      schoolId: null,
      role: "USER",
      username: "Parent",
      image: null,
      isSuspended: false,
    }
    vi.mocked(db.user.findFirst).mockResolvedValue(platform as never)
    vi.mocked(db.account.findFirst).mockResolvedValue({ id: "a1" } as never)
    completeSocialLogin.mockResolvedValue(
      new Response(JSON.stringify({ needs_school: true, schools: [] }))
    )

    const { POST } = await import("@/app/api/mobile/auth/google/route")
    const res = await POST(post({ id_token: "tok", school_id: "s1" }))

    expect(completeSocialLogin).toHaveBeenCalledWith(platform, "s1")
    expect(await res.json()).toEqual({ needs_school: true, schools: [] })
  })

  it("still validates the body (400 without id_token)", async () => {
    const { POST } = await import("@/app/api/mobile/auth/google/route")
    expect((await POST(post({ school_id: "s1" }))).status).toBe(400)
    expect(completeSocialLogin).not.toHaveBeenCalled()
  })
})
