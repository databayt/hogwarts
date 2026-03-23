// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { getTenantContext } from "@/lib/tenant-context"
import { getContactsByRole } from "@/components/school-dashboard/messaging/contacts/queries"

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
    const search = searchParams.get("search") ?? undefined
    const category = searchParams.get("category") ?? undefined

    const groups = await getContactsByRole(
      schoolId,
      session.user.id,
      session.user.role as UserRole,
      search
    )

    // Filter by category if specified
    const filtered =
      category && category !== "all"
        ? groups.filter((g) => g.category === category)
        : groups

    return NextResponse.json({ groups: filtered })
  } catch (error) {
    console.error("[contacts] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}
