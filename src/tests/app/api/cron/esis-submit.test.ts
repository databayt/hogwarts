// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  enqueueDailySubmissions,
  maybeRecloseCircuitBreakers,
} from "@/lib/compliance/orchestrator"
import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"

import { GET } from "@/app/api/cron/esis-submit/route"

vi.mock("@/lib/compliance/orchestrator", () => ({
  enqueueDailySubmissions: vi.fn(),
  maybeRecloseCircuitBreakers: vi.fn(),
  processSubmission: vi.fn(),
}))
vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    complianceSubmission: { findMany: vi.fn() },
  },
}))
vi.mock("next/server", async () => {
  const real =
    await vi.importActual<typeof import("next/server")>("next/server")
  return {
    ...real,
    after: vi.fn((fn: () => Promise<void>) => fn()),
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) =>
        new Response(JSON.stringify(data), { status: init?.status ?? 200 }),
    },
  }
})

describe("GET /api/cron/esis-submit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(maybeRecloseCircuitBreakers).mockResolvedValue(undefined as any)
    vi.mocked(enqueueDailySubmissions).mockResolvedValue({
      queued: 0,
      skipped: 0,
    })
    vi.mocked(db.complianceSubmission.findMany).mockResolvedValue([])
  })

  it("returns 401 when not authorized", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(false)

    const res = await GET(new Request("http://x/api/cron/esis-submit"))

    expect(res.status).toBe(401)
  })

  it("returns 200 with queued/skipped counts on success", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)
    vi.mocked(enqueueDailySubmissions).mockResolvedValue({
      queued: 3,
      skipped: 1,
    })

    const res = await GET(new Request("http://x/api/cron/esis-submit"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.queued).toBe(3)
    expect(body.skipped).toBe(1)
  })

  it("calls maybeRecloseCircuitBreakers before enqueue", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)

    await GET(new Request("http://x/api/cron/esis-submit"))

    expect(maybeRecloseCircuitBreakers).toHaveBeenCalled()
    expect(enqueueDailySubmissions).toHaveBeenCalled()
  })

  it("returns 500 on internal failure", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)
    vi.mocked(enqueueDailySubmissions).mockRejectedValue(new Error("boom"))

    const res = await GET(new Request("http://x/api/cron/esis-submit"))

    expect(res.status).toBe(500)
  })

  it("passes route name to cron-auth", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(true)

    await GET(new Request("http://x/api/cron/esis-submit"))

    expect(isAuthorizedCron).toHaveBeenCalledWith(
      expect.any(Request),
      "esis-submit"
    )
  })
})
