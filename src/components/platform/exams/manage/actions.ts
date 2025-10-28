"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { examCreateSchema, examUpdateSchema, getExamsSchema } from "./validation";
import { arrayToCSV } from "@/lib/csv-export";

export async function createExam(input: z.infer<typeof examCreateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = examCreateSchema.parse(input);
  
  const row = await db.exam.create({
    data: {
      schoolId,
      title: parsed.title,
      description: parsed.description || null,
      classId: parsed.classId,
      subjectId: parsed.subjectId,
      examDate: parsed.examDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      duration: parsed.duration,
      totalMarks: parsed.totalMarks,
      passingMarks: parsed.passingMarks,
      examType: parsed.examType,
      instructions: parsed.instructions || null,
      status: "PLANNED",
    },
  });
  revalidatePath("/exams");
  return { success: true as const, id: row.id as string };
}

export async function updateExam(input: z.infer<typeof examUpdateSchema>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const parsed = examUpdateSchema.parse(input);
  const { id, ...rest } = parsed;
  const data: Record<string, unknown> = {};
  
  if (typeof rest.title !== "undefined") data.title = rest.title;
  if (typeof rest.description !== "undefined") data.description = rest.description || null;
  if (typeof rest.classId !== "undefined") data.classId = rest.classId;
  if (typeof rest.subjectId !== "undefined") data.subjectId = rest.subjectId;
  if (typeof rest.examDate !== "undefined") data.examDate = rest.examDate;
  if (typeof rest.startTime !== "undefined") data.startTime = rest.startTime;
  if (typeof rest.endTime !== "undefined") data.endTime = rest.endTime;
  if (typeof rest.duration !== "undefined") data.duration = rest.duration;
  if (typeof rest.totalMarks !== "undefined") data.totalMarks = rest.totalMarks;
  if (typeof rest.passingMarks !== "undefined") data.passingMarks = rest.passingMarks;
  if (typeof rest.examType !== "undefined") data.examType = rest.examType;
  if (typeof rest.instructions !== "undefined") data.instructions = rest.instructions || null;
  
  await db.exam.updateMany({ where: { id, schoolId }, data });
  revalidatePath("/exams");
  return { success: true as const };
}

export async function deleteExam(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  await db.exam.deleteMany({ where: { id, schoolId } });
  revalidatePath("/exams");
  return { success: true as const };
}

// Reads
export async function getExam(input: { id: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { id } = z.object({ id: z.string().min(1) }).parse(input);
  const e = await db.exam.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      schoolId: true,
      title: true,
      description: true,
      classId: true,
      subjectId: true,
      examDate: true,
      startTime: true,
      endTime: true,
      duration: true,
      totalMarks: true,
      passingMarks: true,
      examType: true,
      instructions: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return { exam: e as null | Record<string, unknown> };
}

export async function getExams(input: Partial<z.infer<typeof getExamsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const sp = getExamsSchema.parse(input ?? {});
  const where: Record<string, unknown> = {
    schoolId,
    ...(sp.title
      ? { title: { contains: sp.title, mode: "insensitive" } }
      : {}),
    ...(sp.classId
      ? { classId: sp.classId }
      : {}),
    ...(sp.subjectId
      ? { subjectId: sp.subjectId }
      : {}),
    ...(sp.examType
      ? { examType: sp.examType }
      : {}),
    ...(sp.status
      ? { status: sp.status }
      : {}),
    ...(sp.examDate
      ? { examDate: new Date(sp.examDate) }
      : {}),
  };
  const skip = (sp.page - 1) * sp.perPage;
  const take = sp.perPage;
  const orderBy = sp.sort && Array.isArray(sp.sort) && sp.sort.length
    ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
    : [{ examDate: "desc" }, { startTime: "asc" }];
  const [rows, count] = await Promise.all([
    db.exam.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        class: {
          select: {
            name: true
          }
        },
        subject: {
          select: {
            subjectName: true
          }
        }
      }
    }),
    db.exam.count({ where }),
  ]);
  const mapped = rows.map((e) => ({
    id: e.id as string,
    title: e.title as string,
    className: (e.class as any)?.name || "Unknown",
    subjectName: (e.subject as any)?.subjectName || "Unknown",
    examDate: (e.examDate as Date).toISOString(),
    startTime: e.startTime as string,
    endTime: e.endTime as string,
    duration: e.duration as number,
    totalMarks: e.totalMarks as number,
    examType: e.examType as string,
    status: e.status as string,
    createdAt: (e.createdAt as Date).toISOString(),
  }));
  return { rows: mapped, total: count as number };
}

// Marks Entry Actions
export async function getExamWithStudents(input: { examId: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { examId } = z.object({ examId: z.string().min(1) }).parse(input);

  const exam = await db.exam.findFirst({
    where: { id: examId, schoolId },
    include: {
      class: {
        include: {
          studentClasses: {
            include: {
              student: {
                select: {
                  id: true,
                  givenName: true,
                  middleName: true,
                  surname: true,
                  studentId: true,
                },
              },
            },
          },
        },
      },
      examResults: true,
    },
  });

  if (!exam) return { exam: null, students: [] };

  const students = exam.class.studentClasses.map((sc) => {
    const result = exam.examResults.find((r) => r.studentId === sc.student.id);
    return {
      id: sc.student.id,
      studentId: sc.student.studentId,
      name: `${sc.student.givenName} ${sc.student.middleName || ""} ${sc.student.surname}`.trim(),
      marksObtained: result?.marksObtained ?? null,
      isAbsent: result?.isAbsent ?? false,
      resultId: result?.id ?? null,
    };
  });

  return {
    exam: {
      id: exam.id,
      title: exam.title,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      className: exam.class.name,
    },
    students,
  };
}

export async function enterMarks(input: {
  examId: string;
  marks: Array<{ studentId: string; marksObtained: number | null; isAbsent: boolean }>;
}) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const schema = z.object({
    examId: z.string().min(1),
    marks: z.array(
      z.object({
        studentId: z.string().min(1),
        marksObtained: z.number().min(0).nullable(),
        isAbsent: z.boolean(),
      })
    ),
  });

  const parsed = schema.parse(input);

  // Get exam details for validation
  const exam = await db.exam.findFirst({
    where: { id: parsed.examId, schoolId },
    select: { totalMarks: true, passingMarks: true },
  });

  if (!exam) throw new Error("Exam not found");

  // Get grade boundaries
  const gradeBoundaries = await db.gradeBoundary.findMany({
    where: { schoolId },
    orderBy: { minScore: "desc" },
  });

  // Calculate grade based on percentage
  const calculateGrade = (percentage: number): string | null => {
    if (gradeBoundaries.length === 0) return null;
    for (const boundary of gradeBoundaries) {
      const min = Number(boundary.minScore);
      const max = Number(boundary.maxScore);
      if (percentage >= min && percentage <= max) {
        return boundary.grade;
      }
    }
    return null;
  };

  // Upsert each result
  const results = await Promise.all(
    parsed.marks.map(async (mark) => {
      const marksObtained = mark.isAbsent ? 0 : mark.marksObtained ?? 0;
      const percentage = (marksObtained / exam.totalMarks) * 100;
      const grade = mark.isAbsent ? null : calculateGrade(percentage);

      return db.examResult.upsert({
        where: {
          examId_studentId: {
            examId: parsed.examId,
            studentId: mark.studentId,
          },
        },
        create: {
          schoolId,
          examId: parsed.examId,
          studentId: mark.studentId,
          marksObtained,
          totalMarks: exam.totalMarks,
          percentage,
          grade,
          isAbsent: mark.isAbsent,
        },
        update: {
          marksObtained,
          percentage,
          grade,
          isAbsent: mark.isAbsent,
        },
      });
    })
  );

  revalidatePath("/exams");
  return { success: true as const, count: results.length };
}

export async function getExamAnalytics(input: { examId: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { examId } = z.object({ examId: z.string().min(1) }).parse(input);

  const [exam, results] = await Promise.all([
    db.exam.findFirst({
      where: { id: examId, schoolId },
      select: {
        id: true,
        title: true,
        totalMarks: true,
        passingMarks: true,
      },
    }),
    db.examResult.findMany({
      where: { examId, schoolId },
      select: {
        marksObtained: true,
        percentage: true,
        grade: true,
        isAbsent: true,
      },
    }),
  ]);

  if (!exam) return { analytics: null };

  const totalStudents = results.length;
  const presentStudents = results.filter((r) => !r.isAbsent).length;
  const absentStudents = results.filter((r) => r.isAbsent).length;

  const presentResults = results.filter((r) => !r.isAbsent);
  const passedStudents = presentResults.filter((r) => r.marksObtained >= exam.passingMarks).length;
  const failedStudents = presentResults.filter((r) => r.marksObtained < exam.passingMarks).length;

  const averageMarks =
    presentResults.length > 0
      ? presentResults.reduce((sum, r) => sum + r.marksObtained, 0) / presentResults.length
      : 0;

  const averagePercentage =
    presentResults.length > 0
      ? presentResults.reduce((sum, r) => sum + r.percentage, 0) / presentResults.length
      : 0;

  const highestMarks = presentResults.length > 0 ? Math.max(...presentResults.map((r) => r.marksObtained)) : 0;
  const lowestMarks = presentResults.length > 0 ? Math.min(...presentResults.map((r) => r.marksObtained)) : 0;

  // Grade distribution
  const gradeDistribution = presentResults.reduce((acc, r) => {
    if (r.grade) {
      acc[r.grade] = (acc[r.grade] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    analytics: {
      examTitle: exam.title,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      totalStudents,
      presentStudents,
      absentStudents,
      passedStudents,
      failedStudents,
      passPercentage: presentStudents > 0 ? (passedStudents / presentStudents) * 100 : 0,
      averageMarks: Math.round(averageMarks * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      highestMarks,
      lowestMarks,
      gradeDistribution,
    },
  };
}

export async function getExamResults(input: { examId: string }) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");
  const { examId } = z.object({ examId: z.string().min(1) }).parse(input);

  const results = await db.examResult.findMany({
    where: { examId, schoolId },
    include: {
      student: {
        select: {
          id: true,
          studentId: true,
          givenName: true,
          middleName: true,
          surname: true,
        },
      },
    },
    orderBy: { marksObtained: "desc" },
  });

  return {
    results: results.map((r) => ({
      id: r.id,
      studentId: r.student.studentId,
      studentName: `${r.student.givenName} ${r.student.middleName || ""} ${r.student.surname}`.trim(),
      marksObtained: r.marksObtained,
      totalMarks: r.totalMarks,
      percentage: r.percentage,
      grade: r.grade,
      isAbsent: r.isAbsent,
      remarks: r.remarks,
    })),
  };
}

/**
 * Export exams to CSV format
 */
export async function getExamsCSV(input?: Partial<z.infer<typeof getExamsSchema>>) {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing school context");

  const sp = getExamsSchema.parse(input ?? {});

  // Build where clause with filters
  const where: Record<string, unknown> = {
    schoolId,
    ...(sp.title ? { title: { contains: sp.title, mode: "insensitive" } } : {}),
    ...(sp.classId ? { classId: sp.classId } : {}),
    ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
    ...(sp.examType ? { examType: sp.examType } : {}),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.examDate ? { examDate: new Date(sp.examDate) } : {}),
  };

  // Fetch ALL exams matching filters (no pagination for export)
  const exams = await db.exam.findMany({
    where,
    include: {
      class: {
        select: {
          name: true,
        },
      },
      subject: {
        select: {
          subjectName: true,
        },
      },
      _count: {
        select: {
          results: true,
        },
      },
    },
    orderBy: [{ examDate: "desc" }, { startTime: "asc" }],
  });

  // Transform data for CSV export
  const exportData = exams.map((exam) => ({
    examId: exam.id,
    title: exam.title || "",
    description: exam.description || "",
    class: exam.class?.name || "",
    subject: exam.subject?.subjectName || "",
    examDate: exam.examDate ? new Date(exam.examDate).toISOString().split("T")[0] : "",
    startTime: exam.startTime || "",
    endTime: exam.endTime || "",
    duration: exam.duration || 0,
    totalMarks: exam.totalMarks || 0,
    passingMarks: exam.passingMarks || 0,
    examType: exam.examType || "",
    status: exam.status || "",
    resultsEntered: exam._count.results,
    createdAt: new Date(exam.createdAt).toISOString().split("T")[0],
  }));

  // Define CSV columns
  const columns = [
    { key: "examId" as const, label: "Exam ID" },
    { key: "title" as const, label: "Title" },
    { key: "description" as const, label: "Description" },
    { key: "class" as const, label: "Class" },
    { key: "subject" as const, label: "Subject" },
    { key: "examDate" as const, label: "Exam Date" },
    { key: "startTime" as const, label: "Start Time" },
    { key: "endTime" as const, label: "End Time" },
    { key: "duration" as const, label: "Duration (min)" },
    { key: "totalMarks" as const, label: "Total Marks" },
    { key: "passingMarks" as const, label: "Passing Marks" },
    { key: "examType" as const, label: "Exam Type" },
    { key: "status" as const, label: "Status" },
    { key: "resultsEntered" as const, label: "Results Entered" },
    { key: "createdAt" as const, label: "Created Date" },
  ];

  return arrayToCSV(exportData, { columns });
}
