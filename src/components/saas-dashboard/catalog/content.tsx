// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { BookOpen, GraduationCap, Layers } from "lucide-react"

import { getDisplayText } from "@/lib/content-display"
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
import type { SupportedLanguage } from "@/components/translation/types"

import type { CatalogSubjectRow } from "./columns"
import { CreateSubjectDialog } from "./create-subject-dialog"
import { CatalogTable } from "./table"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function CatalogContent({ lang }: Props) {
  const subjects = await db.catalogSubject.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      department: true,
      levels: true,
      status: true,
      totalChapters: true,
      totalLessons: true,
      usageCount: true,
      color: true,
      imageKey: true,
      lang: true,
    },
  })

  const totalChapters = subjects.reduce((s, sub) => s + sub.totalChapters, 0)
  const totalLessons = subjects.reduce((s, sub) => s + sub.totalLessons, 0)

  const rows: CatalogSubjectRow[] = await Promise.all(
    subjects.map(async ({ lang: contentLang, ...s }) => ({
      ...s,
      name: await getDisplayText(
        s.name,
        (contentLang || "ar") as SupportedLanguage,
        lang,
        "global"
      ),
      department: s.department
        ? await getDisplayText(
            s.department,
            (contentLang || "ar") as SupportedLanguage,
            lang,
            "global"
          )
        : s.department,
      levels: s.levels as string[],
    }))
  )

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Catalog</h2>
        <CreateSubjectDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subjects.length}</p>
            <CardDescription>Global catalog subjects</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters</CardTitle>
            <Layers className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalChapters}</p>
            <CardDescription>Across all subjects</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLessons}</p>
            <CardDescription>Total curriculum lessons</CardDescription>
          </CardContent>
        </Card>
      </div>

      <CatalogTable data={rows} />
    </PageContainer>
  )
}
