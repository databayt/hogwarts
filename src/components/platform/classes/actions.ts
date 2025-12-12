"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { classCreateSchema, classUpdateSchema, getClassesSchema } from "@/components/platform/classes/validation";
import { arrayToCSV } from "@/lib/csv-export";

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

type ClassSelectResult = {
  id: string;
  schoolId: string;
  name: string;
  subjectId: string | null;
  teacherId: string | null;
  termId: string | null;
  startPeriodId: string | null;
  endPeriodId: string | null;
  classroomId: string | null;
  courseCode: string | null;
  credits: number | null;
  evaluationType: string;
  minCapacity: number | null;
  maxCapacity: number | null;
  duration: number | null;
  prerequisiteId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ClassListResult = {
  id: string;
  name: string;
  subjectName: string;
  teacherName: string;
  termName: string;
  courseCode: string;
  credits: string;
  evaluationType: string;
  enrolledStudents: number;
  maxCapacity: number;
  createdAt: string;
};

const CLASSES_PATH = "/classes";

// ============================================================================
// Mutations
// ============================================================================

export async function createClass(
  input: z.infer<typeof classCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

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
        courseCode: parsed.courseCode || null,
        credits: parsed.credits || null,
        evaluationType: parsed.evaluationType || "NORMAL",
        minCapacity: parsed.minCapacity || 10,
        maxCapacity: parsed.maxCapacity || 50,
        duration: parsed.duration || null,
        prerequisiteId: parsed.prerequisiteId || null,
      },
    });

    revalidatePath(CLASSES_PATH);
    return { success: true, data: { id: row.id } };
  } catch (error) {
    console.error("[createClass] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create class"
    };
  }
}

export async function updateClass(
  input: z.infer<typeof classUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const parsed = classUpdateSchema.parse(input);
    const { id, ...rest } = parsed;

    // Verify class exists
    const existing = await db.class.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Class not found" };
    }

    const data: Record<string, unknown> = {};
    if (typeof rest.name !== "undefined") data.name = rest.name;
    if (typeof rest.subjectId !== "undefined") data.subjectId = rest.subjectId;
    if (typeof rest.teacherId !== "undefined") data.teacherId = rest.teacherId;
    if (typeof rest.termId !== "undefined") data.termId = rest.termId;
    if (typeof rest.startPeriodId !== "undefined") data.startPeriodId = rest.startPeriodId;
    if (typeof rest.endPeriodId !== "undefined") data.endPeriodId = rest.endPeriodId;
    if (typeof rest.classroomId !== "undefined") data.classroomId = rest.classroomId;
    if (typeof rest.courseCode !== "undefined") data.courseCode = rest.courseCode || null;
    if (typeof rest.credits !== "undefined") data.credits = rest.credits || null;
    if (typeof rest.evaluationType !== "undefined") data.evaluationType = rest.evaluationType || "NORMAL";
    if (typeof rest.minCapacity !== "undefined") data.minCapacity = rest.minCapacity || null;
    if (typeof rest.maxCapacity !== "undefined") data.maxCapacity = rest.maxCapacity || null;
    if (typeof rest.duration !== "undefined") data.duration = rest.duration || null;
    if (typeof rest.prerequisiteId !== "undefined") data.prerequisiteId = rest.prerequisiteId || null;

    await db.class.updateMany({ where: { id, schoolId }, data });

    revalidatePath(CLASSES_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateClass] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update class"
    };
  }
}

export async function deleteClass(
  input: { id: string }
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    // Verify class exists
    const existing = await db.class.findFirst({
      where: { id, schoolId },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, error: "Class not found" };
    }

    await db.class.deleteMany({ where: { id, schoolId } });

    revalidatePath(CLASSES_PATH);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteClass] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete class"
    };
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getClass(
  input: { id: string }
): Promise<ActionResponse<ClassSelectResult | null>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    const classItem = await db.class.findFirst({
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

    return { success: true, data: classItem as ClassSelectResult | null };
  } catch (error) {
    console.error("[getClass] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class"
    };
  }
}

// Full class detail with related data
export type ClassDetailResult = {
  id: string;
  name: string;
  nameAr: string | null;
  courseCode: string | null;
  credits: number | null;
  evaluationType: string;
  minCapacity: number | null;
  maxCapacity: number | null;
  duration: number | null;
  createdAt: Date;
  subject: {
    id: string;
    subjectName: string;
    subjectNameAr: string | null;
  } | null;
  teacher: {
    id: string;
    givenName: string;
    surname: string;
    userId: string | null;
  } | null;
  term: {
    id: string;
    termName: string;
    termNumber: number;
  } | null;
  classroom: {
    id: string;
    roomName: string;
    capacity: number | null;
  } | null;
  enrolledStudents: Array<{
    id: string;
    student: {
      id: string;
      givenName: string;
      surname: string;
      userId: string | null;
    };
    enrolledAt: Date;
  }>;
  _count: {
    studentClasses: number;
  };
};

export async function getClassById(
  input: { id: string }
): Promise<ActionResponse<ClassDetailResult | null>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    const classItem = await (db as any).class.findFirst({
      where: { id, schoolId },
      include: {
        subject: {
          select: {
            id: true,
            subjectName: true,
            subjectNameAr: true,
          },
        },
        teacher: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            userId: true,
          },
        },
        term: {
          select: {
            id: true,
            termName: true,
            termNumber: true,
          },
        },
        classroom: {
          select: {
            id: true,
            roomName: true,
            capacity: true,
          },
        },
        studentClasses: {
          include: {
            student: {
              select: {
                id: true,
                givenName: true,
                surname: true,
                userId: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            studentClasses: true,
          },
        },
      },
    });

    if (!classItem) {
      return { success: true, data: null };
    }

    // Map the result
    const result: ClassDetailResult = {
      id: classItem.id,
      name: classItem.name,
      nameAr: classItem.nameAr,
      courseCode: classItem.courseCode,
      credits: classItem.credits ? Number(classItem.credits) : null,
      evaluationType: classItem.evaluationType,
      minCapacity: classItem.minCapacity,
      maxCapacity: classItem.maxCapacity,
      duration: classItem.duration,
      createdAt: classItem.createdAt,
      subject: classItem.subject,
      teacher: classItem.teacher,
      term: classItem.term,
      classroom: classItem.classroom,
      enrolledStudents: classItem.studentClasses.map((sc: any) => ({
        id: sc.id,
        student: sc.student,
        enrolledAt: sc.createdAt,
      })),
      _count: classItem._count,
    };

    return { success: true, data: result };
  } catch (error) {
    console.error("[getClassById] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class"
    };
  }
}

export async function getClasses(
  input: Partial<z.infer<typeof getClassesSchema>>
): Promise<ActionResponse<{ rows: ClassListResult[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const sp = getClassesSchema.parse(input ?? {});

    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
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

    const mapped: ClassListResult[] = (rows as Array<any>).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      subjectName: c.subject?.subjectName || "Unknown",
      teacherName: c.teacher ? `${c.teacher.givenName} ${c.teacher.surname}` : "Unknown",
      termName: c.term?.termNumber ? `Term ${c.term.termNumber}` : "Unknown",
      courseCode: c.courseCode || "",
      credits: c.credits?.toString() || "",
      evaluationType: c.evaluationType || "NORMAL",
      enrolledStudents: c._count.studentClasses,
      maxCapacity: c.maxCapacity || 50,
      createdAt: (c.createdAt as Date).toISOString(),
    }));

    return { success: true, data: { rows: mapped, total: count } };
  } catch (error) {
    console.error("[getClasses] Error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch classes"
    };
  }
}

/**
 * Export classes to CSV format
 */
export async function getClassesCSV(
  input?: Partial<z.infer<typeof getClassesSchema>>
): Promise<ActionResponse<string>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const sp = getClassesSchema.parse(input ?? {});

    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    };

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

    const columns = [
      { key: "classId" as const, label: "Class ID" },
      { key: "name" as const, label: "Class Name" },
      { key: "courseCode" as const, label: "Course Code" },
      { key: "subject" as const, label: "Subject" },
      { key: "teacher" as const, label: "Teacher" },
      { key: "term" as const, label: "Term" },
      { key: "classroom" as const, label: "Classroom" },
      { key: "roomCapacity" as const, label: "Room Capacity" },
      { key: "credits" as const, label: "Credit Hours" },
      { key: "evaluationType" as const, label: "Evaluation Type" },
      { key: "minCapacity" as const, label: "Min Students" },
      { key: "maxCapacity" as const, label: "Max Students" },
      { key: "duration" as const, label: "Duration (weeks)" },
      { key: "enrolledStudents" as const, label: "Enrolled Students" },
      { key: "createdAt" as const, label: "Created Date" },
    ];

    const csv = arrayToCSV(exportData, { columns });
    return { success: true, data: csv };
  } catch (error) {
    console.error("[getClassesCSV] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export classes"
    };
  }
}

/**
 * Get classes data for export (used by File Block ExportButton)
 * Returns raw data for client-side export generation
 */
export async function getClassesExportData(
  input?: Partial<z.infer<typeof getClassesSchema>>
): Promise<ActionResponse<Array<{
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  subjectName: string | null;
  teacherName: string | null;
  termName: string | null;
  yearLevelName: string | null;
  capacity: number | null;
  studentCount: number;
  schedule: string | null;
  room: string | null;
  isActive: boolean;
  createdAt: Date;
}>>> {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    const sp = getClassesSchema.parse(input ?? {});

    const where: any = {
      schoolId,
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.teacherId ? { teacherId: sp.teacherId } : {}),
      ...(sp.termId ? { termId: sp.termId } : {}),
    };

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

    const exportData = classes.map((classItem: any) => ({
      id: classItem.id,
      name: classItem.name || "",
      code: classItem.courseCode || null,
      description: classItem.description || null,
      subjectName: classItem.subject?.subjectName || null,
      teacherName: classItem.teacher
        ? `${classItem.teacher.givenName} ${classItem.teacher.surname}`
        : null,
      termName: classItem.term?.termNumber ? `Term ${classItem.term.termNumber}` : null,
      yearLevelName: null, // Class model doesn't have yearLevel relation
      capacity: classItem.maxCapacity || null,
      studentCount: classItem._count.studentClasses,
      schedule: classItem.schedule || null,
      room: classItem.classroom?.roomName || null,
      isActive: classItem.isActive ?? true,
      createdAt: new Date(classItem.createdAt),
    }));

    return { success: true, data: exportData };
  } catch (error) {
    console.error("[getClassesExportData] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch export data"
    };
  }
}
