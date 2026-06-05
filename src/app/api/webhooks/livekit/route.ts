// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse, type NextRequest } from "next/server"

import { handleWebhookEvent, verifyWebhook } from "@/lib/livekit/webhook"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const auth = req.headers.get("authorization")

  let event
  try {
    event = await verifyWebhook(body, auth)
  } catch (err) {
    console.warn("[livekit webhook] signature verification failed", {
      err: err instanceof Error ? err.message : String(err),
    })
    return new NextResponse("unauthorized", { status: 401 })
  }

  try {
    const processed = await handleWebhookEvent(event)
    return NextResponse.json({ ok: true, processed })
  } catch (err) {
    console.error("[livekit webhook] handler error", {
      event: event.event,
      err: err instanceof Error ? err.message : String(err),
    })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
