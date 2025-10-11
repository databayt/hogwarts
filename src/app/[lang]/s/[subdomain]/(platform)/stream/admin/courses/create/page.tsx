import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamCourseCreateForm } from "@/components/stream/admin/courses/create/form";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.stream?.admin?.createCourse?.title || "Create New Course",
    description: dictionary.stream?.admin?.createCourse?.description || "Create a new course for your students",
  };
}

export default async function StreamCourseCreatePage({ params }: Props) {
  const { lang, subdomain } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();
  const session = await auth();

  // Check admin/teacher access
  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`);
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER" && session.user.role !== "DEVELOPER") {
    redirect(`/${lang}/s/${subdomain}/stream/not-admin`);
  }

  return (
    <StreamCourseCreateForm
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      userId={session.user.id}
    />
  );
}