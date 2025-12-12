import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { isConversationParticipant, searchMessages } from "@/components/platform/messaging/queries"

export const dynamic = "force-dynamic"

/**
 * Search messages within a conversation
 *
 * GET /api/messages/search?conversationId=<id>&q=<query>&limit=<number>
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
    const conversationId = searchParams.get("conversationId")
    const query = searchParams.get("q")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
    }

    if (!query || query.length < 1) {
      return NextResponse.json({ messages: [], total: 0 })
    }

    // Check if user is participant in this conversation
    const isParticipant = await isConversationParticipant(conversationId, session.user.id)
    if (!isParticipant) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Search messages
    const result = await searchMessages(schoolId, session.user.id, query, {
      conversationId,
      perPage: limit,
    })

    // Map to consistent format with dates as strings
    const formattedMessages = result.rows.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      sender: msg.sender,
      createdAt: msg.createdAt.toISOString(),
      isDeleted: msg.isDeleted,
    }))

    return NextResponse.json({
      messages: formattedMessages,
      total: result.count,
    })
  } catch (error) {
    console.error("[messages/search] Error:", error)
    return NextResponse.json(
      { error: "Failed to search messages" },
      { status: 500 }
    )
  }
}
