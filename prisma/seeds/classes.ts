/**
 * Classes Seed Module - Realistic K-12 School (100 Students)
 * Creates homeroom classes for each grade level and subject-specific classes
 *
 * Class Structure:
 * - 14 homeroom classes (one per grade level KG1 - Grade 12)
 * - Subject-specific classes linked to appropriate teachers
 * - Student enrollments based on grade level
 * - Assignments and initial attendance
 *
 * Uses UPSERT + skipDuplicates patterns - safe to run multiple times
 */

import { AssessmentStatus, AssessmentType, SubmissionStatus, AttendanceStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, ClassRef, TeacherRef, StudentRef, SubjectRef, PeriodRef, ClassroomRef, YearLevelRef } from "./types";
import { CURRICULUM, TEACHER_DATA, STUDENT_DISTRIBUTION, findSubjectAr } from "./constants";

// Map teacher specialties to subjects
const SPECIALTY_SUBJECT_MAP: Record<string, string[]> = {
  "KG Teacher": ["Arabic", "English", "Mathematics", "Islamic Studies", "Art", "Physical Education", "Music"],
  "Primary Arabic": ["Arabic", "Reading", "Writing"],
  "Primary English": ["English"],
  "Primary Math": ["Mathematics"],
  "Primary Science": ["Science"],
  "Primary Islamic": ["Islamic Studies", "Quran"],
  "Primary Social": ["Social Studies"],
  "Mathematics": ["Mathematics"],
  "Physics": ["Physics"],
  "Chemistry": ["Chemistry"],
  "Biology": ["Biology"],
  "Arabic": ["Arabic"],
  "English": ["English"],
  "French": ["French"],
  "Geography": ["Geography"],
  "History": ["History"],
  "Islamic Studies": ["Islamic Studies", "Quran"],
  "Computer Science": ["Computer Science"],
  "Physical Education": ["Physical Education"],
  "Art": ["Art", "Music"],
};

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
  console.log("📝 Creating classes for all grade levels...");

  const classes: ClassRef[] = [];

  // Get year levels to map students
  const yearLevels = await prisma.yearLevel.findMany({
    where: { schoolId },
    orderBy: { levelOrder: "asc" },
  });

  // Get student-level assignments
  const studentLevels = await prisma.studentYearLevel.findMany({
    where: { schoolId },
    select: { studentId: true, levelId: true },
  });

  // Create level-to-students map
  const levelStudentMap = new Map<string, string[]>();
  for (const sl of studentLevels) {
    const list = levelStudentMap.get(sl.levelId) || [];
    list.push(sl.studentId);
    levelStudentMap.set(sl.levelId, list);
  }

  // Get teacher data for specialty matching
  const teacherRecords = await prisma.teacher.findMany({
    where: { schoolId },
    select: { id: true, givenName: true, surname: true },
  });

  // Create teacher-specialty map (using English specialty for database matching)
  const teacherSpecialtyMap = new Map<string, string>();
  const teacherLevelMap = new Map<string, string[]>();

  for (const [index, t] of TEACHER_DATA.entries()) {
    const teacher = teacherRecords[index];
    if (teacher) {
      teacherSpecialtyMap.set(teacher.id, t.specialtyEn);
      teacherLevelMap.set(teacher.id, t.levels);
    }
  }

  // Filter teaching periods only
  const teachingPeriods = periods.filter((p, i) => i !== 2 && i !== 6); // Exclude Break and Lunch

  // Create classes for each grade level
  let classIndex = 0;

  for (const level of yearLevels) {
    const levelName = level.levelName;
    const curriculum = CURRICULUM[levelName as keyof typeof CURRICULUM] || [];

    if (curriculum.length === 0) {
      console.warn(`   ⚠️ No curriculum for: ${levelName}`);
      continue;
    }

    // Get students in this level
    const levelStudents = levelStudentMap.get(level.id) || [];

    if (levelStudents.length === 0) {
      console.warn(`   ⚠️ No students for: ${levelName}`);
      continue;
    }

    // Find appropriate classroom
    const isKG = levelName.startsWith("KG");
    const isPrimary = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"].includes(levelName);
    const classroomIndex = isKG
      ? classIndex % 2
      : isPrimary
      ? 2 + (classIndex % 6)
      : 8 + (classIndex % 4);
    const classroom = classrooms[Math.min(classroomIndex, classrooms.length - 1)];

    // Create subject classes for this level
    for (const subjectName of curriculum) {
      // Find subject
      const subject = subjects.find((s) => s.subjectName === subjectName);
      if (!subject) continue;

      // Find appropriate teacher for this subject and level
      let assignedTeacher: typeof teacherRecords[0] | undefined;

      for (const teacher of teacherRecords) {
        const specialty = teacherSpecialtyMap.get(teacher.id);
        const levels = teacherLevelMap.get(teacher.id) || [];

        if (!specialty) continue;

        const teachesSubject = SPECIALTY_SUBJECT_MAP[specialty]?.includes(subjectName);
        const teachesLevel = levels.includes(levelName);

        if (teachesSubject && teachesLevel) {
          assignedTeacher = teacher;
          break;
        }
      }

      if (!assignedTeacher) {
        // Fallback: assign any available teacher
        assignedTeacher = teacherRecords[classIndex % teacherRecords.length];
      }

      // Get period assignment
      const periodIndex = classIndex % teachingPeriods.length;
      const startPeriod = teachingPeriods[periodIndex];
      const endPeriod = teachingPeriods[(periodIndex + 1) % teachingPeriods.length];

      // Create class with bilingual names - upsert by schoolId + name
      const className = `${subjectName} - ${levelName}`;
      const subjectAr = findSubjectAr(subjectName);
      const levelAr = await prisma.yearLevel.findFirst({
        where: { schoolId, levelName },
        select: { levelNameAr: true },
      });
      const classNameAr = `${subjectAr} - ${levelAr?.levelNameAr || levelName}`;

      const clazz = await prisma.class.upsert({
        where: { schoolId_name: { schoolId, name: className } },
        update: {
          nameAr: classNameAr,
          subjectId: subject.id,
          teacherId: assignedTeacher.id,
          termId,
          startPeriodId: startPeriod.id,
          endPeriodId: endPeriod.id,
          classroomId: classroom.id,
        },
        create: {
          schoolId,
          name: className,
          nameAr: classNameAr,
          subjectId: subject.id,
          teacherId: assignedTeacher.id,
          termId,
          startPeriodId: startPeriod.id,
          endPeriodId: endPeriod.id,
          classroomId: classroom.id,
        },
      });

      classes.push({ id: clazz.id, name: className });

      // Enroll all students in this level - skipDuplicates
      await prisma.studentClass.createMany({
        data: levelStudents.map((studentId) => ({
          schoolId,
          studentId,
          classId: clazz.id,
        })),
        skipDuplicates: true,
      });

      // Create assignment for core subjects (only if doesn't exist)
      const coreSubjects = ["Arabic", "English", "Mathematics", "Science", "Physics", "Chemistry", "Biology"];
      if (coreSubjects.includes(subjectName)) {
        const assignmentTitle = `${subjectName} Assignment - Week 1`;

        // Check if assignment already exists
        const existingAssignment = await prisma.assignment.findFirst({
          where: { schoolId, classId: clazz.id, title: assignmentTitle },
        });

        if (!existingAssignment) {
          const assignment = await prisma.assignment.create({
            data: {
              schoolId,
              classId: clazz.id,
              title: assignmentTitle,
              description: faker.lorem.sentences({ min: 2, max: 4 }),
              type: AssessmentType.HOMEWORK,
              status: AssessmentStatus.PUBLISHED,
              totalPoints: "100.00",
              weight: "10.00",
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              publishDate: new Date(),
            },
          });

          // Create submissions for some students - upsert by unique constraint
          const submittingStudents = levelStudents.slice(0, Math.ceil(levelStudents.length * 0.8));
          for (const studentId of submittingStudents) {
            await prisma.assignmentSubmission.upsert({
              where: { schoolId_assignmentId_studentId: { schoolId, assignmentId: assignment.id, studentId } },
              update: {
                status: faker.helpers.arrayElement([
                  SubmissionStatus.SUBMITTED,
                  SubmissionStatus.SUBMITTED,
                  SubmissionStatus.GRADED,
                ]),
              },
              create: {
                schoolId,
                assignmentId: assignment.id,
                studentId,
                status: faker.helpers.arrayElement([
                  SubmissionStatus.SUBMITTED,
                  SubmissionStatus.SUBMITTED,
                  SubmissionStatus.GRADED,
                ]),
                attachments: [],
                content: faker.lorem.paragraph(),
                submittedAt: faker.date.recent({ days: 5 }),
              },
            });
          }
        }
      }

      classIndex++;
    }
  }

  // Upsert score ranges by schoolId + grade
  const scoreRanges = [
    { minScore: "90.00", maxScore: "100.00", grade: "A" },
    { minScore: "80.00", maxScore: "89.99", grade: "B" },
    { minScore: "70.00", maxScore: "79.99", grade: "C" },
    { minScore: "60.00", maxScore: "69.99", grade: "D" },
    { minScore: "0.00", maxScore: "59.99", grade: "F" },
  ];

  for (const range of scoreRanges) {
    await prisma.scoreRange.upsert({
      where: { schoolId_grade: { schoolId, grade: range.grade } },
      update: { minScore: range.minScore, maxScore: range.maxScore },
      create: { schoolId, minScore: range.minScore, maxScore: range.maxScore, grade: range.grade },
    });
  }

  // Create sample attendance for today - skipDuplicates
  const today = new Date();
  const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // Get first 50 students for attendance sample
  const sampleStudents = students.slice(0, 50);
  const attendanceRecords = sampleStudents.map((s, index) => ({
    schoolId,
    studentId: s.id,
    classId: classes[index % classes.length].id,
    date: dateOnly,
    status:
      index % 10 === 0
        ? AttendanceStatus.ABSENT
        : index % 7 === 0
        ? AttendanceStatus.LATE
        : AttendanceStatus.PRESENT,
    notes: index % 10 === 0 ? "Parent notified" : null,
  }));

  await prisma.attendance.createMany({
    data: attendanceRecords,
    skipDuplicates: true,
  });

  console.log(`   ✅ Created: ${classes.length} classes`);
  console.log(`      - KG Classes: ${classes.filter((c) => c.name.includes("KG")).length}`);
  console.log(`      - Primary Classes: ${classes.filter((c) => c.name.includes("Grade 1") || c.name.includes("Grade 2") || c.name.includes("Grade 3") || c.name.includes("Grade 4") || c.name.includes("Grade 5") || c.name.includes("Grade 6")).length}`);
  console.log(`      - Intermediate Classes: ${classes.filter((c) => c.name.includes("Grade 7") || c.name.includes("Grade 8") || c.name.includes("Grade 9")).length}`);
  console.log(`      - Secondary Classes: ${classes.filter((c) => c.name.includes("Grade 10") || c.name.includes("Grade 11") || c.name.includes("Grade 12")).length}`);
  console.log(`   ✅ Created: ${attendanceRecords.length} attendance records\n`);

  return { classes };
}
