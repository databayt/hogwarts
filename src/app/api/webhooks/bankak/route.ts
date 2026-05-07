// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Bankak (Bank of Khartoum) webhook — scaffold.
 *
 * **Status: stub.** Until the BoK merchant spec lands we don't know:
 *   - The body shape Bankak sends (charge object? notification envelope?)
 *   - The signature header name and HMAC recipe
 *   - The status enum values that mean "captured"
 *
 * The route accepts POST and returns 200 so an early integration can ping it
 * without erroring, while logging the body for spec discovery. When the spec
 * is in hand, replace this with the same shape as the Tap webhook
 * (`src/app/api/webhooks/tap/route.ts`):
 *   1. Verify signature
 *   2. Insert ProcessedWebhookEvent for dedupe
 *   3. Route on status; on success → create Payment + post to ledger +
 *      dispatch fee_paid notification.
 */
export async function POST(req: Request) {
  const body = await req.text()
  console.warn(
    "[Bankak webhook] Received event — handler not yet implemented. Body:",
    body.slice(0, 500)
  )
  return new Response(null, { status: 200 })
}
