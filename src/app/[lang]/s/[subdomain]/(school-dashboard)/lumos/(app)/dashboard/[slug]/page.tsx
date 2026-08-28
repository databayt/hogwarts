// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getCatalogCourseSidebarData } from "@/components/lumos/data/catalog/get-course-sidebar-data"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>
}

export default async function LumosCourseSlugRoute({ params }: Props) {
  const { lang, slug } = await params
  const dictionary = await getDictionary(lang)

  // The fetcher resolves the tenant itself — it is a POST endpoint, so a
  // caller-supplied schoolId is attacker-controlled.
  const course = await getCatalogCourseSidebarData(slug)

  const firstChapter = course.course.chapter[0]
  const firstLesson = firstChapter?.lessons[0]

  if (firstLesson) {
    redirect(`/${lang}/lumos/courses/${slug}/${firstLesson.id}`)
  }

  const d = dictionary.lumos?.courses

  return (
    <div className="flex h-full items-center justify-center text-center">
      <h2 className="mb-2 text-2xl font-bold">
        {d?.noCourses || "No lessons available"}
      </h2>
      <p className="text-muted-foreground">
        {d?.noCoursesDescription ||
          "This course does not have any lessons yet!"}
      </p>
    </div>
  )
}
