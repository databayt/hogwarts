import { NextResponse } from 'next/server'
import { plaidClient } from '@/components/platform/banking/lib/plaid'
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