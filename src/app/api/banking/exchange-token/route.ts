import { NextResponse } from 'next/server'
import { plaidClient } from '@/components/platform/finance/banking/lib/plaid'

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
    console.error('Error exchanging public token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange public token' },
      { status: 500 }
    )
  }
}