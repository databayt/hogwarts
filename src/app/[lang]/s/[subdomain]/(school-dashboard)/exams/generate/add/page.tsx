// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { createDraftGeneratedExam } from "@/components/school-dashboard/exams/wizard/exam-wizard-v2/wizard-actions"

export const metadata = { title: "Dashboard: Generate Exam" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  const session = await auth()
  if (!session?.user) redirect(`/${lang}/exams/generate`)

  const { schoolId } = await getTenantContext()
  if (!schoolId) redirect(`/${lang}/exams/generate`)

  const result = await createDraftGeneratedExam()

  if (!result.success || !result.data) {
    const error = encodeURIComponent(result.error || "Failed to create exam")
    redirect(`/${lang}/exams/generate?error=${error}`)
  }

  redirect(`/${lang}/exams/generate/add/${result.data.id}/template`)
}
