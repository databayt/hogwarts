import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import ProfileContent from "@/components/profile/content";

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return <ProfileContent role="teacher" data={teacher} />;
}

export const metadata = { title: "Dashboard: Teacher" };
