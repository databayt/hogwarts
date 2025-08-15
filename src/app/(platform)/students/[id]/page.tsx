import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/platform/operator/lib/tenant";

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
  const fullName = [student.givenName, student.middleName, student.surname].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">{fullName}</h1>
        <p className="text-sm text-muted-foreground">Student detail</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Profile</h2>
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">Given name:</span> {student.givenName}</div>
            <div><span className="text-muted-foreground">Middle name:</span> {student.middleName ?? '-'}</div>
            <div><span className="text-muted-foreground">Surname:</span> {student.surname}</div>
            <div><span className="text-muted-foreground">Gender:</span> {student.gender}</div>
            <div><span className="text-muted-foreground">Date of birth:</span> {new Date(student.dateOfBirth).toLocaleDateString()}</div>
            <div><span className="text-muted-foreground">Enrollment date:</span> {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : '-'}</div>
            <div><span className="text-muted-foreground">Linked user:</span> {student.userId ?? '-'}</div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Meta</h2>
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground">ID:</span> {student.id}</div>
            <div><span className="text-muted-foreground">Created:</span> {new Date(student.createdAt).toLocaleString()}</div>
            <div><span className="text-muted-foreground">Updated:</span> {new Date(student.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = { title: "Dashboard: Student" };


