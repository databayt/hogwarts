// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"
import type { SupportedLanguage } from "@/components/translation/types"

import { BookPicker } from "./book-picker"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

const CONTRIBUTE_ROLES = ["ADMIN", "TEACHER", "DEVELOPER"] as const

export async function LibraryCatalogContent({ lang }: Props) {
  const [{ schoolId }, session] = await Promise.all([
    getTenantContext(),
    auth(),
  ])

  if (!schoolId) {
    return (
      <PageContainer>
        <p className="text-muted-foreground py-12 text-center">
          Missing school context
        </p>
      </PageContainer>
    )
  }

  const [catalogBooks, selections] = await Promise.all([
    db.catalogBook.findMany({
      where: {
        status: "PUBLISHED",
        approvalStatus: "APPROVED",
        visibility: { in: ["PUBLIC", "SCHOOL"] },
      },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        author: true,
        genre: true,
        isbn: true,
        description: true,
        coverUrl: true,
        coverColor: true,
        rating: true,
        ratingCount: true,
        pageCount: true,
        usageCount: true,
        tags: true,
        lang: true,
      },
    }),
    db.schoolBookSelection.findMany({
      where: { schoolId },
      select: {
        id: true,
        catalogBookId: true,
        totalCopies: true,
        shelfLocation: true,
        isActive: true,
      },
    }),
  ])

  const selectionMap = new Set(selections.map((s) => s.catalogBookId))

  const booksWithSelection = await Promise.all(
    catalogBooks.map(async ({ lang: contentLang, ...b }) => {
      const srcLang = (contentLang || "ar") as SupportedLanguage
      return {
        ...b,
        title: await getDisplayText(b.title, srcLang, lang, schoolId!),
        author: b.author
          ? await getDisplayText(b.author, srcLang, lang, schoolId!)
          : b.author,
        genre: b.genre
          ? await getDisplayText(b.genre, srcLang, lang, schoolId!)
          : b.genre,
        description: b.description
          ? await getDisplayText(b.description, srcLang, lang, schoolId!)
          : b.description,
        isSelected: selectionMap.has(b.id),
      }
    })
  )

  const userRole = session?.user?.role
  const canManage = userRole === "ADMIN" || userRole === "DEVELOPER"
  const canContribute = CONTRIBUTE_ROLES.includes(userRole as any)

  return (
    <PageContainer>
      {canContribute && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/library/contribute">
              {lang === "ar" ? "المساهمة بكتاب" : "Contribute a Book"}
            </Link>
          </Button>
        </div>
      )}
      <BookPicker
        books={booksWithSelection}
        selections={selections}
        lang={lang}
        canManage={canManage}
      />
    </PageContainer>
  )
}
