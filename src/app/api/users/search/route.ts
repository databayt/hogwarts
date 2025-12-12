import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Search users within the same school
 *
 * GET /api/users/search?q=<query>&limit=<number>
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return NextResponse.json({ error: "Missing school context" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // Search users in the same school
    const users = await db.user.findMany({
      where: {
        schoolId,
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
        // Exclude current user
        NOT: {
          id: session.user.id,
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        role: true,
      },
      take: limit,
      orderBy: [
        { username: "asc" },
        { email: "asc" },
      ],
    })

    // Map to consistent format
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      image: user.image,
      role: user.role,
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("[users/search] Error:", error)
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    )
  }
}
