/**
 * Classes Seed Module
 * Creates classes, enrollments, assignments
 */

import { AssessmentStatus, AssessmentType, SubmissionStatus, AttendanceStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, ClassRef, TeacherRef, StudentRef, SubjectRef, PeriodRef, ClassroomRef } from "./types";

export async function seedClasses(
  prisma: SeedPrisma,
  schoolId: string,
  termId: string,
  periods: PeriodRef[],
  classrooms: ClassroomRef[],
  subjects: SubjectRef[],
  teachers: TeacherRef[],
  students: StudentRef[]
): Promise<{ classes: ClassRef[] }> {
  console.log("📝 Creating classes and enrollments...");

  const targetSubjects = ["Mathematics", "Arabic Language", "English Language", "Physics", "Chemistry", "Biology"];
  const chosenSubjects = subjects.filter((s) => targetSubjects.includes(s.subjectName));
  const sectionLabels = ["A", "B", "C"];
  const gradeLabels = ["10", "11", "12"];
  const classes: ClassRef[] = [];

  for (const subject of chosenSubjects) {
    for (const grade of gradeLabels) {
      for (let si = 0; si < sectionLabels.length; si++) {
        const teacherIndex = (gradeLabels.indexOf(grade) * chosenSubjects.length + chosenSubjects.indexOf(subject) + si) % teachers.length;
        const teacher = teachers[teacherIndex];
        const startPeriod = periods[(si * 2) % periods.length];
        const endPeriod = periods[((si * 2) + 1) % periods.length];
        const classroom = classrooms[(si + gradeLabels.indexOf(grade)) % classrooms.length];

        const className = `${subject.subjectName} Grade ${grade} ${sectionLabels[si]}`;
        const clazz = await prisma.class.create({
          data: {
            schoolId,
            name: className,
            subjectId: subject.id,
            teacherId: teacher.id,
            termId,
            startPeriodId: startPeriod.id,
            endPeriodId: endPeriod.id,
            classroomId: classroom.id,
          },
        });
        classes.push({ id: clazz.id, name: className });

        // Enroll students
        const gradeIndex = gradeLabels.indexOf(grade);
        const startStudent = gradeIndex * 30 + si * 10;
        const endStudent = Math.min(startStudent + 12, students.length);
        const enrollStudents = students.slice(startStudent, endStudent);

        await prisma.studentClass.createMany({
          data: enrollStudents.map((s) => ({ schoolId, studentId: s.id, classId: clazz.id })),
          skipDuplicates: true,
        });

        // Assignment
        const assignment = await prisma.assignment.create({
          data: {
            schoolId,
            classId: clazz.id,
            title: `${subject.subjectName} Homework - Week 1`,
            description: faker.lorem.sentences({ min: 1, max: 3 }),
            type: AssessmentType.HOMEWORK,
            status: AssessmentStatus.PUBLISHED,
            totalPoints: "100.00",
            weight: "10.00",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            publishDate: new Date(),
          },
        });

        // Submissions
        for (const s of enrollStudents) {
          await prisma.assignmentSubmission.create({
            data: {
              schoolId,
              assignmentId: assignment.id,
              studentId: s.id,
              status: SubmissionStatus.SUBMITTED,
              attachments: [],
              content: faker.lorem.paragraph(),
            },
          });
        }
      }
    }
  }

  // Score ranges
  await prisma.scoreRange.createMany({
    data: [
      { schoolId, minScore: "90.00", maxScore: "100.00", grade: "A" },
      { schoolId, minScore: "80.00", maxScore: "89.99", grade: "B" },
      { schoolId, minScore: "70.00", maxScore: "79.99", grade: "C" },
      { schoolId, minScore: "60.00", maxScore: "69.99", grade: "D" },
      { schoolId, minScore: "0.00", maxScore: "59.99", grade: "F" },
    ],
    skipDuplicates: true,
  });

  // Attendance
  if (classes[0]) {
    const today = new Date();
    const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const attendanceRecords = students.slice(0, 50).map((s, index) => ({
      schoolId,
      studentId: s.id,
      classId: classes[index % classes.length].id,
      date: dateOnly,
      status: index % 5 === 0 ? AttendanceStatus.ABSENT : index % 7 === 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
    }));

    await prisma.attendance.createMany({
      data: attendanceRecords,
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ Created: ${classes.length} classes with enrollments and assignments\n`);

  return { classes };
}
