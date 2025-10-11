"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { teacherCreateSchema, teacherUpdateSchema, getTeachersSchema } from "@/components/platform/teachers/validation";
import { arrayToCSV } from "@/lib/csv-export";

export async function createTeacher(input: z.infer<typeof teacherCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = teacherCreateSchema.parse(input);
  
  const row = await (db as any).teacher.create({
    data: {
      schoolId,
      givenName: parsed.givenName,
      surname: parsed.surname,
      gender: parsed.gender,
      emailAddress: parsed.emailAddress,
    },
  });
  revalidatePath("/dashboard/teachers");
  return { success: true as const, id: row.id as string };
}

export async function updateTeacher(input: z.infer<typeof teacherUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = teacherUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName;
  if (typeof rest.surname !== "undefined") data.surname = rest.surname;
  if (typeof rest.gender !== "undefined") data.gender = rest.gender;
  if (typeof rest.emailAddress !== "undefined") data.emailAddress = rest.emailAddress;
  
  await (db as any).teacher.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/teachers");
  return { success: true as const };
}

export async function deleteTeacher(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).teacher.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/teachers");
  return { success: true as const };
}

// Reads
export async function getTeacher(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).teacher) return { teacher: null as null };
  const t = await (db as any).teacher.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      givenName: true,
      surname: true,
      gender: true,
      emailAddress: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { teacher: t as null | Record<string, unknown> };
}

export async function getTeachers(input: Partial<z.infer<typeof getTeachersSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getTeachersSchema.parse(input ?? {});
  if (!(db as any).teacher) return { rows: [] as Array<{ id: string; name: string; emailAddress: string; status: string; createdAt: string }>, total: 0 };
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
    (db as any).teacher.findMany({ where, orderBy, skip, take }),
    (db as any).teacher.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((t) => ({
    id: t.id as string,
    name: [t.givenName, t.surname].filter(Boolean).join(" "),
    emailAddress: t.emailAddress || "-",
    status: t.userId ? "active" : "inactive",
    createdAt: (t.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}

/**
 * Export teachers to CSV format
 */
export async function getTeachersCSV(input?: Partial<z.infer<typeof getTeachersSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getTeachersSchema.parse(input ?? {});
  if (!(db as any).teacher) return "";

  // Build where clause with filters
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

  // Fetch ALL teachers matching filters (no pagination for export)
  const teachers = await (db as any).teacher.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
        },
      },
      teacherDepartments: {
        include: {
          department: {
            select: {
              departmentName: true,
            },
          },
        },
        take: 1, // Get primary department
      },
      teacherPhoneNumbers: {
        where: {
          isPrimary: true,
        },
        select: {
          phoneNumber: true,
        },
        take: 1,
      },
    },
    orderBy: [{ givenName: "asc" }, { surname: "asc" }],
  });

  // Transform data for CSV export
  const exportData = teachers.map((teacher: any) => ({
    teacherId: teacher.id,
    employeeId: teacher.employeeId || "",
    givenName: teacher.givenName || "",
    surname: teacher.surname || "",
    fullName: [teacher.givenName, teacher.surname].filter(Boolean).join(" "),
    gender: teacher.gender || "",
    email: teacher.emailAddress || "",
    userEmail: teacher.user?.email || "",
    phone:
      teacher.teacherPhoneNumbers && teacher.teacherPhoneNumbers.length > 0
        ? teacher.teacherPhoneNumbers[0].phoneNumber
        : "",
    department:
      teacher.teacherDepartments && teacher.teacherDepartments.length > 0
        ? teacher.teacherDepartments[0].department.departmentName
        : "",
    status: teacher.userId ? "Active" : "Inactive",
    createdAt: new Date(teacher.createdAt).toISOString().split("T")[0],
  }));

  // Define CSV columns
  const columns = [
    { key: "teacherId", label: "Teacher ID" },
    { key: "employeeId", label: "Employee ID" },
    { key: "givenName", label: "First Name" },
    { key: "surname", label: "Last Name" },
    { key: "fullName", label: "Full Name" },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Primary Email" },
    { key: "userEmail", label: "User Account Email" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created Date" },
  ];

  return arrayToCSV(exportData, { columns });
}
