import Link from "next/link"
import { ArrowLeft, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getClassById,
  getClassSubjectTeachers,
} from "@/components/school-dashboard/listings/classes/actions"
import { SubjectTeachers } from "@/components/school-dashboard/listings/classes/subject-teachers"

export const metadata = { title: "Dashboard: Class Teachers" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const isRTL = lang === "ar"

  // Fetch class data and subject teachers in parallel
  const [classResult, teachersResult] = await Promise.all([
    getClassById({ id }),
    getClassSubjectTeachers({ classId: id }),
  ])

  const t = {
    back: isRTL ? "رجوع للفصل" : "Back to Class",
    title: isRTL ? "معلمو المادة" : "Subject Teachers",
    description: isRTL
      ? "إدارة المعلمين المعينين لهذا الفصل"
      : "Manage teachers assigned to this class",
    classNotFound: isRTL ? "الفصل غير موجود" : "Class not found",
  }

  if (!classResult.success || !classResult.data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href={`/${lang}/classes`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {t.back}
          </Link>
        </Button>
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center">
            {t.classNotFound}
          </CardContent>
        </Card>
      </div>
    )
  }

  const classData = classResult.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${lang}/classes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{classData.name}</h1>
          <p className="text-muted-foreground text-sm">{t.description}</p>
        </div>
      </div>

      {/* Subject Teachers Component */}
      <SubjectTeachers
        classId={id}
        lang={lang}
        initialTeachers={teachersResult.success ? teachersResult.data : []}
      />
    </div>
  )
}
