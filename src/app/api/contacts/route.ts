// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getContactsByRole } from "@/components/school-dashboard/messaging/contacts/queries"
import { getText } from "@/components/translation/display"
import type { Lang } from "@/components/translation/types"
import { detectLang } from "@/components/translation/util"

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

    // Translate contact names when their actual language differs from the UI locale
    await Promise.all(
      filtered.map(async (group) => {
        await Promise.all(
          group.contacts.map(async (contact) => {
            if (
              contact.displayName &&
              detectLang(contact.displayName) !== locale
            ) {
              const detected = detectLang(contact.displayName) as Lang
              contact.displayName = await getText(
                contact.displayName,
                detected,
                locale,
                schoolId
              )
            }
            if (contact.firstName && detectLang(contact.firstName) !== locale) {
              const detected = detectLang(contact.firstName) as Lang
              contact.firstName = await getText(
                contact.firstName,
                detected,
                locale,
                schoolId
              )
            }
            if (contact.lastName && detectLang(contact.lastName) !== locale) {
              const detected = detectLang(contact.lastName) as Lang
              contact.lastName = await getText(
                contact.lastName,
                detected,
                locale,
                schoolId
              )
            }
          })
        )
      })
    )

    return NextResponse.json({ groups: filtered })
  } catch (error) {
    console.error("[contacts] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    )
  }
}
