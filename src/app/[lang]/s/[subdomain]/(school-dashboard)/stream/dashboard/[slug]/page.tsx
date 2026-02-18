import { redirect } from "next/navigation"

import { getTenantContext } from "@/lib/tenant-context"
import { getCatalogCourseSidebarData } from "@/components/stream/data/catalog/get-course-sidebar-data"

interface Props {
  params: Promise<{ slug: string }>
}

export default async function StreamCourseSlugRoute({ params }: Props) {
  const { slug } = await params
  const { schoolId } = await getTenantContext()

  const course = await getCatalogCourseSidebarData(slug, schoolId)

  const firstChapter = course.course.chapter[0]
  const firstLesson = firstChapter?.lessons[0]

  if (firstLesson) {
    redirect(`/stream/dashboard/${slug}/${firstLesson.id}`)
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
