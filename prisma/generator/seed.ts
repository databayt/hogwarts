/*
  Prisma seed for multi-file schema setup (multi-tenant, Sudan-focused sample data).
  - Creates four demo schools across Sudan with realistic seed data.
  - Idempotent: uses upsert or find-or-create patterns and createMany with skipDuplicates.
  - Intentionally skips seeding anything from `task.prisma`.
*/

import { PrismaClient, UserRole, AssessmentStatus, AssessmentType, SubmissionStatus, AttendanceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

type SchoolSeedInput = {
  domain: string;
  name: string;
  email: string;
  website: string;
  planType: string;
  maxStudents: number;
  maxTeachers: number;
};

const SUDAN_SCHOOLS: SchoolSeedInput[] = [
  {
    domain: "khartoum",
    name: "Khartoum Model Secondary School",
    email: "info@khartoum.school.sd",
    website: "https://khartoum.school.sd",
    planType: "premium",
    maxStudents: 2000,
    maxTeachers: 200,
  },
  {
    domain: "omdurman",
    name: "Omdurman Excellence Secondary School",
    email: "info@omdurman.school.sd",
    website: "https://omdurman.school.sd",
    planType: "premium",
    maxStudents: 1500,
    maxTeachers: 160,
  },
  {
    domain: "portsudan",
    name: "Port Sudan International School",
    email: "info@portsudan.school.sd",
    website: "https://portsudan.school.sd",
    planType: "enterprise",
    maxStudents: 2500,
    maxTeachers: 240,
  },
  {
    domain: "wadmadani",
    name: "Wad Madani Pioneer School",
    email: "info@wadmadani.school.sd",
    website: "https://wadmadani.school.sd",
    planType: "basic",
    maxStudents: 800,
    maxTeachers: 90,
  },
];

async function ensureSchool(input: SchoolSeedInput) {
  const existing = await prisma.school.findUnique({ where: { domain: input.domain } });
  if (existing) return existing;

  return prisma.school.create({
    data: {
      name: input.name,
      domain: input.domain,
      email: input.email,
      website: input.website,
      timezone: "Africa/Khartoum",
      planType: input.planType,
      maxStudents: input.maxStudents,
      maxTeachers: input.maxTeachers,
    },
  });
}

async function ensureAuthUsers(schoolId: string, domain: string) {
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
    where: { email_schoolId: { email: `admin@${domain}.school.sd`, schoolId } },
    update: {},
    create: {
      email: `admin@${domain}.school.sd`,
      role: UserRole.ADMIN,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Accountant user
  const accountant = await prisma.user.upsert({
    where: { email_schoolId: { email: `accountant@${domain}.school.sd`, schoolId } },
    update: {},
    create: {
      email: `accountant@${domain}.school.sd`,
      role: UserRole.ACCOUNTANT,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  return { admin, accountant };
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

  // Periods (typical Sudanese secondary school day)
  const periodsData = [
    { name: "Period 1", startTime: timeAt(7, 45), endTime: timeAt(8, 30) },
    { name: "Period 2", startTime: timeAt(8, 35), endTime: timeAt(9, 20) },
    { name: "Period 3", startTime: timeAt(9, 30), endTime: timeAt(10, 15) },
    { name: "Period 4", startTime: timeAt(10, 25), endTime: timeAt(11, 10) },
    { name: "Period 5", startTime: timeAt(11, 20), endTime: timeAt(12, 5) },
    { name: "Period 6", startTime: timeAt(12, 15), endTime: timeAt(13, 0) },
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

  // Year Levels (Secondary 1-3 plus upper basic 7-8 to create volume)
  const levelNames = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"]; 
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
  const ctComputer = await prisma.classroomType.upsert({
    where: { schoolId_name: { schoolId, name: "Computer Room" } },
    update: {},
    create: { schoolId, name: "Computer Room" },
  });

  const roomSeeds = [
    { name: "Room 101", typeId: ctLecture.id, capacity: 40 },
    { name: "Room 102", typeId: ctLecture.id, capacity: 40 },
    { name: "Lab 1", typeId: ctLab.id, capacity: 24 },
    { name: "Lab 2", typeId: ctLab.id, capacity: 24 },
    { name: "Computer Lab", typeId: ctComputer.id, capacity: 28 },
  ];

  const classrooms = [] as { id: string }[];
  for (const r of roomSeeds) {
    const created = await prisma.classroom.upsert({
      where: { schoolId_roomName: { schoolId, roomName: r.name } },
      update: {},
      create: { schoolId, typeId: r.typeId, roomName: r.name, capacity: r.capacity },
    });
    classrooms.push(created);
  }
  return { classroomTypes: [ctLecture, ctLab, ctComputer], classrooms };
}

async function ensurePeople(schoolId: string) {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Teacher seeds (common Sudanese names)
  const teacherSeeds = [
    { givenName: "Ahmed", surname: "Hassan", gender: "M" },
    { givenName: "Fatima", surname: "Ali", gender: "F" },
    { givenName: "Mariam", surname: "Yousif", gender: "F" },
    { givenName: "Mohamed", surname: "Abdelrahman", gender: "M" },
    { givenName: "Osman", surname: "Salih", gender: "M" },
    { givenName: "Huda", surname: "Ibrahim", gender: "F" },
    { givenName: "Khalid", surname: "Ahmed", gender: "M" },
    { givenName: "Sara", surname: "Abbas", gender: "F" },
  ];

  const teacherUsers: { id: string; email: string }[] = [];
  for (const t of teacherSeeds) {
    const email = `${t.givenName.toLowerCase()}.${t.surname.toLowerCase()}@school.local`;
    const user = await prisma.user.upsert({
      where: { email_schoolId: { email, schoolId } },
      update: {},
      create: {
        email,
        role: UserRole.TEACHER,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });
    teacherUsers.push({ id: user.id, email });
  }

  const teachers: { id: string; emailAddress: string }[] = [];
  for (let i = 0; i < teacherSeeds.length; i++) {
    const t = teacherSeeds[i];
    const user = teacherUsers[i];
    const teacher = await prisma.teacher.upsert({
      where: { schoolId_emailAddress: { schoolId, emailAddress: user.email } },
      update: {},
      create: {
        schoolId,
        givenName: t.givenName,
        surname: t.surname,
        gender: t.gender,
        emailAddress: user.email,
        userId: user.id,
      },
    });
    teachers.push({ id: teacher.id, emailAddress: user.email });
  }

  // Departments link (assign first two teachers)
  const sciencesDept = await prisma.department.findFirst({ where: { schoolId, departmentName: "Sciences" } });
  const languagesDept = await prisma.department.findFirst({ where: { schoolId, departmentName: "Languages" } });
  if (sciencesDept && teachers[0]) {
    await prisma.teacherDepartment.upsert({
      where: { schoolId_teacherId_departmentId: { schoolId, teacherId: teachers[0].id, departmentId: sciencesDept.id } },
      update: {},
      create: { schoolId, teacherId: teachers[0].id, departmentId: sciencesDept.id, isPrimary: true },
    });
  }
  if (languagesDept && teachers[1]) {
    await prisma.teacherDepartment.upsert({
      where: { schoolId_teacherId_departmentId: { schoolId, teacherId: teachers[1].id, departmentId: languagesDept.id } },
      update: {},
      create: { schoolId, teacherId: teachers[1].id, departmentId: languagesDept.id, isPrimary: true },
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

  // Guardians and Students (generate ~30 students with parents)
  const guardianPairs: { mother: { id: string }, father: { id: string } }[] = [];
  const students: { id: string }[] = [];

  for (let i = 0; i < 30; i++) {
    const fatherName = faker.person.firstName().split(" ")[0];
    const motherName = faker.person.firstName().split(" ")[0];
    const familySurname = faker.person.lastName();

    const fatherUser = await prisma.user.upsert({
      where: { email_schoolId: { email: `${fatherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`, schoolId } },
      update: {},
      create: {
        email: `${fatherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`,
        role: UserRole.GUARDIAN,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });
    const motherUser = await prisma.user.upsert({
      where: { email_schoolId: { email: `${motherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`, schoolId } },
      update: {},
      create: {
        email: `${motherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`,
        role: UserRole.GUARDIAN,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });

    const father = await prisma.guardian.upsert({
      where: { schoolId_emailAddress: { schoolId, emailAddress: fatherUser.email ?? `${fatherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local` } },
      update: {},
      create: {
        schoolId,
        givenName: fatherName,
        surname: familySurname,
        emailAddress: fatherUser.email ?? `${fatherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`,
        userId: fatherUser.id,
      },
    });
    const mother = await prisma.guardian.upsert({
      where: { schoolId_emailAddress: { schoolId, emailAddress: motherUser.email ?? `${motherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local` } },
      update: {},
      create: {
        schoolId,
        givenName: motherName,
        surname: familySurname,
        emailAddress: motherUser.email ?? `${motherName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`,
        userId: motherUser.id,
      },
    });

    await prisma.guardianPhoneNumber.upsert({
      where: { schoolId_guardianId_phoneNumber: { schoolId, guardianId: father.id, phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}` } },
      update: {},
      create: { schoolId, guardianId: father.id, phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`, isPrimary: true },
    });
    await prisma.guardianPhoneNumber.upsert({
      where: { schoolId_guardianId_phoneNumber: { schoolId, guardianId: mother.id, phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}` } },
      update: {},
      create: { schoolId, guardianId: mother.id, phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`, isPrimary: true },
    });

    guardianPairs.push({ mother: { id: mother.id }, father: { id: father.id } });

    // Student
    const gender = i % 2 === 0 ? "M" : "F";
    const studentFirst = gender === "M" ? faker.person.firstName('male') : faker.person.firstName('female');
    const middle = faker.person.firstName();
    const studentEmail = `${studentFirst.toLowerCase()}.${familySurname.toLowerCase()}@student.local`;
    const studentUser = await prisma.user.upsert({
      where: { email_schoolId: { email: studentEmail, schoolId } },
      update: {},
      create: {
        email: studentEmail,
        role: UserRole.STUDENT,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });
    const dobYear = faker.number.int({ min: 2008, max: 2012 });
    const dob = new Date(Date.UTC(dobYear, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 })));
    const student = await prisma.student.create({
      data: {
        schoolId,
        givenName: studentFirst,
        middleName: middle,
        surname: familySurname,
        dateOfBirth: dob,
        gender,
        userId: studentUser.id,
      },
    });

    // Link guardians to student
    await prisma.studentGuardian.upsert({
      where: { schoolId_studentId_guardianId: { schoolId, studentId: student.id, guardianId: father.id } },
      update: {},
      create: { schoolId, studentId: student.id, guardianId: father.id, guardianTypeId: gtFather.id, isPrimary: false },
    });
    await prisma.studentGuardian.upsert({
      where: { schoolId_studentId_guardianId: { schoolId, studentId: student.id, guardianId: mother.id } },
      update: {},
      create: { schoolId, studentId: student.id, guardianId: mother.id, guardianTypeId: gtMother.id, isPrimary: true },
    });

    students.push({ id: student.id });
  }

  return { teachers, students };
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
  const targetSubjects = ["Mathematics", "Arabic Language", "English Language"];
  const chosenSubjects = subjects.filter((s) => targetSubjects.includes(s.subjectName));
  const sectionLabels = ["A", "B", "C"]; // multi-class per grade
  const classesCreated: { id: string }[] = [];

  for (const subject of chosenSubjects) {
    for (let si = 0; si < sectionLabels.length; si++) {
      const teacher = teachers[(si + chosenSubjects.indexOf(subject)) % teachers.length];
      const startPeriod = periods[(si * 2) % periods.length];
      const endPeriod = periods[((si * 2) + 1) % periods.length];
      const classroom = classrooms[(si + 1) % classrooms.length];

      const className = `${subject.subjectName} Grade 10 ${sectionLabels[si]}`;
      const clazz = await prisma.class.upsert({
        where: { schoolId_name: { schoolId, name: className } },
        update: {},
        create: {
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
      classesCreated.push({ id: clazz.id });

      // Enroll ~15 students per section
      const start = si * 10;
      const enroll = students.slice(start, start + 15);
      await prisma.studentClass.createMany({
        data: enroll.map((s) => ({ schoolId, studentId: s.id, classId: clazz.id })),
        skipDuplicates: true,
      });

      // One assignment per class
      const assignment = await prisma.assignment.create({
        data: {
          schoolId,
          classId: clazz.id,
          title: `${subject.subjectName} Homework 1`,
          description: faker.lorem.sentences({ min: 1, max: 3 }),
          type: AssessmentType.HOMEWORK,
          status: AssessmentStatus.PUBLISHED,
          totalPoints: "100.00",
          weight: (10).toFixed(2),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          publishDate: new Date(),
        },
      });
      for (const s of enroll) {
        await prisma.assignmentSubmission.upsert({
          where: { schoolId_assignmentId_studentId: { schoolId, assignmentId: assignment.id, studentId: s.id } },
          update: {},
          create: {
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

  // Score ranges (A/B/C)
  await prisma.scoreRange.createMany({
    data: [
      { schoolId, minScore: "90.00", maxScore: "100.00", grade: "A" },
      { schoolId, minScore: "80.00", maxScore: "89.99", grade: "B" },
      { schoolId, minScore: "70.00", maxScore: "79.99", grade: "C" },
    ],
    skipDuplicates: true,
  });

  // Attendance for today (mark PRESENT/ABSENT alternately in first class)
  if (classesCreated[0]) {
    const clazzId = classesCreated[0].id;
    const today = new Date();
    const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    for (const [index, s] of students.entries()) {
      await prisma.attendance.upsert({
        where: { schoolId_studentId_classId_date: { schoolId, studentId: s.id, classId: clazzId, date: dateOnly } },
        update: {},
        create: { schoolId, studentId: s.id, classId: clazzId, date: dateOnly, status: index % 3 === 0 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT },
      });
    }
  }
}

async function main() {
  for (const s of SUDAN_SCHOOLS) {
    const school = await ensureSchool(s);
    await ensureAuthUsers(school.id, s.domain);
    const { schoolYear, term1, periods, yearLevels } = await ensureAcademicStructure(school.id);
    const { subjects } = await ensureDepartmentsAndSubjects(school.id);
    const { classrooms } = await ensureRooms(school.id);
    const { teachers, students } = await ensurePeople(school.id);

    await prisma.studentYearLevel.createMany({
      data: students.map((st, idx) => ({
        schoolId: school.id,
        studentId: st.id,
        levelId: yearLevels[idx % yearLevels.length].id,
        yearId: schoolYear.id,
      })),
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

    // Schedule config per school (varied working days & lunch)
    let workingDays: number[] = [0,1,2,3,4]; // Sun–Thu
    let lunchAfter = 3;
    if (s.domain === 'omdurman') { workingDays = [1,2,3,4,5]; lunchAfter = 2; } // Mon–Fri
    if (s.domain === 'portsudan') { workingDays = [1,2,3,4,6]; lunchAfter = 4; } // Mon–Thu + Sat (Fri+Sun off)
    if (s.domain === 'wadmadani') { workingDays = [0,1,2,3,4]; lunchAfter = 2; } // Sun–Thu, early lunch

    await prisma.schoolWeekConfig.upsert({
      where: { schoolId_termId: { schoolId: school.id, termId: term1.id } },
      update: { workingDays, defaultLunchAfterPeriod: lunchAfter },
      create: { schoolId: school.id, termId: term1.id, workingDays, defaultLunchAfterPeriod: lunchAfter },
    })

    // Seed a handful of timetable rows for demo
    const someClasses = await prisma.class.findMany({
      where: { schoolId: school.id, termId: term1.id },
      select: { id: true, teacherId: true, classroomId: true },
      take: 6,
    })
    const somePeriods = await prisma.period.findMany({
      where: { schoolId: school.id, yearId: (await prisma.term.findUnique({ where: { id: term1.id }, select: { yearId: true } }))!.yearId },
      orderBy: { startTime: 'asc' },
      select: { id: true },
      take: 4,
    })
    const cfg = await prisma.schoolWeekConfig.findUnique({ where: { schoolId_termId: { schoolId: school.id, termId: term1.id } } })
    const days = (cfg?.workingDays ?? [0,1,2,3,4]).slice(0, 5)
    const rows: any[] = []
    for (let d = 0; d < days.length; d++) {
      for (let p = 0; p < somePeriods.length; p++) {
        const cls = someClasses[(d + p) % someClasses.length]
        rows.push({
          schoolId: school.id,
          termId: term1.id,
          dayOfWeek: days[d],
          periodId: somePeriods[p].id,
          classId: cls.id,
          teacherId: cls.teacherId,
          classroomId: cls.classroomId,
          weekOffset: 0,
        })
      }
    }
    if (rows.length > 0) {
      await prisma.timetable.createMany({ data: rows, skipDuplicates: true })
    }

    console.log("Seed completed for school:", school.domain);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


