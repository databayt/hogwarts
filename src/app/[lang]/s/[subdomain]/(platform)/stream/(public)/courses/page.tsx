import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamCoursesContent } from "@/components/stream/courses/content";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
  searchParams?: Promise<{ category?: string; search?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.stream?.courses?.title || "All Courses",
    description: dictionary.stream?.courses?.description || "Browse our comprehensive course catalog",
  };
}

export default async function StreamCoursesPage({ params, searchParams }: Props) {
  const { lang, subdomain } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();
  const search = await searchParams;

  return (
    <StreamCoursesContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      searchParams={search}
    />
  );
}