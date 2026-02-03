import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getClassById,
  getClassSubjectTeachers,
} from "@/components/school-dashboard/listings/classes/actions"
import { ClassDetailContent } from "@/components/school-dashboard/listings/classes/detail"

export const metadata = { title: "Dashboard: Class Details" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function Page({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  // Fetch class data and subject teachers in parallel
  const [classResult, teachersResult] = await Promise.all([
    getClassById({ id }),
    getClassSubjectTeachers({ classId: id }),
  ])

  // Handle errors
  if (!classResult.success) {
    return (
      <ClassDetailContent
        classData={null}
        error={classResult.error}
        dictionary={dictionary}
        lang={lang}
      />
    )
  }

  // Render class detail with data
  return (
    <ClassDetailContent
      classData={classResult.data ?? null}
      dictionary={dictionary}
      lang={lang}
      initialSubjectTeachers={teachersResult.success ? teachersResult.data : []}
    />
  )
}
