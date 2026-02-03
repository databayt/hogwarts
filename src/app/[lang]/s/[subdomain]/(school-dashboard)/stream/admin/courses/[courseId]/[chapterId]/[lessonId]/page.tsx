import { getTenantContext } from "@/lib/tenant-context"
import { LessonForm } from "@/components/stream/admin/courses/lesson/form"
import { adminGetLesson } from "@/components/stream/data/admin/admin-get-lesson"

type Params = Promise<{
  courseId: string
  chapterId: string
  lessonId: string
}>

export default async function StreamLessonIdPage({
  params,
}: {
  params: Params
}) {
  const { chapterId, courseId, lessonId } = await params
  const { schoolId } = await getTenantContext()
  const lesson = await adminGetLesson(lessonId, schoolId)

  return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />
}
