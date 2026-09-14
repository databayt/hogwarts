// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resolveVideoAccess } from "@/components/lumos/video/media-access"
import { GET } from "@/app/api/lumos/video/[videoId]/route"

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "student-1", role: "STUDENT" } })),
}))
vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn(async () => ({ allowed: true })),
  RATE_LIMITS: { LUMOS_MEDIA: {} },
}))
vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(async () => ({ schoolId: "school-1" })),
}))
vi.mock("@/lib/s3", () => ({
  SIGNED_READ_TTL_SECONDS: 7200,
  getSignedReadUrl: vi.fn(async () => "https://bucket.s3.amazonaws.com/x?sig"),
}))
vi.mock("@/components/lumos/video/media-access", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  resolveVideoAccess: vi.fn(async () => ({
    ok: true,
    storageKey: "stream/school-1/video/x.mp4",
    title: "x",
  })),
}))

function call(dest?: string) {
  const headers = new Headers()
  if (dest) headers.set("sec-fetch-dest", dest)
  const req = new NextRequest("http://demo.localhost:3000/api/lumos/video/v-1", {
    headers,
  })
  return GET(req, { params: Promise.resolve({ videoId: "v-1" }) })
}

beforeEach(() => vi.clearAllMocks())

// The shared `NextResponse.redirect` mock cannot take a headers init, so the
// allowed cases prove the request got PAST the guard to authorization: the
// gate answers 402, which only the authorization step can produce.
beforeEach(() => {
  vi.mocked(resolveVideoAccess).mockResolvedValue({
    ok: false,
    reason: "payment-required",
  })
})

describe("GET /api/lumos/video/[videoId] — fetch destination", () => {
  it.each(["video", "audio"])("authorizes a %s element", async (dest) => {
    const res = await call(dest)
    expect(res.status).toBe(402)
    expect(resolveVideoAccess).toHaveBeenCalledTimes(1)
  })

  it("authorizes a client that sends no fetch metadata (native players)", async () => {
    const res = await call()
    expect(res.status).toBe(402)
    expect(resolveVideoAccess).toHaveBeenCalledTimes(1)
  })

  it.each(["document", "iframe", "empty", "embed", "object"])(
    "refuses %s before authorizing — a tab is the bare, downloadable player",
    async (dest) => {
      const res = await call(dest)
      expect(res.status).toBe(403)
      expect(res.headers.get("location")).toBeNull()
      expect(resolveVideoAccess).not.toHaveBeenCalled()
    }
  )
})
