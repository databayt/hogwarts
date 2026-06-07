// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createHmac } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { POST } from "@/app/api/webhooks/adek/route"

vi.mock("@/lib/audit-log", () => ({ logAudit: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    processedWebhookEvent: { create: vi.fn() },
    complianceSubmission: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const SECRET = "test-webhook-secret"

function signedRequest(payload: object) {
  const body = JSON.stringify(payload)
  const sig = createHmac("sha256", SECRET).update(body, "utf8").digest("hex")
  return new Request("http://x", {
    method: "POST",
    headers: {
      "x-adek-signature": sig,
      "content-type": "application/json",
    },
    body,
  })
}

describe("POST /api/webhooks/adek", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ADEK_WEBHOOK_SECRET = SECRET
    process.env.NODE_ENV = "test"
    vi.mocked(db.processedWebhookEvent.create).mockResolvedValue({} as any)
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("rejects request with no signature", async () => {
    const body = JSON.stringify({ eventId: "e1" })
    const req = new Request("http://x", {
      method: "POST",
      body,
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("rejects request with wrong signature", async () => {
    const body = JSON.stringify({ eventId: "e1" })
    const req = new Request("http://x", {
      method: "POST",
      headers: { "x-adek-signature": "deadbeef".repeat(8) },
      body,
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("rejects malformed JSON body", async () => {
    const body = "{invalid json"
    const sig = createHmac("sha256", SECRET).update(body, "utf8").digest("hex")
    const req = new Request("http://x", {
      method: "POST",
      headers: { "x-adek-signature": sig },
      body,
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it("rejects missing eventId / submissionRef / type", async () => {
    const res = await POST(signedRequest({ foo: "bar" }))

    expect(res.status).toBe(400)
  })

  it("acks (200) on duplicate eventId (idempotency)", async () => {
    vi.mocked(db.processedWebhookEvent.create).mockRejectedValue({
      code: "P2002",
    })

    const res = await POST(
      signedRequest({
        eventId: "e1",
        type: "submission.accepted",
        submissionRef: "sub-1",
      })
    )

    expect(res.status).toBe(200)
    expect(db.complianceSubmission.update).not.toHaveBeenCalled()
  })

  it("fails closed (503) when the dedupe insert errors non-P2002 (WH-1)", async () => {
    // A transient DB failure on the idempotency insert must NOT fall through
    // and apply the event — otherwise ADEK's retry of the same eventId would
    // re-apply it (replay). Return 5xx so the regulator retries cleanly.
    vi.mocked(db.processedWebhookEvent.create).mockRejectedValue({
      code: "P1001", // connection error, not a unique-constraint hit
    })

    const res = await POST(
      signedRequest({
        eventId: "e-transient",
        type: "submission.accepted",
        submissionRef: "sub-1",
      })
    )

    expect(res.status).toBe(503)
    expect(db.complianceSubmission.update).not.toHaveBeenCalled()
  })

  it("acks unknown submissionRef (idempotent ack-anyway)", async () => {
    vi.mocked(db.complianceSubmission.findUnique).mockResolvedValue(null)

    const res = await POST(
      signedRequest({
        eventId: "e2",
        type: "submission.accepted",
        submissionRef: "unknown-sub",
      })
    )

    expect(res.status).toBe(200)
    expect(db.complianceSubmission.update).not.toHaveBeenCalled()
  })

  it("updates submission to ACCEPTED on submission.accepted event", async () => {
    vi.mocked(db.complianceSubmission.findUnique).mockResolvedValue({
      id: "sub-1",
      schoolId: "school-1",
      receiptId: null,
      errorCode: null,
      errorMessage: null,
    } as any)
    vi.mocked(db.complianceSubmission.update).mockResolvedValue({} as any)

    const res = await POST(
      signedRequest({
        eventId: "e3",
        type: "submission.accepted",
        submissionRef: "sub-1",
        receiptId: "RCPT-001",
      })
    )

    expect(res.status).toBe(200)
    expect(db.complianceSubmission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-1" },
        data: expect.objectContaining({
          status: "ACCEPTED",
          receiptId: "RCPT-001",
        }),
      })
    )
  })

  it("updates submission to REJECTED on submission.rejected event", async () => {
    vi.mocked(db.complianceSubmission.findUnique).mockResolvedValue({
      id: "sub-1",
      schoolId: "school-1",
      receiptId: null,
      errorCode: null,
      errorMessage: null,
    } as any)
    vi.mocked(db.complianceSubmission.update).mockResolvedValue({} as any)

    const res = await POST(
      signedRequest({
        eventId: "e4",
        type: "submission.rejected",
        submissionRef: "sub-1",
        errorCode: "INVALID_STUDENT",
      })
    )

    expect(res.status).toBe(200)
    expect(db.complianceSubmission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REJECTED",
          errorCode: "INVALID_STUDENT",
        }),
      })
    )
  })

  it("acks unknown event type without updating", async () => {
    vi.mocked(db.complianceSubmission.findUnique).mockResolvedValue({
      id: "sub-1",
      schoolId: "school-1",
    } as any)

    const res = await POST(
      signedRequest({
        eventId: "e5",
        type: "submission.unknown_type",
        submissionRef: "sub-1",
      })
    )

    expect(res.status).toBe(200)
    expect(db.complianceSubmission.update).not.toHaveBeenCalled()
  })
})
