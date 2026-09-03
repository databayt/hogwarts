// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { LumosCourseDetailContent } from "@/components/lumos/courses/[slug]/content"
import { checkCatalogEnrollment } from "@/components/lumos/data/catalog/check-enrollment"
import { getCatalogCourse } from "@/components/lumos/data/catalog/get-course"
import { getCourseProgress } from "@/components/lumos/data/catalog/get-course-progress"
import { BreadcrumbTitle } from "@/components/saas-dashboard/breadcrumb-title"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params
  const { schoolId } = await getTenantContext()

  try {
    const course = await getCatalogCourse(slug, schoolId, lang)
    return {
      title: `${course.title} - Course Details`,
      description: course.description || "Course details and enrollment",
    }
  } catch {
    return {
      title: "Course Not Found",
      description: "The requested course could not be found",
    }
  }
}

export default async function LumosCourseDetailPage({ params }: Props) {
  const { lang, slug } = await params
  const [dictionary, { schoolId }, session] = await Promise.all([
    getDictionary(lang),
    getTenantContext(),
    auth(),
  ])

  const course = await getCatalogCourse(slug, schoolId, lang)
  const [isEnrolled, courseProgress] = await Promise.all([
    checkCatalogEnrollment(course.id),
    getCourseProgress(course.id),
  ])

  return (
    <>
      {/* The URL carries the catalog slug (`sd-g10-literature`); the crumb
          carries the subject's own, already-localized name. */}
      <BreadcrumbTitle title={course.title} />
      <LumosCourseDetailContent
        dictionary={dictionary.lumos}
        lang={lang}
        schoolId={schoolId}
        course={course}
        isEnrolled={isEnrolled}
        userRole={session?.user?.role || null}
        courseProgress={courseProgress}
      />
    </>
  )
}
