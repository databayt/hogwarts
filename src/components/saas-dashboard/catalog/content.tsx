import { BookOpen, GraduationCap, Layers } from "lucide-react"

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

import type { CatalogSubjectRow } from "./columns"
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
    },
  })

  const totalChapters = subjects.reduce((s, sub) => s + sub.totalChapters, 0)
  const totalLessons = subjects.reduce((s, sub) => s + sub.totalLessons, 0)

  const rows: CatalogSubjectRow[] = subjects.map((s) => ({
    ...s,
    levels: s.levels as string[],
  }))

  return (
    <PageContainer>
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
