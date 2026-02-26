// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogCourseSidebarData } from "@/components/stream/data/catalog/get-course-sidebar-data"

interface Props {
  params: Promise<{ lang: string; subdomain: string; slug: string }>
}

export default async function StreamCourseSlugRoute({ params }: Props) {
  const { lang, subdomain, slug } = await params
  const { schoolId } = await getTenantContext()

  const course = await getCatalogCourseSidebarData(slug, schoolId)

  const firstChapter = course.course.chapter[0]
  const firstLesson = firstChapter?.lessons[0]

  if (firstLesson) {
    redirect(
      `/${lang}/s/${subdomain}/stream/dashboard/${slug}/${firstLesson.id}`
    )
  }

  return (
    <div className="flex h-full items-center justify-center text-center">
      <h2 className="mb-2 text-2xl font-bold">No lessons available</h2>
      <p className="text-muted-foreground">
        This course does not have any lessons yet!
      </p>
    </div>
  )
}
