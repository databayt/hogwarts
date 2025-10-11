import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamCourseDetailContent } from "@/components/stream/courses/[slug]/content";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const dictionary = await getDictionary(lang);

  // TODO: Fetch course title from database using slug for better SEO
  return {
    title: `${slug} - ${dictionary.stream?.course?.title || "Course Details"}`,
    description: dictionary.stream?.course?.description || "Course details and enrollment",
  };
}

export default async function StreamCourseDetailPage({ params }: Props) {
  const { lang, subdomain, slug } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext(subdomain);

  return (
    <StreamCourseDetailContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      slug={slug}
    />
  );
}