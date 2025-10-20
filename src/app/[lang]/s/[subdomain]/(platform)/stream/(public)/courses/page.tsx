import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamCoursesContent, StreamCoursesLoadingSkeleton } from "@/components/stream/courses/content";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";
import { getAllCourses } from "@/components/stream/data/course/get-all-courses";
import { Suspense } from "react";

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
    <Suspense fallback={<StreamCoursesLoadingSkeleton />}>
      <CoursesRenderer
        lang={lang}
        schoolId={schoolId}
        dictionary={dictionary.stream}
        searchParams={search}
      />
    </Suspense>
  );
}

async function CoursesRenderer({
  lang,
  schoolId,
  dictionary,
  searchParams,
}: {
  lang: string;
  schoolId: string | null;
  dictionary: any;
  searchParams?: { category?: string; search?: string };
}) {
  const courses = await getAllCourses(schoolId);

  return (
    <StreamCoursesContent
      dictionary={dictionary}
      lang={lang}
      schoolId={schoolId}
      courses={courses}
      searchParams={searchParams}
    />
  );
}