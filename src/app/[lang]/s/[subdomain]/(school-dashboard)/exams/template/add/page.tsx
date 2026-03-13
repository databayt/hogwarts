// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { redirect } from "next/navigation"

import { createDraftTemplate } from "@/components/school-dashboard/exams/wizard/template-wizard/wizard-actions"

export default async function ExamTemplateAddPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const result = await createDraftTemplate()

  if (!result.success || !result.data) {
    redirect(`/${lang}/exams/generate`)
  }

  redirect(`/${lang}/exams/template/add/${result.data.id}/gallery`)
}
