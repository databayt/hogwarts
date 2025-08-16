"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/components/platform/operator/lib/tenant";
import { announcementCreateSchema, announcementUpdateSchema, getAnnouncementsSchema } from "@/components/platform/announcements/validation";

export async function createAnnouncement(input: z.infer<typeof announcementCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = announcementCreateSchema.parse(input);
  
  const row = await (db as any).announcement.create({
    data: {
      schoolId,
      title: parsed.title,
      body: parsed.body,
      scope: parsed.scope,
      classId: parsed.classId || null,
      role: parsed.role || null,
      published: parsed.published,
    },
  });
  revalidatePath("/dashboard/announcements");
  return { success: true as const, id: row.id as string };
}

export async function updateAnnouncement(input: z.infer<typeof announcementUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = announcementUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.title !== "undefined") data.title = rest.title;
  if (typeof rest.body !== "undefined") data.body = rest.body;
  if (typeof rest.scope !== "undefined") data.scope = rest.scope;
  if (typeof rest.classId !== "undefined") data.classId = rest.classId || null;
  if (typeof rest.role !== "undefined") data.role = rest.role || null;
  if (typeof rest.published !== "undefined") data.published = rest.published;
  
  await (db as any).announcement.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/announcements");
  return { success: true as const };
}

export async function deleteAnnouncement(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).announcement.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/announcements");
  return { success: true as const };
}

export async function toggleAnnouncementPublish(input: { id: string; publish: boolean }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id, publish } = z.object({ id: z.string().min(1), publish: z.boolean() }).parse(input);
  await (db as any).announcement.updateMany({ where: { id, schoolId }, data: { published: publish } });
  revalidatePath("/dashboard/announcements");
  return { success: true as const };
}

// Reads
export async function getAnnouncement(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).announcement) return { announcement: null as null };
  const a = await (db as any).announcement.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      body: true,
      scope: true,
      classId: true,
      role: true,
      published: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { announcement: a as null | Record<string, unknown> };
}

export async function getAnnouncements(input: Partial<z.infer<typeof getAnnouncementsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getAnnouncementsSchema.parse(input ?? {});
  if (!(db as any).announcement) return { rows: [] as Array<{ id: string; title: string; scope: string; published: boolean; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.title
      ? { title: { contains: sp.title, mode: "insensitive" } }
      : {}),
    ...(sp.scope
      ? { scope: sp.scope }
      : {}),
    ...(sp.published
      ? { published: sp.published === "true" }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).announcement.findMany({ where, orderBy, skip, take }),
    (db as any).announcement.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    scope: a.scope as string,
    published: a.published as boolean,
    createdAt: (a.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}
