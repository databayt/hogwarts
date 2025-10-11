import { getLessonContent } from "@/components/stream/data/course/get-lesson-content";
import { CourseContent } from "@/components/stream/dashboard/lesson/course-content";
import { Suspense } from "react";
import { LessonSkeleton } from "@/components/stream/dashboard/lesson/lesson-skeleton";

type Params = Promise<{ lessonId: string }>;

export default async function StreamLessonContentPage({
  params,
}: {
  params: Params;
}) {
  const { lessonId } = await params;

  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContentLoader lessonId={lessonId} />
    </Suspense>
  );
}

async function LessonContentLoader({ lessonId }: { lessonId: string }) {
  const data = await getLessonContent(lessonId);
  return <CourseContent data={data} />;
}
