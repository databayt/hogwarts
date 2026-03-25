import { NextResponse } from "next/server"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { getUnreadMessageCount } from "@/components/school-dashboard/messaging/queries"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 }, { status: 401 })
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return NextResponse.json({ count: 0 })
    }

    const count = await getUnreadMessageCount(schoolId, session.user.id)
    return NextResponse.json({ count })
  } catch (error) {
    console.error("[unread-count] Error:", error)
    return NextResponse.json({ count: 0 })
  }
}
