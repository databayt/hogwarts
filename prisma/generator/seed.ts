/*
  Prisma seed for multi-file schema setup.
  This script creates a demo school with related data and auth users.
  It is written to be safe to re-run: it uses find-or-create patterns
  and createMany with skipDuplicates where possible.

  Note: We intentionally skip seeding anything from `task.prisma`.
*/

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function ensureSchool() {
  const domain = "khartoum";
  const existing = await prisma.school.findUnique({ where: { domain } });
  if (existing) return existing;

  return prisma.school.create({
    data: {
      name: "Khartoum Model Secondary School",
      domain,
      email: "info@khartoum.school.sd",
      website: "https://khartoum.school.sd",
      timezone: "Africa/Khartoum",
      planType: "premium",
      maxStudents: 2000,
      maxTeachers: 200,
    },
  });
}

async function ensureAuthUsers(schoolId: string) {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Developer (platform-wide, not tied to a school)
  const existingDev = await prisma.user.findFirst({ where: { email: "dev@platform.local", schoolId: null } });
  if (!existingDev) {
    await prisma.user.create({
      data: {
        email: "dev@platform.local",
        role: UserRole.DEVELOPER,
        password: passwordHash,
        emailVerified: new Date(),
      },
    });
  }

  // School admin
  const admin = await prisma.user.upsert({
    where: { email_schoolId: { email: "admin@khartoum.school.sd", schoolId } },
    update: {},
    create: {
      email: "admin@khartoum.school.sd",
      role: UserRole.ADMIN,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  return { admin };
}

function timeAt(hour: number, minute = 0) {
  // Stored as @db.Time in the database; Prisma expects Date objects.
  const d = new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
  return d;
}

async function ensureAcademicStructure(schoolId: string) {
  // School Year
  const yearName = "2025-2026";
  const schoolYear = await prisma.schoolYear.upsert({
    where: { schoolId_yearName: { schoolId, yearName } },
    update: {},
    create: {
      schoolId,
      yearName,
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Periods
  const periodsData = [
    { name: "Period 1", startTime: timeAt(8, 0), endTime: timeAt(8, 50) },
    { name: "Period 2", startTime: timeAt(9, 0), endTime: timeAt(9, 50) },
    { name: "Period 3", startTime: timeAt(10, 0), endTime: timeAt(10, 50) },
    { name: "Period 4", startTime: timeAt(11, 0), endTime: timeAt(11, 50) },
  ];

  for (const p of periodsData) {
    await prisma.period.upsert({
      where: { schoolId_yearId_name: { schoolId, yearId: schoolYear.id, name: p.name } },
      update: {},
      create: { schoolId, yearId: schoolYear.id, name: p.name, startTime: p.startTime, endTime: p.endTime },
    });
  }
  const periods = await prisma.period.findMany({ where: { schoolId, yearId: schoolYear.id }, orderBy: { name: "asc" } });

  // Terms
  const term1 = await prisma.term.upsert({
    where: { schoolId_yearId_termNumber: { schoolId, yearId: schoolYear.id, termNumber: 1 } },
    update: {},
    create: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 1,
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-01-15T00:00:00Z"),
    },
  });

  await prisma.term.upsert({
    where: { schoolId_yearId_termNumber: { schoolId, yearId: schoolYear.id, termNumber: 2 } },
    update: {},
    create: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 2,
      startDate: new Date("2026-01-16T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Year Levels
  const levelNames = ["Grade 1", "Grade 2", "Grade 3"]; 
  for (const [index, levelName] of levelNames.entries()) {
    await prisma.yearLevel.upsert({
      where: { schoolId_levelName: { schoolId, levelName } },
      update: {},
      create: { schoolId, levelName, levelOrder: index + 1 },
    });
  }
  const yearLevels = await prisma.yearLevel.findMany({ where: { schoolId }, orderBy: { levelOrder: "asc" } });

  return { schoolYear, term1, periods, yearLevels };
}

async function ensureDepartmentsAndSubjects(schoolId: string) {
  const departmentNames = ["Languages", "Sciences", "Humanities", "Religious Studies", "ICT"];
  const departments = [] as { id: string; departmentName: string }[];
  for (const departmentName of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { schoolId_departmentName: { schoolId, departmentName } },
      update: {},
      create: { schoolId, departmentName },
    });
    departments.push(dept);
  }

  const subjectsInput = [
    { subjectName: "Arabic Language", departmentName: "Languages" },
    { subjectName: "English Language", departmentName: "Languages" },
    { subjectName: "Mathematics", departmentName: "Sciences" },
    { subjectName: "Physics", departmentName: "Sciences" },
    { subjectName: "Chemistry", departmentName: "Sciences" },
    { subjectName: "Biology", departmentName: "Sciences" },
    { subjectName: "Geography", departmentName: "Humanities" },
    { subjectName: "History", departmentName: "Humanities" },
    { subjectName: "Islamic Studies", departmentName: "Religious Studies" },
    { subjectName: "Computer Science", departmentName: "ICT" },
  ];

  for (const s of subjectsInput) {
    const dept = departments.find((d) => d.departmentName === s.departmentName)!;
    await prisma.subject.upsert({
      where: { schoolId_departmentId_subjectName: { schoolId, departmentId: dept.id, subjectName: s.subjectName } },
      update: {},
      create: { schoolId, departmentId: dept.id, subjectName: s.subjectName },
    });
  }

  const subjects = await prisma.subject.findMany({ where: { schoolId } });
  return { departments, subjects };
}

async function ensureRooms(schoolId: string) {
  const ctLecture = await prisma.classroomType.upsert({
    where: { schoolId_name: { schoolId, name: "Classroom" } },
    update: {},
    create: { schoolId, name: "Classroom" },
  });
  const ctLab = await prisma.classroomType.upsert({
    where: { schoolId_name: { schoolId, name: "Laboratory" } },
    update: {},
    create: { schoolId, name: "Laboratory" },
  });

  const c1 = await prisma.classroom.upsert({
    where: { schoolId_roomName: { schoolId, roomName: "Room 101" } },
    update: {},
    create: { schoolId, typeId: ctLecture.id, roomName: "Room 101", capacity: 40 },
  });
  const c2 = await prisma.classroom.upsert({
    where: { schoolId_roomName: { schoolId, roomName: "Lab 1" } },
    update: {},
    create: { schoolId, typeId: ctLab.id, roomName: "Lab 1", capacity: 24 },
  });
  return { classroomTypes: [ctLecture, ctLab], classrooms: [c1, c2] };
}

async function ensurePeople(schoolId: string) {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Teacher users
  const teacherUser1 = await prisma.user.upsert({
    where: { email_schoolId: { email: "ahmed.hassan@khartoum.school.sd", schoolId } },
    update: {},
    create: {
      email: "ahmed.hassan@khartoum.school.sd",
      role: UserRole.TEACHER,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });
  const teacherUser2 = await prisma.user.upsert({
    where: { email_schoolId: { email: "fatima.ali@khartoum.school.sd", schoolId } },
    update: {},
    create: {
      email: "fatima.ali@khartoum.school.sd",
      role: UserRole.TEACHER,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Teachers
  const teacher1 = await prisma.teacher.upsert({
    where: { schoolId_emailAddress: { schoolId, emailAddress: "ahmed.hassan@khartoum.school.sd" } },
    update: {},
    create: {
      schoolId,
      givenName: "Ahmed",
      surname: "Hassan",
      gender: "M",
      emailAddress: "ahmed.hassan@khartoum.school.sd",
      userId: teacherUser1.id,
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: { schoolId_emailAddress: { schoolId, emailAddress: "fatima.ali@khartoum.school.sd" } },
    update: {},
    create: {
      schoolId,
      givenName: "Fatima",
      surname: "Ali",
      gender: "F",
      emailAddress: "fatima.ali@khartoum.school.sd",
      userId: teacherUser2.id,
    },
  });

  // Departments link
  const sciencesDept = await prisma.department.findFirst({ where: { schoolId, departmentName: "Sciences" } });
  const languagesDept = await prisma.department.findFirst({ where: { schoolId, departmentName: "Languages" } });
  if (sciencesDept) {
    await prisma.teacherDepartment.upsert({
      where: { schoolId_teacherId_departmentId: { schoolId, teacherId: teacher1.id, departmentId: sciencesDept.id } },
      update: {},
      create: { schoolId, teacherId: teacher1.id, departmentId: sciencesDept.id, isPrimary: true },
    });
  }
  if (languagesDept) {
    await prisma.teacherDepartment.upsert({
      where: { schoolId_teacherId_departmentId: { schoolId, teacherId: teacher2.id, departmentId: languagesDept.id } },
      update: {},
      create: { schoolId, teacherId: teacher2.id, departmentId: languagesDept.id, isPrimary: true },
    });
  }

  // Guardians types
  const gtFather = await prisma.guardianType.upsert({
    where: { schoolId_name: { schoolId, name: "Father" } },
    update: {},
    create: { schoolId, name: "Father" },
  });
  const gtMother = await prisma.guardianType.upsert({
    where: { schoolId_name: { schoolId, name: "Mother" } },
    update: {},
    create: { schoolId, name: "Mother" },
  });

  // Guardians
  // Guardian users
  const guardianUser1 = await prisma.user.upsert({
    where: { email_schoolId: { email: "mariam.ahmed@khartoum.school.sd", schoolId } },
    update: {},
    create: {
      email: "mariam.ahmed@khartoum.school.sd",
      role: UserRole.GUARDIAN,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });
  const guardianUser2 = await prisma.user.upsert({
    where: { email_schoolId: { email: "mohamed.ahmed@khartoum.school.sd", schoolId } },
    update: {},
    create: {
      email: "mohamed.ahmed@khartoum.school.sd",
      role: UserRole.GUARDIAN,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  const guardian1 = await prisma.guardian.upsert({
    where: { schoolId_emailAddress: { schoolId, emailAddress: "mariam.ahmed@khartoum.school.sd" } },
    update: {},
    create: {
      schoolId,
      givenName: "Mariam",
      surname: "Ahmed",
      emailAddress: "mariam.ahmed@khartoum.school.sd",
      userId: guardianUser1.id,
    },
  });
  await prisma.guardianPhoneNumber.upsert({
    where: { schoolId_guardianId_phoneNumber: { schoolId, guardianId: guardian1.id, phoneNumber: "+249-910-000001" } },
    update: {},
    create: { schoolId, guardianId: guardian1.id, phoneNumber: "+249-910-000001", isPrimary: true },
  });

  const guardian2 = await prisma.guardian.upsert({
    where: { schoolId_emailAddress: { schoolId, emailAddress: "mohamed.ahmed@khartoum.school.sd" } },
    update: {},
    create: {
      schoolId,
      givenName: "Mohamed",
      surname: "Ahmed",
      emailAddress: "mohamed.ahmed@khartoum.school.sd",
      userId: guardianUser2.id,
    },
  });
  await prisma.guardianPhoneNumber.upsert({
    where: { schoolId_guardianId_phoneNumber: { schoolId, guardianId: guardian2.id, phoneNumber: "+249-912-000002" } },
    update: {},
    create: { schoolId, guardianId: guardian2.id, phoneNumber: "+249-912-000002", isPrimary: true },
  });

  // Students
  // Student users
  const studentUser1 = await prisma.user.upsert({
    where: { email_schoolId: { email: "hassan.mohamed@khartoum.school.sd", schoolId } },
    update: {},
    create: {
      email: "hassan.mohamed@khartoum.school.sd",
      role: UserRole.STUDENT,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });
  const studentUser2 = await prisma.user.upsert({
    where: { email_schoolId: { email: "sara.ali@khartoum.school.sd", schoolId } },
    update: {},
    create: {
      email: "sara.ali@khartoum.school.sd",
      role: UserRole.STUDENT,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  const student1 = await prisma.student.upsert({
    where: { id: (await prisma.student.findFirst({ where: { schoolId, givenName: "Hassan", surname: "Mohamed" } }))?.id || "__none__" },
    update: {},
    create: {
      schoolId,
      givenName: "Hassan",
      middleName: "Ali",
      surname: "Mohamed",
      dateOfBirth: new Date("2010-07-31T00:00:00Z"),
      gender: "M",
      userId: studentUser1.id,
    },
  });

  const student2 = await prisma.student.upsert({
    where: { id: (await prisma.student.findFirst({ where: { schoolId, givenName: "Sara", surname: "Ali" } }))?.id || "__none__" },
    update: {},
    create: {
      schoolId,
      givenName: "Sara",
      surname: "Ali",
      dateOfBirth: new Date("2010-09-19T00:00:00Z"),
      gender: "F",
      userId: studentUser2.id,
    },
  });

  // Link guardians to students
  await prisma.studentGuardian.upsert({
    where: { schoolId_studentId_guardianId: { schoolId, studentId: student1.id, guardianId: guardian1.id } },
    update: {},
    create: { schoolId, studentId: student1.id, guardianId: guardian1.id, guardianTypeId: gtMother.id, isPrimary: true },
  });
  await prisma.studentGuardian.upsert({
    where: { schoolId_studentId_guardianId: { schoolId, studentId: student1.id, guardianId: guardian2.id } },
    update: {},
    create: { schoolId, studentId: student1.id, guardianId: guardian2.id, guardianTypeId: gtFather.id, isPrimary: false },
  });

  return { teachers: [teacher1, teacher2], students: [student1, student2] };
}

async function ensureClassesAndWork(
  schoolId: string,
  termId: string,
  periods: { id: string }[],
  classrooms: { id: string }[],
  subjects: { id: string; subjectName: string }[],
  teachers: { id: string }[],
  students: { id: string }[],
) {
  const subject = subjects.find((s) => s.subjectName === "Mathematics") ?? subjects[0];
  const teacher = teachers[0];
  const startPeriod = periods[0];
  const endPeriod = periods[1] ?? periods[0];
  const classroom = classrooms[0];

  const clazz = await prisma.class.upsert({
    where: { schoolId_name: { schoolId, name: "Mathematics Grade 1" } },
    update: {},
    create: {
      schoolId,
      name: "Mathematics Grade 1",
      subjectId: subject.id,
      teacherId: teacher.id,
      termId,
      startPeriodId: startPeriod.id,
      endPeriodId: endPeriod.id,
      classroomId: classroom.id,
    },
  });

  // Enroll students
  await prisma.studentClass.createMany({
    data: students.map((s) => ({ schoolId, studentId: s.id, classId: clazz.id })),
    skipDuplicates: true,
  });

  // Score ranges
  await prisma.scoreRange.createMany({
    data: [
      { schoolId, minScore: "90.00", maxScore: "100.00", grade: "A" },
      { schoolId, minScore: "80.00", maxScore: "89.99", grade: "B" },
      { schoolId, minScore: "70.00", maxScore: "79.99", grade: "C" },
    ],
    skipDuplicates: true,
  });

  // Assignment
  const assignment = await prisma.assignment.create({
    data: {
      schoolId,
      classId: clazz.id,
      title: "Mathematics Homework 1",
      description: "Practice exercises on basic algebra",
      type: "HOMEWORK",
      status: "PUBLISHED",
      totalPoints: "100.00",
      weight: "10.00",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      publishDate: new Date(),
    },
  });

  // Submissions for students (empty or graded)
  for (const s of students) {
    await prisma.assignmentSubmission.upsert({
      where: { schoolId_assignmentId_studentId: { schoolId, assignmentId: assignment.id, studentId: s.id } },
      update: {},
      create: { schoolId, assignmentId: assignment.id, studentId: s.id, status: "SUBMITTED", attachments: [], content: faker.lorem.paragraph() },
    });
  }

  // Attendance for today
  const today = new Date();
  const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  for (const [index, s] of students.entries()) {
    await prisma.attendance.upsert({
      where: { schoolId_studentId_classId_date: { schoolId, studentId: s.id, classId: clazz.id, date: dateOnly } },
      update: {},
      create: { schoolId, studentId: s.id, classId: clazz.id, date: dateOnly, status: index === 0 ? "PRESENT" : "ABSENT" },
    });
  }
}

async function main() {
  const school = await ensureSchool();
  await ensureAuthUsers(school.id);
  const { schoolYear, term1, periods, yearLevels } = await ensureAcademicStructure(school.id);
  const { subjects } = await ensureDepartmentsAndSubjects(school.id);
  const { classrooms } = await ensureRooms(school.id);
  const { teachers, students } = await ensurePeople(school.id);

  await prisma.studentYearLevel.createMany({
    data: students.map((s) => ({ schoolId: school.id, studentId: s.id, levelId: yearLevels[0].id, yearId: schoolYear.id })),
    skipDuplicates: true,
  });

  await ensureClassesAndWork(
    school.id,
    term1.id,
    periods,
    classrooms,
    subjects,
    teachers,
    students,
  );

  console.log("Seed completed for school:", school.domain);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


