/**
 * Banking Token Exchange API - Plaid Token Swap
 *
 * Exchanges temporary public_token for permanent access_token.
 *
 * SECURITY WARNING:
 * - Currently returns access_token to client (NOT RECOMMENDED)
 * - Production: Store server-side, never expose to client
 * - TODO: Save to database and return success only
 *
 * TOKEN TYPES:
 * - public_token: Short-lived, from Plaid Link
 * - access_token: Long-lived, for API calls
 *
 * WHAT SHOULD HAPPEN (TODO):
 * 1. Exchange tokens via Plaid
 * 2. Store access_token in encrypted database column
 * 3. Return item_id only (not access_token)
 * 4. Use stored token for future API calls
 *
 * WHY ITEM_ID:
 * - Identifies the bank connection
 * - Used for webhooks and sync
 * - Safe to expose to client
 *
 * @see /api/plaid/exchange-public-token for production version
 */

import { NextResponse } from "next/server"

import { plaidClient } from "@/components/school-dashboard/finance/banking/lib/plaid"

export async function POST(request: Request) {
  try {
    const { publicToken, userId } = await request.json()

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const { access_token, item_id } = exchangeResponse.data

    // Here you would normally save the access token securely
    // For now, we're returning it to the client (not recommended in production)

    return NextResponse.json({
      access_token,
      item_id,
    })
  } catch (error) {
    console.error("Error exchanging public token:", error)
    return NextResponse.json(
      { error: "Failed to exchange public token" },
      { status: 500 }
    )
  }
}
