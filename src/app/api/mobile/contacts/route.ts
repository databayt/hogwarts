// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@prisma/client"

import { getContactsByRole } from "@/components/school-dashboard/messaging/contacts/queries"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

import { authenticate, isAuthError } from "../lib/authenticate"

export const dynamic = "force-dynamic"

/**
 * Mobile Contacts API
 *
 * GET /api/mobile/contacts?search=&category=&locale=
 * Returns role-scoped contact groups for the messaging sidebar.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? undefined
    const category = searchParams.get("category") ?? undefined
    const locale = (searchParams.get("locale") ?? "en") as Lang

    const groups = await getContactsByRole(
      auth.schoolId,
      auth.userId,
      auth.role as UserRole,
      search
    )

    const filtered =
      category && category !== "all"
        ? groups.filter((g) => g.category === category)
        : groups

    // Batch-translate all displayName values in one getLabels call
    const allContacts = filtered.flatMap((g) => g.contacts)
    const names = allContacts
      .map((c) => c.displayName)
      .filter((v): v is string => Boolean(v))
    const translated = await getLabels(names, locale, auth.schoolId)
    for (const contact of allContacts) {
      if (contact.displayName)
        contact.displayName =
          translated.get(contact.displayName) ?? contact.displayName
    }

    return NextResponse.json({ groups: filtered })
  } catch (error) {
    console.error("Mobile contacts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
