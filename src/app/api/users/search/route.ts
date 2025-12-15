/**
 * User Search API
 *
 * Searches users within the same school for mentions/assignments.
 *
 * USE CASES:
 * - Messaging: Find recipient for new conversation
 * - Assignments: Assign task to specific user
 * - Mentions: @mention in announcements/messages
 *
 * PARAMETERS:
 * - q (required, min 2 chars): Search query
 * - limit (optional, default: 10, max: 50): Result limit
 *
 * SEARCH FIELDS:
 * - username: Case-insensitive contains
 * - email: Case-insensitive contains
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - schoolId from session context
 * - Users can ONLY search within their school
 * - Prevents discovering users from other schools
 *
 * WHY EXCLUDE CURRENT USER:
 * - Can't message yourself
 * - Can't assign task to yourself (usually)
 * - Reduces noise in results
 *
 * WHY MIN 2 CHARS:
 * - Prevents broad searches (performance)
 * - Single char returns too many results
 *
 * WHY LIMIT CAPPED AT 50:
 * - Dropdown UX doesn't need more
 * - Reduces database load
 * - Forces specific queries
 *
 * WHY force-dynamic:
 * - User data changes (new users, name changes)
 * - Must return current data
 *
 * RESPONSE FORMAT:
 * - users: Array with id, username, email, image, role
 *
 * @see /components/platform/messaging for usage
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// WHY: User data changes constantly
export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return NextResponse.json(
        { error: "Missing school context" },
        { status: 400 }
      )
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
      orderBy: [{ username: "asc" }, { email: "asc" }],
    })

    // Map to consistent format
    const formattedUsers = users.map((user) => ({
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
