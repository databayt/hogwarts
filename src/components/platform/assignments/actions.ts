"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/operator/lib/tenant";
import { assignmentCreateSchema, assignmentUpdateSchema, getAssignmentsSchema } from "@/components/platform/assignments/validation";

export async function createAssignment(input: z.infer<typeof assignmentCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = assignmentCreateSchema.parse(input);
  
  const row = await (db as any).assignment.create({
    data: {
      schoolId,
      title: parsed.title,
      description: parsed.description || null,
      classId: parsed.classId,
      type: parsed.type,
      totalPoints: parsed.totalPoints,
      weight: parsed.weight,
      dueDate: parsed.dueDate,
      instructions: parsed.instructions || null,
      status: "DRAFT",
    },
  });
  revalidatePath("/dashboard/assignments");
  return { success: true as const, id: row.id as string };
}

export async function updateAssignment(input: z.infer<typeof assignmentUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = assignmentUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.title !== "undefined") data.title = rest.title;
  if (typeof rest.description !== "undefined") data.description = rest.description || null;
  if (typeof rest.classId !== "undefined") data.classId = rest.classId;
  if (typeof rest.type !== "undefined") data.type = rest.type;
  if (typeof rest.totalPoints !== "undefined") data.totalPoints = rest.totalPoints;
  if (typeof rest.weight !== "undefined") data.weight = rest.weight;
  if (typeof rest.dueDate !== "undefined") data.dueDate = rest.dueDate;
  if (typeof rest.instructions !== "undefined") data.instructions = rest.instructions || null;
  
  await (db as any).assignment.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/assignments");
  return { success: true as const };
}

export async function deleteAssignment(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).assignment.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/assignments");
  return { success: true as const };
}

// Reads
export async function getAssignment(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).assignment) return { assignment: null as null };
  const a = await (db as any).assignment.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      description: true,
      classId: true,
      type: true,
      totalPoints: true,
      weight: true,
      dueDate: true,
      instructions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { assignment: a as null | Record<string, unknown> };
}

export async function getAssignments(input: Partial<z.infer<typeof getAssignmentsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getAssignmentsSchema.parse(input ?? {});
  if (!(db as any).assignment) return { rows: [] as Array<{ id: string; title: string; type: string; totalPoints: number; dueDate: string; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.title
      ? { title: { contains: sp.title, mode: "insensitive" } }
      : {}),
    ...(sp.type
      ? { type: sp.type }
      : {}),
    ...(sp.classId
      ? { classId: sp.classId }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).assignment.findMany({ 
      where, 
      orderBy, 
      skip, 
      take,
      include: {
        class: {
          select: {
            name: true
          }
        }
      }
    }),
    (db as any).assignment.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    type: a.type as string,
    totalPoints: a.totalPoints as number,
    dueDate: (a.dueDate as Date).toISOString(),
    createdAt: (a.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}
