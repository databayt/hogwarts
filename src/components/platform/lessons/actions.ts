"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { lessonCreateSchema, lessonUpdateSchema, getLessonsSchema } from "@/components/platform/lessons/validation";

export async function createLesson(input: z.infer<typeof lessonCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = lessonCreateSchema.parse(input);

  const row = await db.lesson.create({
    data: {
      schoolId,
      classId: parsed.classId,
      title: parsed.title,
      description: parsed.description || null,
      lessonDate: parsed.lessonDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      objectives: parsed.objectives || null,
      materials: parsed.materials || null,
      activities: parsed.activities || null,
      assessment: parsed.assessment || null,
      notes: parsed.notes || null,
      status: "PLANNED",
    },
  });
  revalidatePath("/dashboard/lessons");
  return { success: true as const, id: row.id as string };
}

export async function updateLesson(input: z.infer<typeof lessonUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = lessonUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};

  if (typeof rest.title !== "undefined") data.title = rest.title;
  if (typeof rest.description !== "undefined") data.description = rest.description || null;
  if (typeof rest.classId !== "undefined") data.classId = rest.classId;
  if (typeof rest.lessonDate !== "undefined") data.lessonDate = rest.lessonDate;
  if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime;
  if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime;
  if (typeof rest.objectives !== "undefined") data.objectives = rest.objectives || null;
  if (typeof rest.materials !== "undefined") data.materials = rest.materials || null;
  if (typeof rest.activities !== "undefined") data.activities = rest.activities || null;
  if (typeof rest.assessment !== "undefined") data.assessment = rest.assessment || null;
  if (typeof rest.notes !== "undefined") data.notes = rest.notes || null;

  await db.lesson.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/lessons");
  return { success: true as const };
}

export async function deleteLesson(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await db.lesson.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/lessons");
  return { success: true as const };
}

// Reads
export async function getLesson(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const l = await db.lesson.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      classId: true,
      title: true,
      description: true,
      lessonDate: true,
      startTime: true,
      endTime: true,
      objectives: true,
      materials: true,
      activities: true,
      assessment: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { lesson: l as null | Record<string, unknown> };
}

export async function getLessons(input: Partial<z.infer<typeof getLessonsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getLessonsSchema.parse(input ?? {});
  const where: any = {
    schoolId,
    ...(sp.title
      ? { title: { contains: sp.title, mode: "insensitive" } }
      : {}),
    ...(sp.classId
      ? { classId: sp.classId }
      : {}),
    ...(sp.status
      ? { status: sp.status }
      : {}),
    ...(sp.lessonDate
      ? { lessonDate: new Date(sp.lessonDate) }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ lessonDate: "desc" }, { startTime: "asc" }];
  const [rows, count] = await Promise.all([
    db.lesson.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        class: {
          select: {
            name: true,
            subject: {
              select: {
                subjectName: true
              }
            },
            teacher: {
              select: {
                givenName: true,
                surname: true
              }
            }
          }
        }
      }
    }),
    db.lesson.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((l) => ({
    id: l.id as string,
    title: l.title as string,
    className: l.class?.name || "Unknown",
    teacherName: l.class?.teacher ? `${l.class.teacher.givenName} ${l.class.teacher.surname}` : "Unknown",
    subjectName: l.class?.subject?.subjectName || "Unknown",
    lessonDate: (l.lessonDate as Date).toISOString(),
    startTime: l.startTime as string,
    endTime: l.endTime as string,
    status: l.status as string,
    createdAt: (l.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}
