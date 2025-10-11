"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { studentCreateSchema, studentUpdateSchema, getStudentsSchema } from "@/components/platform/students/validation";
import { arrayToCSV } from "@/lib/csv-export";

export async function createStudent(input: z.infer<typeof studentCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = studentCreateSchema.parse(input);
  let normalizedUserId: string | null = parsed.userId && parsed.userId.trim().length > 0 ? parsed.userId.trim() : null;
  
  if (normalizedUserId) {
    // Ensure the referenced user exists to avoid FK violation
    const user = await (db as any).user.findFirst({ where: { id: normalizedUserId } });
    if (!user) {
      normalizedUserId = null;
    } else {
      // Check if this userId is already being used by ANY student (global unique constraint)
      const existingStudent = await (db as any).student.findFirst({ 
        where: { 
          userId: normalizedUserId
        } 
      });
      if (existingStudent) {
        normalizedUserId = null; // Don't use this userId if it's already taken
      }
    }
  }
  
  const row = await (db as any).student.create({
    data: {
      schoolId,
      givenName: parsed.givenName,
      middleName: parsed.middleName ?? null,
      surname: parsed.surname,
      ...(parsed.dateOfBirth ? { dateOfBirth: new Date(parsed.dateOfBirth) } : {}),
      gender: parsed.gender,
      ...(parsed.enrollmentDate ? { enrollmentDate: new Date(parsed.enrollmentDate) } : {}),
      userId: normalizedUserId,
    },
  });
  revalidatePath("/dashboard/students");
  return { success: true as const, id: row.id as string };
}

export async function updateStudent(input: z.infer<typeof studentUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = studentUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.givenName !== "undefined") data.givenName = rest.givenName;
  if (typeof rest.middleName !== "undefined") data.middleName = rest.middleName ?? null;
  if (typeof rest.surname !== "undefined") data.surname = rest.surname;
  if (typeof rest.gender !== "undefined") data.gender = rest.gender;
  if (typeof rest.userId !== "undefined") {
    const trimmed = rest.userId?.trim();
    if (trimmed) {
      const user = await (db as any).user.findFirst({ where: { id: trimmed } });
      if (user) {
        // Check if this userId is already being used by ANY other student (global unique constraint)
        const existingStudent = await (db as any).student.findFirst({ 
          where: { 
            userId: trimmed,
            NOT: { id } // Exclude current student
          } 
        });
        data.userId = existingStudent ? null : trimmed;
      } else {
        data.userId = null;
      }
    } else {
      data.userId = null;
    }
  }
  if (typeof rest.dateOfBirth !== "undefined") data.dateOfBirth = new Date(rest.dateOfBirth);
  if (typeof rest.enrollmentDate !== "undefined") data.enrollmentDate = new Date(rest.enrollmentDate);
  await (db as any).student.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/students");
  return { success: true as const };
}

export async function deleteStudent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).student.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/students");
  return { success: true as const };
}

// Reads
export async function getStudent(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).student) return { student: null as null };
  const s = await (db as any).student.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      givenName: true,
      middleName: true,
      surname: true,
      dateOfBirth: true,
      gender: true,
      enrollmentDate: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { student: s as null | Record<string, unknown> };
}

export async function getStudents(input: Partial<z.infer<typeof getStudentsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getStudentsSchema.parse(input ?? {});
  if (!(db as any).student) return { rows: [] as Array<{ id: string; name: string; className: string; status: string; createdAt: string }>, total: 0 };
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
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).student.findMany({ where, orderBy, skip, take }),
    (db as any).student.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((s) => ({
    id: s.id as string,
    name: [s.givenName, s.surname].filter(Boolean).join(" "),
    className: "-",
    status: s.userId ? "active" : "inactive",
    createdAt: (s.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}

/**
 * Export students to CSV format
 */
export async function getStudentsCSV(input?: Partial<z.infer<typeof getStudentsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getStudentsSchema.parse(input ?? {});
  if (!(db as any).student) return "";

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
    ...(sp.status
      ? sp.status === "active"
        ? { NOT: { userId: null } }
        : sp.status === "inactive"
          ? { userId: null }
          : {}
      : {}),
  };

  // Fetch ALL students matching filters (no pagination for export)
  const students = await (db as any).student.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
        },
      },
      studentClasses: {
        include: {
          class: {
            select: {
              name: true,
            },
          },
        },
        take: 1, // Get primary class
      },
    },
    orderBy: [{ givenName: "asc" }, { surname: "asc" }],
  });

  // Transform data for CSV export
  const exportData = students.map((student: any) => ({
    studentId: student.id,
    givenName: student.givenName || "",
    middleName: student.middleName || "",
    surname: student.surname || "",
    fullName: [student.givenName, student.middleName, student.surname]
      .filter(Boolean)
      .join(" "),
    dateOfBirth: student.dateOfBirth
      ? new Date(student.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: student.gender || "",
    email: student.user?.email || "",
    enrollmentDate: student.enrollmentDate
      ? new Date(student.enrollmentDate).toISOString().split("T")[0]
      : "",
    status: student.userId ? "Active" : "Inactive",
    className:
      student.studentClasses && student.studentClasses.length > 0
        ? student.studentClasses[0].class.name
        : "",
    createdAt: new Date(student.createdAt).toISOString().split("T")[0],
  }));

  // Define CSV columns
  const columns = [
    { key: "studentId", label: "Student ID" },
    { key: "givenName", label: "First Name" },
    { key: "middleName", label: "Middle Name" },
    { key: "surname", label: "Last Name" },
    { key: "fullName", label: "Full Name" },
    { key: "dateOfBirth", label: "Date of Birth" },
    { key: "gender", label: "Gender" },
    { key: "email", label: "Email" },
    { key: "enrollmentDate", label: "Enrollment Date" },
    { key: "status", label: "Status" },
    { key: "className", label: "Class" },
    { key: "createdAt", label: "Created Date" },
  ];

  return arrayToCSV(exportData, { columns });
}