// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { BookOpen, CheckCircle2, Clock, GraduationCap } from "lucide-react"

import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"
import { getText } from "@/components/translation/display"
import type { Lang } from "@/components/translation/types"

import type { BookRow } from "./book-columns"
import { BookTable } from "./book-table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function BookContent({ lang }: Props) {
  const [books, approvedCount, pendingCount, schoolsUsing] = await Promise.all([
    db.book.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        author: true,
        genre: true,
        isbn: true,
        status: true,
        approvalStatus: true,
        usageCount: true,
        coverColor: true,
        rating: true,
        lang: true,
      },
    }),
    db.book.count({ where: { approvalStatus: "APPROVED" } }),
    db.book.count({ where: { approvalStatus: "PENDING" } }),
    db.bookSelection.groupBy({
      by: ["schoolId"],
      _count: true,
    }),
  ])

  const rows: BookRow[] = await Promise.all(
    books.map(async ({ lang: contentLang, ...b }) => ({
      ...b,
      title: await getText(
        b.title,
        (contentLang || "ar") as Lang,
        lang,
        "global"
      ),
      author: b.author
        ? await getText(b.author, (contentLang || "ar") as Lang, lang, "global")
        : b.author,
      genre: b.genre
        ? await getText(b.genre, (contentLang || "ar") as Lang, lang, "global")
        : b.genre,
    }))
  )

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{books.length}</p>
            <CardDescription>Global catalog books</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{approvedCount}</p>
            <CardDescription>Available to schools</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
            <CardDescription>Awaiting review</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schools Using</CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{schoolsUsing.length}</p>
            <CardDescription>Schools with selections</CardDescription>
          </CardContent>
        </Card>
      </div>

      <BookTable data={rows} />
    </PageContainer>
  )
}
