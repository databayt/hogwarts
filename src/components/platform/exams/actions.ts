"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import { examCreateSchema, examUpdateSchema, getExamsSchema } from "@/components/platform/exams/validation";

export async function createExam(input: z.infer<typeof examCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = examCreateSchema.parse(input);
  
  const row = await (db as any).exam.create({
    data: {
      schoolId,
      title: parsed.title,
      description: parsed.description || null,
      classId: parsed.classId,
      subjectId: parsed.subjectId,
      examDate: parsed.examDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      duration: parsed.duration,
      totalMarks: parsed.totalMarks,
      passingMarks: parsed.passingMarks,
      examType: parsed.examType,
      instructions: parsed.instructions || null,
      status: "PLANNED",
    },
  });
  revalidatePath("/dashboard/exams");
  return { success: true as const, id: row.id as string };
}

export async function updateExam(input: z.infer<typeof examUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = examUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  
  if (typeof rest.title !== "undefined") data.title = rest.title;
  if (typeof rest.description !== "undefined") data.description = rest.description || null;
  if (typeof rest.classId !== "undefined") data.classId = rest.classId;
  if (typeof rest.subjectId !== "undefined") data.subjectId = rest.subjectId;
  if (typeof rest.examDate !== "undefined") data.examDate = rest.examDate;
  if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime;
  if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime;
  if (typeof rest.duration !== "undefined") data.duration = rest.duration;
  if (typeof rest.totalMarks !== "undefined") data.totalMarks = rest.totalMarks;
  if (typeof rest.passingMarks !== "undefined") data.passingMarks = rest.passingMarks;
  if (typeof rest.examType !== "undefined") data.examType = rest.examType;
  if (typeof rest.instructions !== "undefined") data.instructions = rest.instructions || null;
  
  await (db as any).exam.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/exams");
  return { success: true as const };
}

export async function deleteExam(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).exam.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/exams");
  return { success: true as const };
}

// Reads
export async function getExam(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).exam) return { exam: null as null };
  const e = await (db as any).exam.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      description: true,
      classId: true,
      subjectId: true,
      examDate: true,
      startTime: true,
      endTime: true,
      duration: true,
      totalMarks: true,
      passingMarks: true,
      examType: true,
      instructions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { exam: e as null | Record<string, unknown> };
}

export async function getExams(input: Partial<z.infer<typeof getExamsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getExamsSchema.parse(input ?? {});
  if (!(db as any).exam) return { rows: [] as Array<{ id: string; title: string; className: string; subjectName: string; examDate: string; startTime: string; endTime: string; duration: number; totalMarks: number; examType: string; status: string; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.title
      ? { title: { contains: sp.title, mode: "insensitive" } }
      : {}),
    ...(sp.classId
      ? { classId: sp.classId }
      : {}),
    ...(sp.subjectId
      ? { subjectId: sp.subjectId }
      : {}),
    ...(sp.examType
      ? { examType: sp.examType }
      : {}),
    ...(sp.status
      ? { status: sp.status }
      : {}),
    ...(sp.examDate
      ? { examDate: new Date(sp.examDate) }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ examDate: "desc" }, { startTime: "asc" }];
  const [rows, count] = await Promise.all([
    (db as any).exam.findMany({ 
      where, 
      orderBy, 
      skip, 
      take,
      include: {
        class: {
          select: {
            name: true
          }
        },
        subject: {
          select: {
            subjectName: true
          }
        }
      }
    }),
    (db as any).exam.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((e) => ({
    id: e.id as string,
    title: e.title as string,
    className: e.class?.name || "Unknown",
    subjectName: e.subject?.subjectName || "Unknown",
    examDate: (e.examDate as Date).toISOString(),
    startTime: e.startTime as string,
    endTime: e.endTime as string,
    duration: e.duration as number,
    totalMarks: e.totalMarks as number,
    examType: e.examType as string,
    status: e.status as string,
    createdAt: (e.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}
