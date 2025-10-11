import { adminGetLesson } from "@/components/stream/data/admin/admin-get-lesson";
import { LessonForm } from "@/components/stream/admin/courses/lesson/form";

type Params = Promise<{
  courseId: string;
  chapterId: string;
  lessonId: string;
}>;

export default async function StreamLessonIdPage({ params }: { params: Params }) {
  const { chapterId, courseId, lessonId } = await params;
  const lesson = await adminGetLesson(lessonId);

  return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
}
