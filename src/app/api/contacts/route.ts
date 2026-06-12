// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getContactsByRole } from "@/components/school-dashboard/messaging/contacts/queries"
import { getLabels } from "@/components/translation/person"
import type { Lang } from "@/components/translation/types"

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
    const locale = (searchParams.get("locale") ?? "en") as Lang

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

    // Batch-translate all contact name parts in one getLabels call
    const allContacts = filtered.flatMap((g) => g.contacts)
    const namesToTranslate = [
      ...allContacts.map((c) => c.displayName),
      ...allContacts.map((c) => c.firstName),
      ...allContacts.map((c) => c.lastName),
    ].filter((v): v is string => Boolean(v))
    const translated = await getLabels(namesToTranslate, locale, schoolId)
    for (const contact of allContacts) {
      if (contact.displayName)
        contact.displayName =
          translated.get(contact.displayName) ?? contact.displayName
      if (contact.firstName)
        contact.firstName =
          translated.get(contact.firstName) ?? contact.firstName
      if (contact.lastName)
        contact.lastName = translated.get(contact.lastName) ?? contact.lastName
    }

    return NextResponse.json({ groups: filtered })
  } catch (error) {
    console.error("[contacts] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}
