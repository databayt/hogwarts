"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { subjectCreateSchema, subjectUpdateSchema, getSubjectsSchema } from "@/components/platform/subjects/validation";

export async function createSubject(input: z.infer<typeof subjectCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = subjectCreateSchema.parse(input);
  
  const row = await (db as any).subject.create({
    data: {
      schoolId,
      subjectName: parsed.subjectName,
      departmentId: parsed.departmentId,
    },
  });
  revalidatePath("/dashboard/subjects");
  return { success: true as const, id: row.id as string };
}

export async function updateSubject(input: z.infer<typeof subjectUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = subjectUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.subjectName !== "undefined") data.subjectName = rest.subjectName;
  if (typeof rest.departmentId !== "undefined") data.departmentId = rest.departmentId;
  
  await (db as any).subject.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/subjects");
  return { success: true as const };
}

export async function deleteSubject(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).subject.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/subjects");
  return { success: true as const };
}

// Reads
export async function getSubject(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).subject) return { subject: null as null };
  const s = await (db as any).subject.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      subjectName: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { subject: s as null | Record<string, unknown> };
}

export async function getSubjects(input: Partial<z.infer<typeof getSubjectsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getSubjectsSchema.parse(input ?? {});
  if (!(db as any).subject) return { rows: [] as Array<{ id: string; subjectName: string; departmentName: string; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.subjectName
      ? { subjectName: { contains: sp.subjectName, mode: "insensitive" } }
      : {}),
    ...(sp.departmentId
      ? { departmentId: sp.departmentId }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).subject.findMany({ 
      where, 
      orderBy, 
      skip, 
      take,
      include: {
        department: {
          select: {
            departmentName: true
          }
        }
      }
    }),
    (db as any).subject.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((s) => ({
    id: s.id as string,
    subjectName: s.subjectName as string,
    departmentName: s.department?.departmentName || "Unknown",
    createdAt: (s.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}
