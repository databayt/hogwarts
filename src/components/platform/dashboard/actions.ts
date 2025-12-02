"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

// Get teacher lab data
export async function getTeacherDashboardData() {
  const session = await auth();
  const userId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!userId || !schoolId) {
    throw new Error("Missing user context");
  }

  // Find teacher record
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  });

  if (!teacher) {
    return {
      todaysClasses: [],
      pendingGrading: 0,
      attendanceDue: 0,
      totalStudents: 0,
      pendingAssignments: [],
      classPerformance: [],
      upcomingDeadlines: [],
    };
  }

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = today.getDay();

  // Fetch today's classes from timetable
  const todaysClasses = await db.timetable.findMany({
    where: {
      schoolId,
      dayOfWeek: dayOfWeek,
      class: {
        teacherId: teacher.id,
      },
    },
    include: {
      class: {
        select: {
          name: true,
          _count: {
            select: {
              studentClasses: true,
            },
          },
        },
      },
      classroom: {
        select: {
          roomName: true,
        },
      },
      period: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: {
      period: {
        startTime: "asc",
      },
    },
  });

  // Get total students across all teacher's classes
  const teacherClasses = await db.class.findMany({
    where: {
      teacherId: teacher.id,
      schoolId,
    },
    select: {
      _count: {
        select: {
          studentClasses: true,
        },
      },
    },
  });

  const totalStudents = teacherClasses.reduce(
    (sum, cls) => sum + cls._count.studentClasses,
    0
  );

  // Get assignments needing grading (submissions that are SUBMITTED status)
  const pendingGradingCount = await db.assignmentSubmission.count({
    where: {
      schoolId,
      status: "SUBMITTED",
      assignment: {
        class: {
          teacherId: teacher.id,
        },
      },
    },
  });

  // Get classes needing attendance for today
  const attendanceDueCount = await db.class.count({
    where: {
      teacherId: teacher.id,
      schoolId,
      NOT: {
        studentClasses: {
          every: {
            student: {
              attendances: {
                some: {
                  date: {
                    gte: today,
                    lt: tomorrow,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Get pending assignments with submissions
  const pendingAssignments = await db.assignment.findMany({
    where: {
      schoolId,
      status: "PUBLISHED",
      class: {
        teacherId: teacher.id,
      },
    },
    include: {
      class: {
        select: {
          name: true,
        },
      },
      submissions: {
        where: {
          status: "SUBMITTED",
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
  });

  // Get class performance (average of exam results per class)
  const classes = await db.class.findMany({
    where: {
      teacherId: teacher.id,
      schoolId,
    },
    include: {
      exams: {
        include: {
          results: {
            select: {
              percentage: true,
            },
          },
        },
      },
    },
  });

  const classPerformance = classes.map((cls) => {
    const allResults = cls.exams.flatMap((exam) => exam.results);
    const average =
      allResults.length > 0
        ? allResults.reduce((sum, r) => sum + r.percentage, 0) / allResults.length
        : 0;

    return {
      className: cls.name,
      average: Math.round(average * 100) / 100,
    };
  });

  // Get upcoming exam deadlines for teacher's classes
  const upcomingExams = await db.exam.findMany({
    where: {
      schoolId,
      class: {
        teacherId: teacher.id,
      },
      examDate: {
        gte: today,
      },
      status: "PLANNED",
    },
    include: {
      class: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      examDate: "asc",
    },
    take: 5,
  });

  const upcomingDeadlines = upcomingExams.map((exam) => ({
    id: exam.id,
    task: `${exam.title} - ${exam.class.name}`,
    dueDate: exam.examDate.toISOString(),
    type: "exam" as const,
  }));

  return {
    todaysClasses: todaysClasses.map((entry) => ({
      id: entry.id,
      name: entry.class.name,
      time: `${new Date(entry.period.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(entry.period.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      room: entry.classroom?.roomName || "TBA",
      students: entry.class._count.studentClasses,
    })),
    pendingGrading: pendingGradingCount,
    attendanceDue: attendanceDueCount,
    totalStudents,
    pendingAssignments: pendingAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      className: assignment.class.name,
      dueDate: assignment.dueDate.toISOString(),
      submissionsCount: assignment.submissions.length,
    })),
    classPerformance,
    upcomingDeadlines,
  };
}

// Get student lab data
export async function getStudentDashboardData() {
  const session = await auth();
  const userId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!userId || !schoolId) {
    throw new Error("Missing user context");
  }

  // Find student record
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  });

  if (!student) {
    return {
      todaysTimetable: [],
      upcomingAssignments: [],
      recentGrades: [],
      announcements: [],
      attendanceSummary: {
        totalDays: 0,
        presentDays: 0,
        percentage: 0,
      },
    };
  }

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = today.getDay();

  // Get student's classes
  const studentClasses = await db.studentClass.findMany({
    where: {
      studentId: student.id,
      schoolId,
    },
    select: {
      classId: true,
    },
  });

  const classIds = studentClasses.map((sc) => sc.classId);

  // Get today's timetable
  const todaysTimetable = await db.timetable.findMany({
    where: {
      schoolId,
      dayOfWeek: dayOfWeek,
      classId: {
        in: classIds,
      },
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
        },
      },
      classroom: {
        select: {
          roomName: true,
        },
      },
      period: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: {
      period: {
        startTime: "asc",
      },
    },
  });

  // Get upcoming assignments
  const upcomingAssignments = await db.assignment.findMany({
    where: {
      schoolId,
      classId: {
        in: classIds,
      },
      dueDate: {
        gte: today,
      },
      status: "PUBLISHED",
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
        where: {
          studentId: student.id,
        },
        select: {
          status: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
  });

  // Get recent exam results
  const recentGrades = await db.examResult.findMany({
    where: {
      studentId: student.id,
      schoolId,
    },
    include: {
      exam: {
        select: {
          title: true,
          totalMarks: true,
          subject: {
            select: {
              subjectName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get announcements
  const announcements = await db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      OR: [
        { scope: "school" },
        {
          scope: "class",
          classId: {
            in: classIds,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get attendance summary
  const totalDays = await db.attendance.count({
    where: {
      studentId: student.id,
      schoolId,
    },
  });

  const presentDays = await db.attendance.count({
    where: {
      studentId: student.id,
      schoolId,
      status: "PRESENT",
    },
  });

  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return {
    todaysTimetable: todaysTimetable.map((entry) => ({
      id: entry.id,
      subject: entry.class.subject.subjectName,
      className: entry.class.name,
      teacher: `${entry.class.teacher.givenName} ${entry.class.teacher.surname}`,
      room: entry.classroom?.roomName || "TBA",
      startTime: entry.period.startTime.toISOString(),
      endTime: entry.period.endTime.toISOString(),
    })),
    upcomingAssignments: upcomingAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.class.subject.subjectName,
      className: assignment.class.name,
      dueDate: assignment.dueDate.toISOString(),
      status: assignment.submissions[0]?.status || "NOT_SUBMITTED",
      totalPoints: assignment.totalPoints,
    })),
    recentGrades: recentGrades.map((result) => ({
      id: result.id,
      examTitle: result.exam.title,
      subject: result.exam.subject.subjectName,
      marksObtained: result.marksObtained,
      totalMarks: result.exam.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
    })),
    announcements: announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.titleEn || announcement.titleAr || "",
      body: announcement.bodyEn || announcement.bodyAr || "",
      createdAt: announcement.createdAt.toISOString(),
    })),
    attendanceSummary: {
      totalDays,
      presentDays,
      percentage: Math.round(attendancePercentage * 100) / 100,
    },
  };
}

// Get parent lab data
export async function getParentDashboardData() {
  const session = await auth();
  const guardianId = session?.user?.id;
  const schoolId = session?.user?.schoolId;

  if (!guardianId || !schoolId) {
    throw new Error("Missing guardian context");
  }

  // Get guardian's children
  const studentGuardians = await db.studentGuardian.findMany({
    where: {
      guardianId,
      schoolId,
    },
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

  const children = studentGuardians.map((sg) => ({
    id: sg.student.id,
    studentId: sg.student.studentId,
    name: `${sg.student.givenName} ${sg.student.middleName || ""} ${sg.student.surname}`.trim(),
  }));

  // Get data for first child (or all children)
  const firstChild = children[0];
  if (!firstChild) {
    return {
      children: [],
      recentGrades: [],
      upcomingAssignments: [],
      attendanceSummary: {
        totalDays: 0,
        presentDays: 0,
        percentage: 0,
      },
      announcements: [],
    };
  }

  // Get recent exam results for first child
  const recentGrades = await db.examResult.findMany({
    where: {
      studentId: firstChild.id,
      schoolId,
    },
    include: {
      exam: {
        select: {
          title: true,
          totalMarks: true,
          subject: {
            select: {
              subjectName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  // Get student's classes for assignments
  const studentClasses = await db.studentClass.findMany({
    where: {
      studentId: firstChild.id,
      schoolId,
    },
    select: {
      classId: true,
    },
  });

  const classIds = studentClasses.map((sc) => sc.classId);

  // Get upcoming assignments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAssignments = await db.assignment.findMany({
    where: {
      schoolId,
      classId: {
        in: classIds,
      },
      dueDate: {
        gte: today,
      },
      status: "PUBLISHED",
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
        where: {
          studentId: firstChild.id,
        },
        select: {
          status: true,
          score: true,
        },
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    take: 5,
  });

  // Get attendance summary
  const totalDays = await db.attendance.count({
    where: {
      studentId: firstChild.id,
      schoolId,
    },
  });

  const presentDays = await db.attendance.count({
    where: {
      studentId: firstChild.id,
      schoolId,
      status: "PRESENT",
    },
  });

  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Get announcements
  const announcements = await db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      OR: [
        { scope: "school" },
        {
          scope: "class",
          classId: {
            in: classIds,
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return {
    children,
    recentGrades: recentGrades.map((result) => ({
      id: result.id,
      examTitle: result.exam.title,
      subject: result.exam.subject.subjectName,
      marksObtained: result.marksObtained,
      totalMarks: result.exam.totalMarks,
      percentage: result.percentage,
      grade: result.grade,
    })),
    upcomingAssignments: upcomingAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.class.subject.subjectName,
      className: assignment.class.name,
      dueDate: assignment.dueDate.toISOString(),
      status: assignment.submissions[0]?.status || "NOT_SUBMITTED",
      score: assignment.submissions[0]?.score ? Number(assignment.submissions[0].score) : null,
    })),
    attendanceSummary: {
      totalDays,
      presentDays,
      percentage: Math.round(attendancePercentage * 100) / 100,
    },
    announcements: announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.titleEn || announcement.titleAr || "",
      body: announcement.bodyEn || announcement.bodyAr || "",
      createdAt: announcement.createdAt.toISOString(),
    })),
  };
}
