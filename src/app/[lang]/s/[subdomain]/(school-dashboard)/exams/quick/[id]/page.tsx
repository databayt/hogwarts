// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Quick check review page — a teacher opens a DRAFT (typically one the
 * lesson-draft block wrote), edits it and publishes. Author roles only: a
 * student, a guardian, another school's id and a missing id all get 404.
 */

import { notFound } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import { QuickReview } from "@/components/school-dashboard/exams/quick/review"
import { loadQuickReview } from "@/components/school-dashboard/exams/quick/review-load"

interface ReviewPageProps {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function QuickReviewPage({ params }: ReviewPageProps) {
  const { lang, id } = await params
  const assessment = await loadQuickReview(id)
  if (!assessment) notFound()
  return <QuickReview assessment={assessment} lang={lang} />
}
