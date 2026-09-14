// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

vi.mock("@/lib/db", () => ({
  db: { user: { update: vi.fn() } },
}))

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  invalidateAuthCache: vi.fn(),
  isAuthError: (r: unknown) => r instanceof NextResponse,
}))

function post() {
  return new NextRequest("http://localhost/api/mobile/auth/logout", {
    method: "POST",
    headers: { Authorization: "Bearer test" },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/mobile/auth/logout", () => {
  it("401 when unauthenticated, and revokes nothing", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    )
    const { POST } = await import("@/app/api/mobile/auth/logout/route")
    expect((await POST(post())).status).toBe(401)
    expect(db.user.update).not.toHaveBeenCalled()
  })

  it("bumps tokenVersion and drops the cached auth state", async () => {
    const auth = await import("@/app/api/mobile/lib/authenticate")
    vi.mocked(auth.authenticate).mockResolvedValue({
      userId: "user-1",
      email: "u@e.com",
      schoolId: "school-1",
      role: "STUDENT",
    })
    vi.mocked(db.user.update).mockResolvedValue({ id: "user-1" } as never)
    const { POST } = await import("@/app/api/mobile/auth/logout/route")
    const res = await POST(post())
    expect(res.status).toBe(200)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tokenVersion: { increment: 1 } },
      select: { id: true },
    })
    expect(auth.invalidateAuthCache).toHaveBeenCalledWith("user-1")
  })
})
