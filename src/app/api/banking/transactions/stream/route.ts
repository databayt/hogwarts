import { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Runtime configuration - Node.js for database
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stream transaction updates using Server-Sent Events (SSE)
 * This allows real-time updates without WebSockets
 */
export async function GET(request: NextRequest) {
  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return new Response('Account ID required', { status: 400 })
  }

  // Create a TransformStream for SSE
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Import database utilities
  const { db } = await import('@/lib/db')

  // Start streaming
  const sendEvent = async (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`
    await writer.write(encoder.encode(message))
  }

  // Initial connection message
  await sendEvent({ type: 'connected', timestamp: new Date().toISOString() })

  // Set up polling for new transactions (in production, use database triggers or webhooks)
  let lastCheck = new Date()
  const interval = setInterval(async () => {
    try {
      // Check for new transactions
      const newTransactions = await db.transaction.findMany({
        where: {
          bankAccountId: accountId,
          createdAt: { gt: lastCheck }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      if (newTransactions.length > 0) {
        // Serialize Decimal fields
        const serialized = newTransactions.map(tx => ({
          ...tx,
          amount: Number(tx.amount),
        }))

        await sendEvent({
          type: 'transactions',
          data: serialized,
          timestamp: new Date().toISOString()
        })

        lastCheck = new Date()
      }

      // Also check for balance updates
      const account = await db.bankAccount.findUnique({
        where: { id: accountId },
        select: {
          currentBalance: true,
          availableBalance: true,
          updatedAt: true
        }
      })

      if (account && account.updatedAt > lastCheck) {
        await sendEvent({
          type: 'balance_update',
          data: {
            currentBalance: Number(account.currentBalance),
            availableBalance: Number(account.availableBalance),
          },
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Stream error:', error)
      await sendEvent({
        type: 'error',
        message: 'Failed to fetch updates',
        timestamp: new Date().toISOString()
      })
    }
  }, 5000) // Poll every 5 seconds

  // Clean up on disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(interval)
    writer.close()
  })

  // Return SSE response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}

/**
 * POST endpoint to trigger manual sync
 */
export async function POST(request: NextRequest) {
  // Auth check
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId } = body

    if (!accountId) {
      return Response.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Import and execute sync
    const { syncTransactions } = await import('@/components/platform/finance/banking/actions/bank.actions')

    const result = await syncTransactions({ accountId })

    if (!result.success) {
      return Response.json(
        { error: result.error || 'Sync failed' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: `Synced ${result.count || 0} new transactions`,
      count: result.count
    })
  } catch (error) {
    console.error('Sync error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}