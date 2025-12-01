"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { parentCreateSchema, parentUpdateSchema, getParentsSchema } from "@/components/platform/parents/validation";

export async function createParent(input: z.infer<typeof parentCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = parentCreateSchema.parse(input);
  
  const row = await (db as any).guardian.create({
    data: {
      schoolId,
      givenName: parsed.givenName,
      surname: parsed.surname,
      emailAddress: parsed.emailAddress || null,
      userId: parsed.userId || null,
    },
  });
  revalidatePath("/lab/parents");
  return { success: true as const, id: row.id as string };
}

export async function updateParent(input: z.infer<typeof parentUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = parentUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName;
  if (typeof rest.surname !== "undefined") data.surname = rest.surname;
  if (typeof rest.emailAddress !== "undefined") data.emailAddress = rest.emailAddress || null;
  if (typeof rest.userId !== "undefined") data.userId = rest.userId || null;
  
  await (db as any).guardian.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/lab/parents");
  return { success: true as const };
}

export async function deleteParent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).guardian.deleteMany({ where: { id, schoolId } });
  revalidatePath("/lab/parents");
  return { success: true as const };
}

// Reads
export async function getParent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).guardian) return { parent: null as null };
  const p = await (db as any).guardian.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      givenName: true,
      surname: true,
      emailAddress: true,
      teacherId: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { parent: p as null | Record<string, unknown> };
}

export async function getParents(input: Partial<z.infer<typeof getParentsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getParentsSchema.parse(input ?? {});
  if (!(db as any).guardian) return { rows: [] as Array<{ id: string; name: string; emailAddress: string; status: string; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.name
      ? {
          OR: [
            { givenName: { contains: sp.name, mode: "insensitive" } },
            { surname: { contains: sp.name, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(sp.emailAddress
      ? { emailAddress: { contains: sp.emailAddress, mode: "insensitive" } }
      : {}),
    ...(sp.status
      ? sp.status === "active"
        ? { NOT: { userId: null } }
        : sp.status === "inactive"
          ? { userId: null }
          : {}
        : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).guardian.findMany({ where, orderBy, skip, take }),
    (db as any).guardian.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((p) => ({
    id: p.id as string,
    userId: p.userId as string | null,
    name: [p.givenName, p.surname].filter(Boolean).join(" "),
    emailAddress: p.emailAddress || "-",
    status: p.userId ? "active" : "inactive",
    createdAt: (p.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}

/**
 * Export parents to CSV format
 */
export async function getParentsCSV(input?: Partial<z.infer<typeof getParentsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getParentsSchema.parse(input ?? {});
  if (!(db as any).guardian) return "";

  const where: any = {
    schoolId,
    ...(sp.name
      ? {
          OR: [
            { givenName: { contains: sp.name, mode: "insensitive" } },
            { surname: { contains: sp.name, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(sp.status
      ? sp.status === "active"
        ? { NOT: { userId: null } }
        : sp.status === "inactive"
          ? { userId: null }
          : {}
        : {}),
  };

  const parents = await (db as any).guardian.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
  });

  const headers = ["ID", "Given Name", "Surname", "Email", "Status", "Created"];
  const csvRows = (parents as Array<any>).map((p) =>
    [
      p.id,
      `"${(p.givenName || "").replace(/"/g, '""')}"`,
      `"${(p.surname || "").replace(/"/g, '""')}"`,
      `"${(p.emailAddress || "").replace(/"/g, '""')}"`,
      p.userId ? "Active" : "Inactive",
      new Date(p.createdAt).toISOString().split("T")[0],
    ].join(",")
  );

  return [headers.join(","), ...csvRows].join("\n");
}
