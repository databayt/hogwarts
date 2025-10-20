import { getCourseSidebarData } from "@/components/stream/data/course/get-course-sidebar-data";
import { getTenantContext } from "@/lib/tenant-context";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function StreamCourseSlugRoute({ params }: Props) {
  const { slug } = await params;
  const { schoolId } = await getTenantContext();

  const course = await getCourseSidebarData(slug, schoolId);

  const firstChapter = course.course.chapter[0];
  const firstLesson = firstChapter.lessons[0];

  if (firstLesson) {
    redirect(`/stream/dashboard/${slug}/${firstLesson.id}`);
  }

  return (
    <div className="flex items-center justify-center h-full text-center">
      <h2 className="text-2xl font-bold mb-2">No lessons available</h2>
      <p className="text-muted-foreground">
        This course does not have any lessons yet!
      </p>
    </div>
  );
}
