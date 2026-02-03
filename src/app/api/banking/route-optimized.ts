import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"

// API Route handlers for banking operations

// Schema validation
const AccountsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 0)),
  accountType: z.string().optional(),
})

// GET /api/banking - Get user's bank accounts
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const query = AccountsQuerySchema.parse(Object.fromEntries(searchParams))

    // Import action server-side
    const { getAccounts } =
      await import("@/components/school-dashboard/finance/banking/actions/bank.actions")

    // Fetch accounts
    const accounts = await getAccounts({
      userId: session.user.id,
      ...query,
    })

    if (!accounts) {
      return NextResponse.json(
        { error: "Failed to fetch accounts" },
        { status: 500 }
      )
    }

    // Return with appropriate cache headers
    return NextResponse.json(accounts, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=30",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/banking/sync - Sync bank data
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { accountId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID required" },
        { status: 400 }
      )
    }

    // Import and execute sync
    const { syncTransactions } =
      await import("@/components/school-dashboard/finance/banking/actions/bank.actions")
    const result = await syncTransactions({ accountId })

    // Return result
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Sync failed",
          error: result.error,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `Synced ${result.count} transactions`,
        count: result.count,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    console.error("Sync Error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
