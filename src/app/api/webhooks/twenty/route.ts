// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Twenty CRM inbound webhook — the conversion funnel's one door from the board.
 *
 * WHAT IT DOES, AND DELIBERATELY DOES NOT DO
 *
 * It verifies the signature, parses the delivery, writes ONE row, and returns.
 * It does not update a Lead, advance a gate, or touch a School. Two reasons:
 *
 * 1. Twenty allows a webhook **5 seconds and offers no retries**. A handler
 *    that does its work inline turns a slow query into a permanently lost
 *    event, and the sender cannot distinguish "applied" from "dropped" — it
 *    sees a timeout either way. Storing first makes the receipt durable and
 *    lets the slow, retryable part happen elsewhere.
 *
 * 2. **hogwarts Postgres is the source of truth for gate state; Twenty is a
 *    mirrored Kanban.** A human dragging a card is advisory. Applying it
 *    straight back into the funnel would make Twenty a second writer, and two
 *    writers disagreeing about which gate a school is in is unrecoverable —
 *    there is no way to tell which one is right. So the drag is recorded for
 *    review, not obeyed.
 *
 * This shape is also a correction. mkan's receiver answered 200 for every
 * delivery while processing none of them, and looked healthy from both ends for
 * months. A durable row makes "received" and "applied" two separate, separately
 * observable facts, which is precisely what that failure lacked.
 *
 * Twenty SSRF-blocks private addresses, so this must be reachable at a public
 * HTTPS URL — a tunnel, not localhost, in development.
 */

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { parseTwentyEvent, verifyTwentySignature } from "@/lib/twenty-webhook"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  // The HMAC covers exact bytes, so read text and parse it ourselves.
  // `req.json()` would discard the only representation that can be verified.
  const rawBody = await req.text()

  const verdict = verifyTwentySignature({
    rawBody,
    signature: req.headers.get("x-twenty-webhook-signature"),
    timestamp: req.headers.get("x-twenty-webhook-timestamp"),
    secret: process.env.TWENTY_WEBHOOK_SECRET,
  })
  if (!verdict.ok) {
    // No secret configured is a deployment error, not a reason to accept. An
    // open endpoint here would let anyone write into the funnel's inbox.
    return NextResponse.json(
      { error: "unauthorized", reason: verdict.reason },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const evt = parseTwentyEvent(body)
  if (!evt) {
    // A body we cannot read is a 400. Answering 200 is exactly what let the
    // sibling receiver look healthy while understanding nothing.
    return NextResponse.json({ error: "unrecognized_payload" }, { status: 400 })
  }

  const eventDate = evt.eventDate ? new Date(evt.eventDate) : new Date()
  const recordId = String((evt.record as { id?: unknown })?.id ?? "")
  if (!recordId) {
    return NextResponse.json({ error: "missing_record_id" }, { status: 400 })
  }

  try {
    // Idempotent on (webhookId, eventDate, recordId). Twenty does not retry,
    // but a proxy replay or a manual re-send must not queue the same change
    // twice — the applier would act on it twice.
    const row = await db.twentyInboundEvent.upsert({
      where: {
        webhookId_eventDate_recordId: {
          webhookId: evt.webhookId ?? "unknown",
          eventDate,
          recordId,
        },
      },
      update: {},
      create: {
        webhookId: evt.webhookId ?? "unknown",
        eventName: evt.eventName,
        objectName: evt.object,
        recordId,
        eventDate,
        updatedFields: evt.updatedFields,
        payload: body as object,
        status: "pending",
      },
    })

    return NextResponse.json({ received: true, id: row.id, event: evt.eventName })
  } catch (error) {
    // Fail loudly. A 500 tells the operator something is wrong; a 200 here
    // would drop the event and report success, which is the bug this file was
    // written to avoid repeating.
    return NextResponse.json(
      { error: "store_failed", message: (error as Error).message },
      { status: 500 }
    )
  }
}
