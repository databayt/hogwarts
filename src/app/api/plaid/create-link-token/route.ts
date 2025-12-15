/**
 * Plaid Link Token API - Bank Connection Initialization
 *
 * Creates a one-time Link token to initialize Plaid Link UI.
 *
 * PLAID LINK FLOW:
 * 1. Client calls this endpoint to get link_token
 * 2. Client opens Plaid Link modal with token
 * 3. User authenticates with their bank
 * 4. Plaid returns public_token to client
 * 5. Client sends public_token to /exchange-public-token
 *
 * WHY LINK TOKEN (not direct auth):
 * - Plaid's secure authentication layer
 * - Handles OAuth with 12,000+ financial institutions
 * - Manages MFA, credentials, session timeout
 * - We never see user's bank credentials
 *
 * WHY client_user_id:
 * - Links Plaid items to our user
 * - Required for transaction webhooks
 * - Enables user-specific item management
 *
 * PRODUCTS:
 * - Transactions: Bank transaction history
 * - Can add: Auth (ACH), Balance, Identity
 *
 * ENVIRONMENT SWITCHING:
 * - PLAID_ENV=sandbox: Test with fake accounts
 * - PLAID_ENV=development: Real banks, test credentials
 * - PLAID_ENV=production: Live bank connections
 *
 * GOTCHAS:
 * - Token expires in 30 minutes
 * - One token per Link session
 * - CountryCode affects available institutions
 * - redirect_uri required for OAuth banks
 *
 * @see https://plaid.com/docs/link/
 */

import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments, CountryCode, Products } from 'plaid'
import { auth } from '@/auth'

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(configuration)

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: session.user.id,
      },
      client_name: process.env.PLAID_CLIENT_NAME || 'Banking App',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI,
    })

    return NextResponse.json({
      link_token: response.data.link_token,
    })
  } catch (error) {
    console.error('Error creating link token:', error)
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    )
  }
}