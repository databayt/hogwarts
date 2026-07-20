// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getSchoolSubjectOptions } from "@/lib/school-subjects"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { AIGenerateContent } from "@/components/school-dashboard/exams/qbank/ai-generate-content"
import { Shell as PageContainer } from "@/components/table/shell"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.generate?.actions?.generateWithAI || "AI Question Generation",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AIGeneratePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams/qbank`)
  }

  const schoolId = session?.user?.schoolId
  if (!schoolId) {
    redirect(`/${lang}/exams/qbank`)
  }

  // Fetch subjects for the dropdown
  const subjects = await getSchoolSubjectOptions(schoolId)

  const subjectOptions = subjects.map((s) => ({
    label: s.name,
    value: s.id,
  }))

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter
          title={dictionary?.generate?.actions?.generateWithAI || "AI Generate"}
        />
        <AIGenerateContent subjects={subjectOptions} />
      </div>
    </PageContainer>
  )
}
