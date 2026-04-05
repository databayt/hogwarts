// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getContactsByRole } from "@/components/school-dashboard/messaging/contacts/queries"
import { getDisplayText } from "@/components/translation/display"
import type { SupportedLanguage } from "@/components/translation/types"

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
    const locale = (searchParams.get("locale") ?? "en") as SupportedLanguage

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

    // Translate contact names when locale differs from school's stored language
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    const contentLang = (school?.preferredLanguage ?? "ar") as SupportedLanguage

    if (contentLang !== locale) {
      await Promise.all(
        filtered.map(async (group) => {
          await Promise.all(
            group.contacts.map(async (contact) => {
              if (contact.displayName) {
                contact.displayName = await getDisplayText(
                  contact.displayName,
                  contentLang,
                  locale,
                  schoolId
                )
              }
              if (contact.firstName) {
                contact.firstName = await getDisplayText(
                  contact.firstName,
                  contentLang,
                  locale,
                  schoolId
                )
              }
              if (contact.lastName) {
                contact.lastName = await getDisplayText(
                  contact.lastName,
                  contentLang,
                  locale,
                  schoolId
                )
              }
            })
          )
        })
      )
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
