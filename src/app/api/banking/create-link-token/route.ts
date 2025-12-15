/**
 * Banking Link Token API - Plaid Link Initialization
 *
 * Creates a link token for initiating Plaid Link modal.
 *
 * PLAID LINK FLOW:
 * 1. Client calls this endpoint with userId
 * 2. Returns link_token for Plaid Link SDK
 * 3. User authenticates with bank in modal
 * 4. Public token returned to client
 * 5. Client exchanges via /exchange-token
 *
 * ENVIRONMENT CONFIG:
 * - PLAID_PRODUCTS: Comma-separated products (transactions,auth)
 * - PLAID_COUNTRY_CODES: Comma-separated codes (US,CA)
 *
 * WHY CLIENT_USER_ID:
 * - Links Plaid items to our user
 * - Required for webhook routing
 * - Enables per-user item management
 *
 * WHY NO AUTH CHECK:
 * - TODO: Should add session validation
 * - Currently trusts userId from body
 * - Security improvement needed
 *
 * GOTCHAS:
 * - Token expires in 30 minutes
 * - Products must match Plaid dashboard config
 * - CountryCode affects institution availability
 *
 * @see /components/platform/finance/banking/lib/plaid.ts
 */

import { NextResponse } from 'next/server'
import { plaidClient } from '@/components/platform/finance/banking/lib/plaid'
import { Products, CountryCode } from 'plaid'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    const tokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Banking App',
      products: (process.env.PLAID_PRODUCTS?.split(',') || ['transactions']) as Products[],
      country_codes: (process.env.PLAID_COUNTRY_CODES?.split(',') || ['US']) as CountryCode[],
      language: 'en',
    })

    return NextResponse.json({
      link_token: tokenResponse.data.link_token,
    })
  } catch (error) {
    console.error('Error creating link token:', error)
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    )
  }
}