import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { ContributeQuestionForm } from "@/components/school-dashboard/listings/subjects/catalog/contribute-question"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ContributeQuestionsPage({ params }: Props) {
  const { lang } = await params
  const isAr = lang === "ar"

  const catalogSubjects = await db.catalogSubject.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      chapters: {
        where: { status: "PUBLISHED" },
        orderBy: { sequenceOrder: "asc" },
        select: {
          id: true,
          name: true,
          lessons: {
            where: { status: "PUBLISHED" },
            orderBy: { sequenceOrder: "asc" },
            select: { id: true, name: true },
          },
        },
      },
    },
  })

  return (
    <>
      <PageHeadingSetter
        title={isAr ? "المساهمة بسؤال" : "Contribute a Question"}
      />
      <ContributeQuestionForm catalogSubjects={catalogSubjects} />
    </>
  )
}
