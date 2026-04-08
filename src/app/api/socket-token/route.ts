import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { SignJWT } from "jose"

import { getTenantContext } from "@/lib/tenant-context"

const SOCKET_SECRET = new TextEncoder().encode(
  process.env.SOCKET_SECRET || "dev-socket-secret"
)

export async function GET() {
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

  const token = await new SignJWT({
    userId: session.user.id,
    schoolId,
    role: session.user.role || "USER",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("60s")
    .sign(SOCKET_SECRET)

  return NextResponse.json({ token })
}
