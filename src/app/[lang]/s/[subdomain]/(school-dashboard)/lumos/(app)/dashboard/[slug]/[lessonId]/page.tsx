// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LumosLessonContent } from "@/components/lumos/dashboard/lesson/content"
import { getLessonContent } from "@/components/lumos/data/catalog/get-lesson-content"
import { getLessonWithProgress } from "@/components/lumos/data/catalog/get-lesson-with-progress"
import { BreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"

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
  try {
    const lesson = await getLessonWithProgress(lessonId)
    return {
      title: lesson?.title || "Lesson",
      description: lesson?.description || "Course lesson content",
    }
  } catch {
    return { title: "Lesson", description: "Course lesson content" }
  }
}

export default async function LumosLessonPage({ params }: Props) {
  const { lang, subdomain, slug, lessonId } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/auth/login`)
  }

  const [lesson, lessonContent] = await Promise.all([
    getLessonWithProgress(lessonId),
    getLessonContent(lessonId),
  ])

  if (!lesson) {
    notFound()
  }

  return (
    <>
      <BreadcrumbTitle title={lesson.title} />
      <LumosLessonContent
        dictionary={dictionary.lumos || {}}
        lang={lang}
        schoolId={schoolId}
        subdomain={subdomain}
        lesson={lesson}
        quizQuestions={lessonContent.questions}
        // Identifies the viewer in the player's forensic watermark. Without
        // it the watermark renders nothing at all, which is how it silently
        // did nothing until 2026-08-14.
        viewer={{
          id: session.user.id,
          email: session.user.email ?? null,
        }}
      />
    </>
  )
}
