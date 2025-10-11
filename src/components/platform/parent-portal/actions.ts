"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

// Helper to get guardian's children
async function getGuardianChildren(guardianId: string, schoolId: string) {
  const studentGuardians = await db.studentGuardian.findMany({
    where: { guardianId, schoolId },
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
  });

  return studentGuardians.map((sg) => ({
    id: sg.student.id,
    studentId: sg.student.studentId,
    name: `${sg.student.givenName} ${sg.student.middleName || ""} ${sg.student.surname}`.trim(),
  }));
}

// Get child's grades/exam results
export async function getChildGrades(input: { studentId: string }) {
  const session = await auth();
  const guardianId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!guardianId || !schoolId) {
    throw new Error("Missing guardian context");
  }

  const { studentId } = z.object({ studentId: z.string().min(1) }).parse(input);

  // Verify this student belongs to this guardian
  const relationship = await db.studentGuardian.findFirst({
    where: { guardianId, studentId, schoolId },
  });

  if (!relationship) {
    throw new Error("Unauthorized access to student data");
  }

  // Get exam results for the student
  const examResults = await db.examResult.findMany({
    where: { studentId, schoolId },
    include: {
      exam: {
        select: {
          title: true,
          examDate: true,
          examType: true,
          totalMarks: true,
          subject: {
            select: {
              subjectName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get class scores for the student
  const classScores = await db.studentClass.findMany({
    where: { studentId, schoolId },
    include: {
      class: {
        select: {
          name: true,
          subject: {
            select: {
              subjectName: true,
            },
          },
        },
      },
    },
  });

  const grades = {
    examResults: examResults.map((result) => ({
      id: result.id,
      examTitle: result.exam.title,
      subjectName: result.exam.subject.subjectName,
      examDate: result.exam.examDate.toISOString(),
      examType: result.exam.examType,
      marksObtained: result.marksObtained,
      totalMarks: result.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
      isAbsent: result.isAbsent,
    })),
    classScores: classScores.map((sc) => ({
      id: sc.id,
      className: sc.class.name,
      subjectName: sc.class.subject.subjectName,
      score: sc.score ? Number(sc.score) : null,
    })),
  };

  return { grades };
}

// Get child's assignments
export async function getChildAssignments(input: { studentId: string }) {
  const session = await auth();
  const guardianId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!guardianId || !schoolId) {
    throw new Error("Missing guardian context");
  }

  const { studentId } = z.object({ studentId: z.string().min(1) }).parse(input);

  // Verify this student belongs to this guardian
  const relationship = await db.studentGuardian.findFirst({
    where: { guardianId, studentId, schoolId },
  });

  if (!relationship) {
    throw new Error("Unauthorized access to student data");
  }

  // Get student's classes
  const studentClasses = await db.studentClass.findMany({
    where: { studentId, schoolId },
    select: { classId: true },
  });

  const classIds = studentClasses.map((sc) => sc.classId);

  // Get assignments for student's classes
  const assignments = await db.assignment.findMany({
    where: {
      classId: { in: classIds },
      schoolId,
    },
    include: {
      class: {
        select: {
          name: true,
          subject: {
            select: {
              subjectName: true,
            },
          },
        },
      },
      submissions: {
        where: { studentId },
        select: {
          id: true,
          submittedAt: true,
          status: true,
          grade: true,
        },
      },
    },
    orderBy: { dueDate: "desc" },
    take: 50,
  });

  return {
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      className: assignment.class.name,
      subjectName: assignment.class.subject.subjectName,
      assignedDate: assignment.assignedDate.toISOString(),
      dueDate: assignment.dueDate.toISOString(),
      totalPoints: assignment.totalPoints,
      submission: assignment.submissions[0]
        ? {
            id: assignment.submissions[0].id,
            submittedAt: assignment.submissions[0].submittedAt?.toISOString(),
            status: assignment.submissions[0].status,
            grade: assignment.submissions[0].grade ? Number(assignment.submissions[0].grade) : null,
          }
        : null,
    })),
  };
}

// Get child's timetable
export async function getChildTimetable(input: { studentId: string }) {
  const session = await auth();
  const guardianId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!guardianId || !schoolId) {
    throw new Error("Missing guardian context");
  }

  const { studentId } = z.object({ studentId: z.string().min(1) }).parse(input);

  // Verify this student belongs to this guardian
  const relationship = await db.studentGuardian.findFirst({
    where: { guardianId, studentId, schoolId },
  });

  if (!relationship) {
    throw new Error("Unauthorized access to student data");
  }

  // Get student's classes
  const studentClasses = await db.studentClass.findMany({
    where: { studentId, schoolId },
    select: { classId: true },
  });

  const classIds = studentClasses.map((sc) => sc.classId);

  // Get timetable entries for student's classes
  const timetableEntries = await db.timetable.findMany({
    where: {
      classId: { in: classIds },
      schoolId,
    },
    include: {
      class: {
        select: {
          name: true,
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
          classroom: {
            select: {
              roomNumber: true,
            },
          },
        },
      },
      period: {
        select: {
          name: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { period: { startTime: "asc" } }],
  });

  return {
    timetable: timetableEntries.map((entry) => ({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      periodName: entry.period.name,
      startTime: entry.period.startTime.toISOString(),
      endTime: entry.period.endTime.toISOString(),
      className: entry.class.name,
      subjectName: entry.class.subject.subjectName,
      teacherName: `${entry.class.teacher.givenName} ${entry.class.teacher.surname}`,
      roomNumber: entry.class.classroom.roomNumber,
    })),
  };
}

// Get guardian's children
export async function getMyChildren() {
  const session = await auth();
  const guardianId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!guardianId || !schoolId) {
    throw new Error("Missing guardian context");
  }

  const children = await getGuardianChildren(guardianId, schoolId);

  return { children };
}

// Get child overview (grades summary + attendance)
export async function getChildOverview(input: { studentId: string }) {
  const session = await auth();
  const guardianId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!guardianId || !schoolId) {
    throw new Error("Missing guardian context");
  }

  const { studentId } = z.object({ studentId: z.string().min(1) }).parse(input);

  // Verify this student belongs to this guardian
  const relationship = await db.studentGuardian.findFirst({
    where: { guardianId, studentId, schoolId },
  });

  if (!relationship) {
    throw new Error("Unauthorized access to student data");
  }

  // Get student details
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    select: {
      id: true,
      studentId: true,
      givenName: true,
      middleName: true,
      surname: true,
      gender: true,
      dateOfBirth: true,
    },
  });

  // Get recent exam results
  const recentExams = await db.examResult.findMany({
    where: { studentId, schoolId },
    include: {
      exam: {
        select: {
          title: true,
          subject: {
            select: {
              subjectName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get attendance summary
  const totalDays = await db.attendance.count({
    where: { studentId, schoolId },
  });

  const presentDays = await db.attendance.count({
    where: { studentId, schoolId, status: "PRESENT" },
  });

  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Calculate average score
  const examResults = await db.examResult.findMany({
    where: { studentId, schoolId, isAbsent: false },
    select: { percentage: true },
  });

  const averageScore =
    examResults.length > 0
      ? examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length
      : 0;

  return {
    student: student
      ? {
          id: student.id,
          studentId: student.studentId,
          name: `${student.givenName} ${student.middleName || ""} ${student.surname}`.trim(),
          gender: student.gender,
          dateOfBirth: student.dateOfBirth.toISOString(),
        }
      : null,
    recentExams: recentExams.map((result) => ({
      examTitle: result.exam.title,
      subjectName: result.exam.subject.subjectName,
      percentage: result.percentage,
      grade: result.grade,
    })),
    attendance: {
      totalDays,
      presentDays,
      percentage: Math.round(attendancePercentage * 100) / 100,
    },
    averageScore: Math.round(averageScore * 100) / 100,
  };
}
