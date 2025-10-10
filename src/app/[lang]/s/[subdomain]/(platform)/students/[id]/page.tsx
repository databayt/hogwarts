import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import ProfileContent from "@/components/profile/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StudentDetail({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext();
  if (!schoolId || !(db as any).student) return notFound();

  const student = await (db as any).student.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      givenName: true,
      middleName: true,
      surname: true,
      dateOfBirth: true,
      gender: true,
      enrollmentDate: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!student) return notFound();

  return <ProfileContent role="student" data={student} dictionary={dictionary} lang={lang} />;
}

export const metadata = { title: "Dashboard: Student" };


