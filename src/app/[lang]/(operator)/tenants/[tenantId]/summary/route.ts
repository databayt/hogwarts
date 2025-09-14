import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  await requireOperator();
  const tenantId = resolvedParams.tenantId;

  const [owners, students, teachers, classes] = await Promise.all([
    db.user.findMany({
      where: { schoolId: tenantId, role: "ADMIN" },
      select: { id: true, email: true },
    }),
    db.student.count({ where: { schoolId: tenantId } }),
    db.teacher.count({ where: { schoolId: tenantId } }),
    db.class.count({ where: { schoolId: tenantId } }),
  ]);

  return NextResponse.json({
    owners,
    metrics: { students, teachers, classes },
  });
}












