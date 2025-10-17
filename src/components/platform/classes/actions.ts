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

  const row = await db.class.create({
    data: {
      schoolId,
      name: parsed.name,
      subjectId: parsed.subjectId,
      teacherId: parsed.teacherId,
      termId: parsed.termId,
      startPeriodId: parsed.startPeriodId,
      endPeriodId: parsed.endPeriodId,
      classroomId: parsed.classroomId,
      // Course Management Fields
      courseCode: parsed.courseCode || null,
      credits: parsed.credits || null,
      evaluationType: parsed.evaluationType || "NORMAL",
      minCapacity: parsed.minCapacity || 10,
      maxCapacity: parsed.maxCapacity || 50,
      duration: parsed.duration || null,
      prerequisiteId: parsed.prerequisiteId || null,
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
  // Course Management Fields
  if (typeof rest.courseCode !== "undefined") data.courseCode = rest.courseCode || null;
  if (typeof rest.credits !== "undefined") data.credits = rest.credits || null;
  if (typeof rest.evaluationType !== "undefined") data.evaluationType = rest.evaluationType || "NORMAL";
  if (typeof rest.minCapacity !== "undefined") data.minCapacity = rest.minCapacity || null;
  if (typeof rest.maxCapacity !== "undefined") data.maxCapacity = rest.maxCapacity || null;
  if (typeof rest.duration !== "undefined") data.duration = rest.duration || null;
  if (typeof rest.prerequisiteId !== "undefined") data.prerequisiteId = rest.prerequisiteId || null;

  await db.class.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/dashboard/classes");
  return { success: true as const };
}

export async function deleteClass(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await db.class.deleteMany({ where: { id, schoolId } });
  revalidatePath("/dashboard/classes");
  return { success: true as const };
}

// Reads
export async function getClass(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const c = await db.class.findFirst({
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
      // Course Management Fields
      courseCode: true,
      credits: true,
      evaluationType: true,
      minCapacity: true,
      maxCapacity: true,
      duration: true,
      prerequisiteId: true,
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
    db.class.findMany({
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
            termNumber: true
          }
        },
        _count: {
          select: {
            studentClasses: true
          }
        }
      }
    }),
    db.class.count({ where }),
  ]);
  const mapped = (rows as Array<any>).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    subjectName: c.subject?.subjectName || "Unknown",
    teacherName: c.teacher ? `${c.teacher.givenName} ${c.teacher.surname}` : "Unknown",
    termName: c.term?.termNumber ? `Term ${c.term.termNumber}` : "Unknown",
    courseCode: c.courseCode || "",
    credits: c.credits || "",
    evaluationType: c.evaluationType || "NORMAL",
    enrolledStudents: c._count.studentClasses,
    maxCapacity: c.maxCapacity || 50,
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

  // Build where clause with filters
  const where: any = {
    schoolId,
    ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
    ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
    ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
    ...(sp.termId ? { termId: sp.termId } : {}),
  };

  // Fetch ALL classes matching filters (no pagination for export)
  const classes = await db.class.findMany({
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
          termNumber: true,
        },
      },
      classroom: {
        select: {
          roomName: true,
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
    courseCode: classItem.courseCode || "",
    subject: classItem.subject?.subjectName || "",
    teacher: classItem.teacher
      ? `${classItem.teacher.givenName} ${classItem.teacher.surname}`
      : "",
    term: classItem.term?.termNumber ? `Term ${classItem.term.termNumber}` : "",
    classroom: classItem.classroom?.roomName || "",
    roomCapacity: classItem.classroom?.capacity || "",
    credits: classItem.credits || "",
    evaluationType: classItem.evaluationType || "NORMAL",
    minCapacity: classItem.minCapacity || "",
    maxCapacity: classItem.maxCapacity || "",
    duration: classItem.duration || "",
    enrolledStudents: classItem._count.studentClasses,
    createdAt: new Date(classItem.createdAt).toISOString().split("T")[0],
  }));

  // Define CSV columns
  const columns = [
    { key: "classId", label: "Class ID" },
    { key: "name", label: "Class Name" },
    { key: "courseCode", label: "Course Code" },
    { key: "subject", label: "Subject" },
    { key: "teacher", label: "Teacher" },
    { key: "term", label: "Term" },
    { key: "classroom", label: "Classroom" },
    { key: "roomCapacity", label: "Room Capacity" },
    { key: "credits", label: "Credit Hours" },
    { key: "evaluationType", label: "Evaluation Type" },
    { key: "minCapacity", label: "Min Students" },
    { key: "maxCapacity", label: "Max Students" },
    { key: "duration", label: "Duration (weeks)" },
    { key: "enrolledStudents", label: "Enrolled Students" },
    { key: "createdAt", label: "Created Date" },
  ];

  return arrayToCSV(exportData, { columns });
}
