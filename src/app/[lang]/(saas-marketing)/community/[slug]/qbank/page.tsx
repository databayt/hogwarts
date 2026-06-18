// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CommunityQBank } from "@/components/saas-marketing/community/community-qbank"
import {
  getCommunitySubjectBySlug,
  getCommunitySubjectQuestions,
} from "@/components/saas-marketing/community/queries"

// Public question bank for /community/[slug]/qbank — replaces the school
// /exams/qbank deep link (which is auth-gated). Hero + grade pills come from
// the shared [slug]/layout.tsx.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; slug: string }>
}

export default async function CommunityQBankPage({ params }: Props) {
  const { lang, slug } = await params

  const [dictionary, subject] = await Promise.all([
    getDictionary(lang),
    getCommunitySubjectBySlug(slug),
  ])
  if (!subject) notFound()

  const chapterIds = subject.chapters.map((ch) => ch.id)
  const lessonIds = subject.chapters.flatMap((ch) =>
    ch.lessons.map((l) => l.id)
  )

  const questions = await getCommunitySubjectQuestions({
    subjectId: subject.id,
    chapterIds,
    lessonIds,
  })

  return (
    <CommunityQBank
      questions={questions}
      subjectColor={subject.color}
      dictionary={dictionary}
    />
  )
}
