import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import ProfileContent from "@/components/profile/content";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return <ProfileContent role="student" data={student} />;
}

export const metadata = { title: "Dashboard: Student" };


