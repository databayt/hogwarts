import { Metadata } from "next"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StreamCourseDetailContent } from "@/components/stream/courses/[slug]/content"
import { checkCatalogEnrollment } from "@/components/stream/data/catalog/check-enrollment"
import { getCatalogCourse } from "@/components/stream/data/catalog/get-course"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { schoolId } = await getTenantContext()

  try {
    const course = await getCatalogCourse(slug, schoolId)
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

export default async function StreamCourseDetailPage({ params }: Props) {
  const { lang, slug } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  const course = await getCatalogCourse(slug, schoolId, lang)
  const isEnrolled = await checkCatalogEnrollment(course.id, schoolId)

  return (
    <StreamCourseDetailContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      course={course}
      isEnrolled={isEnrolled}
    />
  )
}
