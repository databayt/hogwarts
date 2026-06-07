// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { renderPendingCertificatePDFs } from "@/components/school-dashboard/grades/actions/certificate-pdf"

import { GET } from "@/app/api/cron/process-certificate-pdfs/route"

vi.mock("@/components/school-dashboard/grades/actions/certificate-pdf", () => ({
  renderPendingCertificatePDFs: vi.fn(),
}))

const SECRET = "cron-secret-test"

function req(authHeader?: string) {
  return new Request("http://localhost/api/cron/process-certificate-pdfs", {
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

describe("GET /api/cron/process-certificate-pdfs", () => {
  it("401s without the cron bearer secret", async () => {
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(renderPendingCertificatePDFs).not.toHaveBeenCalled()
  })

  it("401s with a wrong secret", async () => {
    const res = await GET(req("Bearer nope"))
    expect(res.status).toBe(401)
  })

  it("runs the render worker and returns its stats when authorized", async () => {
    vi.mocked(renderPendingCertificatePDFs).mockResolvedValue({
      processed: 3,
      generated: 2,
      failed: 1,
    })
    const res = await GET(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      success: true,
      processed: 3,
      generated: 2,
      failed: 1,
    })
    expect(renderPendingCertificatePDFs).toHaveBeenCalledWith({ limit: 25 })
  })

  it("500s when the worker throws", async () => {
    vi.mocked(renderPendingCertificatePDFs).mockRejectedValue(
      new Error("boom")
    )
    const res = await GET(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(500)
  })
})
