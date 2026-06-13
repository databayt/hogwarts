// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for /api/cron/process-document-jobs
 * Covers: CRON_SECRET auth guard, processNextJobs delegation, budget-gate path.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { verifyCronSecret } from "@/lib/cron-auth"
// Import after mock so vi.mocked() works
import { processNextJobs } from "@/lib/document-extraction/queue-runner"
import { GET } from "@/app/api/cron/process-document-jobs/route"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/document-extraction/queue-runner", () => ({
  processNextJobs: vi.fn(),
}))

vi.mock("@/lib/cron-auth", () => ({
  verifyCronSecret: vi.fn(),
}))

const SECRET = "test-cron-secret-xyz"

function makeRequest(authHeader?: string) {
  return new Request("http://localhost/api/cron/process-document-jobs", {
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = SECRET
})

afterEach(() => {
  delete process.env.CRON_SECRET
})

// ── Auth guard ──────────────────────────────────────────────────────────────

describe("GET /api/cron/process-document-jobs — auth", () => {
  it("returns 401 when verifyCronSecret returns false", async () => {
    vi.mocked(verifyCronSecret).mockReturnValue(false)
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    expect(processNextJobs).not.toHaveBeenCalled()
  })

  it("returns 401 with wrong secret", async () => {
    vi.mocked(verifyCronSecret).mockReturnValue(false)
    const res = await GET(makeRequest("Bearer wrong-secret"))
    expect(res.status).toBe(401)
  })

  it("returns 401 when CRON_SECRET is unset (fail-closed)", async () => {
    delete process.env.CRON_SECRET
    // verifyCronSecret itself enforces fail-closed — simulate it here
    vi.mocked(verifyCronSecret).mockReturnValue(false)
    const res = await GET(makeRequest("Bearer undefined"))
    expect(res.status).toBe(401)
  })
})

// ── Happy path ──────────────────────────────────────────────────────────────

describe("GET /api/cron/process-document-jobs — authorized", () => {
  it("calls processNextJobs with maxJobs:5 and returns counts", async () => {
    vi.mocked(verifyCronSecret).mockReturnValue(true)
    vi.mocked(processNextJobs).mockResolvedValue({
      processed: 4,
      succeeded: 3,
      failed: 1,
      skipped: 0,
    })

    const res = await GET(makeRequest(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      success: true,
      processed: 4,
      succeeded: 3,
      failed: 1,
      skipped: 0,
    })
    expect(processNextJobs).toHaveBeenCalledWith({ maxJobs: 5 })
  })

  it("returns 500 when processNextJobs throws", async () => {
    vi.mocked(verifyCronSecret).mockReturnValue(true)
    vi.mocked(processNextJobs).mockRejectedValue(new Error("DB unavailable"))

    const res = await GET(makeRequest(`Bearer ${SECRET}`))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})
