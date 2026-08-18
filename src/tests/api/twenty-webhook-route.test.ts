// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for the Twenty inbound webhook receiver.
 *
 * These exist because the sibling receiver in mkan answered HTTP 200 for every
 * delivery while processing none of them, for months, with both ends reporting
 * success. The assertions that matter here are therefore not "does it return
 * 200" but "does a row actually land", "is a body it cannot read refused rather
 * than accepted", and "does an unsigned request get nowhere near the database".
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { POST } from "@/app/api/webhooks/twenty/route"

vi.mock("@/lib/db", () => ({
  db: { twentyInboundEvent: { upsert: vi.fn() } },
}))

const anyDb = db as unknown as {
  twentyInboundEvent: { upsert: ReturnType<typeof vi.fn> }
}

const SECRET = "route-test-secret"

async function post(
  body: string,
  opts: { sign?: boolean; secret?: string | undefined } = {}
) {
  process.env.TWENTY_WEBHOOK_SECRET =
    opts.secret === undefined ? SECRET : opts.secret
  const { createHmac } = await import("node:crypto")
  const ts = String(Date.now())
  let sig = createHmac("sha256", SECRET).update(`${ts}:${body}`).digest("hex")
  if (opts.sign === false) sig = sig.slice(0, -1) + (sig.endsWith("0") ? "1" : "0")
  const res = await POST(
    new Request("https://ed.databayt.org/api/webhooks/twenty", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-twenty-webhook-timestamp": ts,
        "x-twenty-webhook-signature": sig,
      },
      body,
    })
  )
  return { status: res.status, json: await res.json() }
}

const stageMoved = JSON.stringify({
  eventName: "opportunity.updated",
  objectMetadata: { id: "o1", nameSingular: "opportunity" },
  workspaceId: "w1",
  webhookId: "wh1",
  eventDate: "2026-08-18T11:00:00.000Z",
  record: { id: "opp-1", stage: "DISCOVERY" },
  updatedFields: ["stage"],
})

beforeEach(() => {
  vi.clearAllMocks()
  anyDb.twentyInboundEvent.upsert.mockResolvedValue({ id: "evt-1" })
})

describe("POST /api/webhooks/twenty", () => {
  it("stores a verified delivery and says which event it was", async () => {
    const { status, json } = await post(stageMoved)
    expect(status).toBe(200)
    expect(json).toEqual({ received: true, id: "evt-1", event: "opportunity.updated" })

    const arg = anyDb.twentyInboundEvent.upsert.mock.calls[0][0]
    expect(arg.create.objectName).toBe("opportunity")
    expect(arg.create.recordId).toBe("opp-1")
    expect(arg.create.updatedFields).toEqual(["stage"])
    expect(arg.create.status).toBe("pending")
    // The whole delivery is kept, not just the fields parsed today.
    expect(arg.create.payload).toMatchObject({ record: { stage: "DISCOVERY" } })
  })

  it("is idempotent on (webhookId, eventDate, recordId)", async () => {
    await post(stageMoved)
    const arg = anyDb.twentyInboundEvent.upsert.mock.calls[0][0]
    expect(arg.where.webhookId_eventDate_recordId).toEqual({
      webhookId: "wh1",
      eventDate: new Date("2026-08-18T11:00:00.000Z"),
      recordId: "opp-1",
    })
    // An existing row is left alone — re-applying a change is the failure mode.
    expect(arg.update).toEqual({})
  })

  it("does NOT apply the change — Twenty is a mirror, not a writer", async () => {
    await post(stageMoved)
    // Only the inbox is written. No Lead, no School, no gate advance: a human
    // dragging a card is advisory, and two writers would be unrecoverable.
    expect(Object.keys(anyDb)).toEqual(["twentyInboundEvent"])
  })

  it("refuses an unsigned request before touching the database", async () => {
    const { status } = await post(stageMoved, { sign: false })
    expect(status).toBe(401)
    expect(anyDb.twentyInboundEvent.upsert).not.toHaveBeenCalled()
  })

  it("refuses everything when no secret is configured", async () => {
    const { status, json } = await post(stageMoved, { secret: "" })
    expect(status).toBe(401)
    expect(json.reason).toBe("no_secret_configured")
    expect(anyDb.twentyInboundEvent.upsert).not.toHaveBeenCalled()
  })

  it("THE SIBLING'S BUG: the old {event,object,action} shape is a 400, not a 200", async () => {
    const old = JSON.stringify({
      event: "opportunity.updated",
      object: "opportunity",
      action: "updated",
      record: { id: "opp-1" },
    })
    const { status, json } = await post(old)
    expect(status).toBe(400)
    expect(json.error).toBe("unrecognized_payload")
    expect(anyDb.twentyInboundEvent.upsert).not.toHaveBeenCalled()
  })

  it("reports a store failure as 500 rather than dropping the event silently", async () => {
    anyDb.twentyInboundEvent.upsert.mockRejectedValue(new Error("connection lost"))
    const { status, json } = await post(stageMoved)
    expect(status).toBe(500)
    expect(json.error).toBe("store_failed")
  })

  it("refuses a payload with no record id", async () => {
    const noId = JSON.stringify({
      eventName: "opportunity.updated",
      objectMetadata: { id: "o1", nameSingular: "opportunity" },
      webhookId: "wh1",
      record: { stage: "DEMO" },
    })
    const { status, json } = await post(noId)
    expect(status).toBe(400)
    expect(json.error).toBe("missing_record_id")
  })
})
