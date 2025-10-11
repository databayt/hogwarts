import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamLessonContent } from "@/components/stream/dashboard/lesson/content";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.stream?.lesson?.title || "Lesson",
    description: dictionary.stream?.lesson?.description || "Course lesson content",
  };
}

export default async function StreamLessonPage({ params }: Props) {
  const { lang, subdomain, slug, lessonId } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext(subdomain);
  const session = await auth();

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`);
  }

  return (
    <StreamLessonContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
      courseSlug={slug}
      lessonId={lessonId}
    />
  );
}