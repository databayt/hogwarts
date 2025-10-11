"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { resultCreateSchema, resultUpdateSchema, getResultsSchema } from "@/components/platform/results/validation";

export async function createResult(input: z.infer<typeof resultCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = resultCreateSchema.parse(input);
  
  // Calculate percentage
  const percentage = (parsed.score / parsed.maxScore) * 100;
  
  const row = await (db as any).result.create({
    data: {
      schoolId,
      studentId: parsed.studentId,
      assignmentId: parsed.assignmentId,
      classId: parsed.classId,
      score: parsed.score,
      maxScore: parsed.maxScore,
      percentage,
      grade: parsed.grade,
      feedback: parsed.feedback || null,
      gradedAt: new Date(),
    },
  });
  revalidatePath("/dashboard/results");
  return { success: true as const, id: row.id as string };
}

export async function updateResult(input: z.infer<typeof resultUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = resultUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  
  if (typeof rest.studentId !== "undefined") data.studentId = rest.studentId;
  if (typeof rest.assignmentId !== "undefined") data.assignmentId = rest.assignmentId;
  if (typeof rest.classId !== "undefined") data.classId = rest.classId;
  if (typeof rest.score !== "undefined") data.score = rest.score;
  if (typeof rest.maxScore !== "undefined") data.maxScore = rest.maxScore;
  if (typeof rest.grade !== "undefined") data.grade = rest.grade;
  if (typeof rest.feedback !== "undefined") data.feedback = rest.feedback || null;
  
  // Recalculate percentage if score or maxScore changed
  if (typeof rest.score !== "undefined" || typeof rest.maxScore !== "undefined") {
    const currentData = await (db as any).result.findFirst({ where: { id, schoolId } });
    const newScore = typeof rest.score !== "undefined" ? rest.score : currentData.score;
    const newMaxScore = typeof rest.maxScore !== "undefined" ? rest.maxScore : currentData.maxScore;
    data.percentage = (newScore / newMaxScore) * 100;
  }
  
  data.gradedAt = new Date();
  
  await (db as any).result.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/results");
  return { success: true as const };
}

export async function deleteResult(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).result.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/results");
  return { success: true as const };
}

// Reads
export async function getResult(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).result) return { result: null as null };
  const r = await (db as any).result.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      studentId: true,
      assignmentId: true,
      classId: true,
      score: true,
      maxScore: true,
      percentage: true,
      grade: true,
      feedback: true,
      submittedAt: true,
      gradedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { result: r as null | Record<string, unknown> };
}

export async function getResults(input: Partial<z.infer<typeof getResultsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getResultsSchema.parse(input ?? {});
  if (!(db as any).result) return { rows: [] as Array<{ id: string; studentName: string; assignmentTitle: string; className: string; score: number; maxScore: number; percentage: number; grade: string; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.studentId
      ? { studentId: sp.studentId }
      : {}),
    ...(sp.assignmentId
      ? { assignmentId: sp.assignmentId }
      : {}),
    ...(sp.classId
      ? { classId: sp.classId }
      : {}),
    ...(sp.grade
      ? { grade: sp.grade }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).result.findMany({ 
      where, 
      orderBy, 
      skip, 
      take,
      include: {
        student: {
          select: {
            givenName: true,
            surname: true
          }
        },
        assignment: {
          select: {
            title: true,
            totalPoints: true
          }
        },
        class: {
          select: {
            name: true
          }
        }
      }
    }),
    (db as any).result.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((r) => ({
    id: r.id as string,
    studentName: r.student ? `${r.student.givenName} ${r.student.surname}` : "Unknown",
    assignmentTitle: r.assignment?.title || "Unknown",
    className: r.class?.name || "Unknown",
    score: r.score as number,
    maxScore: r.maxScore as number,
    percentage: r.percentage as number,
    grade: r.grade as string,
    createdAt: (r.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}
