import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamLessonContent } from "@/components/stream/dashboard/lesson/content";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getLessonWithProgress } from "@/components/stream/data/course/get-lesson-with-progress";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await getLessonWithProgress(lessonId);

  return {
    title: lesson?.title || "Lesson",
    description: lesson?.description || "Course lesson content",
  };
}

export default async function StreamLessonPage({ params }: Props) {
  const { lang, subdomain, slug, lessonId } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();
  const session = await auth();

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`);
  }

  const lesson = await getLessonWithProgress(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <StreamLessonContent
      dictionary={dictionary.stream || {}}
      lang={lang}
      schoolId={schoolId}
      subdomain={subdomain}
      lesson={lesson}
    />
  );
}