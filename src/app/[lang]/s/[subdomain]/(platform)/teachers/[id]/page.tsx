import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import ProfileContent from "@/components/profile/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function TeacherDetail({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();
  if (!schoolId || !(db as any).teacher) return notFound();

  const teacher = await (db as any).teacher.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      gender: true,
      emailAddress: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!teacher) return notFound();

  return <ProfileContent role="teacher" data={teacher} dictionary={dictionary} lang={lang} />;
}

export const metadata = { title: "Dashboard: Teacher" };
