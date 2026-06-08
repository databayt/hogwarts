// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  handleWebhookEvent,
  verifyWebhook,
} from "@/components/school-dashboard/conference/livekit/webhook"
import { POST } from "@/app/api/webhooks/livekit/route"

vi.mock("@/components/school-dashboard/conference/livekit/webhook", () => ({
  verifyWebhook: vi.fn(),
  handleWebhookEvent: vi.fn(),
}))

function req(auth: string | null = "Bearer sig") {
  return new Request("http://localhost/api/webhooks/livekit", {
    method: "POST",
    body: "{}",
    headers: auth ? { authorization: auth } : {},
  }) as never
}

beforeEach(() => vi.clearAllMocks())

describe("livekit webhook route", () => {
  it("returns 401 when signature verification fails", async () => {
    vi.mocked(verifyWebhook).mockRejectedValue(new Error("bad sig"))
    const res = await POST(req())
    expect(res.status).toBe(401)
    expect(handleWebhookEvent).not.toHaveBeenCalled()
  })

  it("processes a verified event → { ok: true, processed }", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      event: "room_started",
    } as never)
    vi.mocked(handleWebhookEvent).mockResolvedValue(true as never)
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, processed: true })
  })

  it("returns 500 when the handler throws", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      event: "egress_ended",
    } as never)
    vi.mocked(handleWebhookEvent).mockRejectedValue(new Error("db down"))
    const res = await POST(req())
    expect(res.status).toBe(500)
  })
})
