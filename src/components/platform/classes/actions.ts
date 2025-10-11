"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { classCreateSchema, classUpdateSchema, getClassesSchema } from "@/components/platform/classes/validation";
import { arrayToCSV } from "@/lib/csv-export";

export async function createClass(input: z.infer<typeof classCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = classCreateSchema.parse(input);
  
  const row = await (db as any).class.create({
    data: {
      schoolId,
      name: parsed.name,
      subjectId: parsed.subjectId,
      teacherId: parsed.teacherId,
      termId: parsed.termId,
      startPeriodId: parsed.startPeriodId,
      endPeriodId: parsed.endPeriodId,
      classroomId: parsed.classroomId,
    },
  });
  revalidatePath("/dashboard/classes");
  return { success: true as const, id: row.id as string };
}

export async function updateClass(input: z.infer<typeof classUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = classUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  if (typeof rest.name !== "undefined") data.name = rest.name;
  if (typeof rest.subjectId !== "undefined") data.subjectId = rest.subjectId;
  if (typeof rest.teacherId !== "undefined") data.teacherId = rest.teacherId;
  if (typeof rest.termId !== "undefined") data.termId = rest.termId;
  if (typeof rest.startPeriodId !== "undefined") data.startPeriodId = rest.startPeriodId;
  if (typeof rest.endPeriodId !== "undefined") data.endPeriodId = rest.endPeriodId;
  if (typeof rest.classroomId !== "undefined") data.classroomId = rest.classroomId;
  
  await (db as any).class.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/classes");
  return { success: true as const };
}

export async function deleteClass(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await (db as any).class.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/classes");
  return { success: true as const };
}

// Reads
export async function getClass(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  if (!(db as any).class) return { class: null as null };
  const c = await (db as any).class.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      name: true,
      subjectId: true,
      teacherId: true,
      termId: true,
      startPeriodId: true,
      endPeriodId: true,
      classroomId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { class: c as null | Record<string, unknown> };
}

export async function getClasses(input: Partial<z.infer<typeof getClassesSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getClassesSchema.parse(input ?? {});
  if (!(db as any).class) return { rows: [] as Array<{ id: string; name: string; subjectName: string; teacherName: string; termName: string; createdAt: string }>, total: 0 };
  const where: any = {
    schoolId,
    ...(sp.name
      ? { name: { contains: sp.name, mode: "insensitive" } }
      : {}),
    ...(sp.subjectId
      ? { subjectId: sp.subjectId }
      : {}),
    ...(sp.teacherId
      ? { teacherId: sp.teacherId }
      : {}),
    ...(sp.termId
      ? { termId: sp.termId }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ createdAt: "desc" }];
  const [rows, count] = await Promise.all([
    (db as any).class.findMany({ 
      where, 
      orderBy, 
      skip, 
      take,
      include: {
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
        },
        term: {
          select: {
            termName: true
          }
        }
      }
    }),
    (db as any).class.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    subjectName: c.subject?.subjectName || "Unknown",
    teacherName: c.teacher ? `${c.teacher.givenName} ${c.teacher.surname}` : "Unknown",
    termName: c.term?.termName || "Unknown",
    createdAt: (c.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}

/**
 * Export classes to CSV format
 */
export async function getClassesCSV(input?: Partial<z.infer<typeof getClassesSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getClassesSchema.parse(input ?? {});
  if (!(db as any).class) return "";

  // Build where clause with filters
  const where: any = {
    schoolId,
    ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
    ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
    ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
    ...(sp.termId ? { termId: sp.termId } : {}),
  };

  // Fetch ALL classes matching filters (no pagination for export)
  const classes = await (db as any).class.findMany({
    where,
    include: {
      subject: {
        select: {
          subjectName: true,
        },
      },
      teacher: {
        select: {
          givenName: true,
          surname: true,
        },
      },
      term: {
        select: {
          termName: true,
        },
      },
      classroom: {
        select: {
          roomNumber: true,
          capacity: true,
        },
      },
      _count: {
        select: {
          studentClasses: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  // Transform data for CSV export
  const exportData = classes.map((classItem: any) => ({
    classId: classItem.id,
    name: classItem.name || "",
    subject: classItem.subject?.subjectName || "",
    teacher: classItem.teacher
      ? `${classItem.teacher.givenName} ${classItem.teacher.surname}`
      : "",
    term: classItem.term?.termName || "",
    classroom: classItem.classroom?.roomNumber || "",
    capacity: classItem.classroom?.capacity || "",
    enrolledStudents: classItem._count.studentClasses,
    createdAt: new Date(classItem.createdAt).toISOString().split("T")[0],
  }));

  // Define CSV columns
  const columns = [
    { key: "classId", label: "Class ID" },
    { key: "name", label: "Class Name" },
    { key: "subject", label: "Subject" },
    { key: "teacher", label: "Teacher" },
    { key: "term", label: "Term" },
    { key: "classroom", label: "Classroom" },
    { key: "capacity", label: "Room Capacity" },
    { key: "enrolledStudents", label: "Enrolled Students" },
    { key: "createdAt", label: "Created Date" },
  ];

  return arrayToCSV(exportData, { columns });
}
