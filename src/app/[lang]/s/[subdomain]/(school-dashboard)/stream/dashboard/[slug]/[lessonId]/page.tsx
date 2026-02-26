// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { BreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"
import { StreamLessonContent } from "@/components/stream/dashboard/lesson/content"
import { getLessonContent } from "@/components/stream/data/catalog/get-lesson-content"
import { getCatalogLessonWithProgress } from "@/components/stream/data/catalog/get-lesson-with-progress"

interface Props {
  params: Promise<{
    lang: Locale
    subdomain: string
    slug: string
    lessonId: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params
  const lesson = await getCatalogLessonWithProgress(lessonId)

  return {
    title: lesson?.title || "Lesson",
    description: lesson?.description || "Course lesson content",
  }
}

export default async function StreamLessonPage({ params }: Props) {
  const { lang, subdomain, slug, lessonId } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`)
  }

  const [lesson, lessonContent] = await Promise.all([
    getCatalogLessonWithProgress(lessonId),
    getLessonContent(lessonId),
  ])

  if (!lesson) {
    notFound()
  }

  return (
    <>
      <BreadcrumbTitle title={lesson.title} />
      <StreamLessonContent
        dictionary={dictionary.stream || {}}
        lang={lang}
        schoolId={schoolId}
        subdomain={subdomain}
        lesson={lesson}
        quizQuestions={lessonContent.questions}
      />
    </>
  )
}
