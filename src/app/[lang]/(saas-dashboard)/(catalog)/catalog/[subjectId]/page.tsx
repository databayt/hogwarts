import { notFound } from "next/navigation"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CatalogDetail } from "@/components/saas-dashboard/catalog/detail"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

export const metadata = {
  title: "Subject Detail",
  description: "View and manage catalog subject chapters and lessons",
}

interface Props {
  params: Promise<{ lang: Locale; subjectId: string }>
}

export default async function CatalogSubjectPage({ params }: Props) {
  const { lang, subjectId } = await params
  const dictionary = await getDictionary(lang)

  const subject = await db.catalogSubject.findUnique({
    where: { id: subjectId },
    include: {
      chapters: {
        orderBy: { sequenceOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sequenceOrder: "asc" },
          },
        },
      },
    },
  })

  if (!subject) notFound()

  return (
    <>
      <PageHeadingSetter title={subject.name} />
      <CatalogDetail subject={subject} dictionary={dictionary} lang={lang} />
    </>
  )
}
