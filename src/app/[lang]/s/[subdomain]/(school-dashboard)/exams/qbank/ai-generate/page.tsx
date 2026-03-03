// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import type { Locale } from "@/components/internationalization/config"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { AIGenerateContent } from "@/components/school-dashboard/exams/qbank/ai-generate-content"
import { Shell as PageContainer } from "@/components/table/shell"

export const metadata = { title: "AI Question Generation" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AIGeneratePage({ params }: Props) {
  const { lang } = await params

  const session = await auth()
  if (["STUDENT", "GUARDIAN"].includes(session?.user?.role || "")) {
    redirect(`/${lang}/exams/qbank`)
  }

  const schoolId = session?.user?.schoolId
  if (!schoolId) {
    redirect(`/${lang}/exams/qbank`)
  }

  // Fetch subjects for the dropdown
  const subjects = await db.subject.findMany({
    where: { schoolId },
    select: { id: true, subjectName: true },
    orderBy: { subjectName: "asc" },
  })

  const subjectOptions = subjects.map((s) => ({
    label: s.subjectName,
    value: s.id,
  }))

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeadingSetter title="AI Generate" />
        <AIGenerateContent subjects={subjectOptions} />
      </div>
    </PageContainer>
  )
}
