import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function getPeriodDays(period: string | null | undefined): number {
  switch (period) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "7d":
    default:
      return 7;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const periodParam = searchParams.get("period") ?? "7d";
  const days = getPeriodDays(periodParam);

  const now = new Date();
  const startCurrent = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const startPrev = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  const [
    totalSchools,
    activeSchools,
    totalUsers,
    totalStudents,
    addedSchoolsCurrent,
    addedSchoolsPrev,
    addedUsersCurrent,
    addedUsersPrev,
    addedStudentsCurrent,
    addedStudentsPrev,
  ] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { isActive: true } }),
    db.user.count(),
    db.student.count(),
    db.school.count({ where: { createdAt: { gte: startCurrent } } }),
    db.school.count({ where: { createdAt: { gte: startPrev, lt: startCurrent } } }),
    db.user.count({ where: { createdAt: { gte: startCurrent } } }),
    db.user.count({ where: { createdAt: { gte: startPrev, lt: startCurrent } } }),
    db.student.count({ where: { createdAt: { gte: startCurrent } } }),
    db.student.count({ where: { createdAt: { gte: startPrev, lt: startCurrent } } }),
  ]);

  const pct = (curr: number, prev: number) => {
    const base = prev === 0 ? (curr === 0 ? 1 : curr) : prev;
    return ((curr - prev) / base) * 100;
  };

  return NextResponse.json({
    period: periodParam,
    totals: {
      totalSchools,
      activeSchools,
      totalUsers,
      totalStudents,
    },
    deltas: {
      schools: pct(addedSchoolsCurrent, addedSchoolsPrev),
      users: pct(addedUsersCurrent, addedUsersPrev),
      students: pct(addedStudentsCurrent, addedStudentsPrev),
      // activeSchools delta unavailable without historical snapshots
    },
  });
}







