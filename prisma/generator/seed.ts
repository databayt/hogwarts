/*
  Prisma seed for Port Sudan International School with comprehensive data.
  - Seeds ONLY the portsudan school with full data across all Prisma models
  - Uses Sudanese/Arabic/African names for realistic demo data
  - Idempotent: uses upsert or find-or-create patterns and createMany with skipDuplicates
  - Covers: academics, attendance, library, fees, exams, announcements, grades, etc.
*/

import {
  PrismaClient,
  UserRole,
  AssessmentStatus,
  AssessmentType,
  SubmissionStatus,
  AttendanceStatus,
  AdmissionStatus,
  AdmissionApplicationStatus,
  FeeStatus,
  PaymentMethod,
  PaymentStatus,
  ExamType,
  ExamStatus,
  AnnouncementScope
} from "@prisma/client";
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

// Sudanese/Arabic/African names for realistic demo data
const SUDANESE_MALE_NAMES = [
  "Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar",
  "Abdalla", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir",
  "Hamza", "Idris", "Jamal", "Nabil", "Rashid", "Saeed", "Waleed", "Zain"
];

const SUDANESE_FEMALE_NAMES = [
  "Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla",
  "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal",
  "Mona", "Rehab", "Safaa", "Tahani", "Widad", "Yasmin", "Zainab", "Amal"
];

const SUDANESE_SURNAMES = [
  "Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih",
  "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik",
  "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Abbas", "Badawi", "Elsayed"
];

const PORTSUDAN_SCHOOL: SchoolSeedInput = {
  domain: "portsudan",
  name: "Port Sudan International School",
  email: "info@portsudan.school.sd",
  website: "https://portsudan.school.sd",
  planType: "enterprise",
  maxStudents: 2500,
  maxTeachers: 240,
};

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

// Helper to generate Sudanese names
function getSudaneseName(gender: "M" | "F"): { givenName: string; surname: string } {
  const givenName = gender === "M"
    ? SUDANESE_MALE_NAMES[Math.floor(Math.random() * SUDANESE_MALE_NAMES.length)]
    : SUDANESE_FEMALE_NAMES[Math.floor(Math.random() * SUDANESE_FEMALE_NAMES.length)];
  const surname = SUDANESE_SURNAMES[Math.floor(Math.random() * SUDANESE_SURNAMES.length)];
  return { givenName, surname };
}

async function ensurePeople(schoolId: string) {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Teacher seeds (15 teachers with Sudanese names)
  const teacherSeeds = [
    { givenName: "Ahmed", surname: "Hassan", gender: "M" },
    { givenName: "Fatima", surname: "Ali", gender: "F" },
    { givenName: "Mariam", surname: "Yousif", gender: "F" },
    { givenName: "Mohamed", surname: "Abdelrahman", gender: "M" },
    { givenName: "Osman", surname: "Salih", gender: "M" },
    { givenName: "Huda", surname: "Ibrahim", gender: "F" },
    { givenName: "Khalid", surname: "Ahmed", gender: "M" },
    { givenName: "Sara", surname: "Abbas", gender: "F" },
    { givenName: "Ibrahim", surname: "Malik", gender: "M" },
    { givenName: "Amina", surname: "Kamal", gender: "F" },
    { givenName: "Tariq", surname: "Bashir", gender: "M" },
    { givenName: "Layla", surname: "Hamza", gender: "F" },
    { givenName: "Mustafa", surname: "Idris", gender: "M" },
    { givenName: "Noura", surname: "Nabil", gender: "F" },
    { givenName: "Hamza", surname: "Badawi", gender: "M" },
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

  // Guardians and Students (generate ~60 students with Sudanese names)
  const guardianPairs: { mother: { id: string }, father: { id: string } }[] = [];
  const students: { id: string }[] = [];

  for (let i = 0; i < 60; i++) {
    const fatherData = getSudaneseName("M");
    const motherData = getSudaneseName("F");
    const familySurname = SUDANESE_SURNAMES[i % SUDANESE_SURNAMES.length];

    const fatherEmail = `${fatherData.givenName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`;
    const motherEmail = `${motherData.givenName.toLowerCase()}.${familySurname.toLowerCase()}@guardian.local`;

    const fatherUser = await prisma.user.upsert({
      where: { email_schoolId: { email: fatherEmail, schoolId } },
      update: {},
      create: {
        email: fatherEmail,
        role: UserRole.GUARDIAN,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });
    const motherUser = await prisma.user.upsert({
      where: { email_schoolId: { email: motherEmail, schoolId } },
      update: {},
      create: {
        email: motherEmail,
        role: UserRole.GUARDIAN,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });

    const father = await prisma.guardian.upsert({
      where: { schoolId_emailAddress: { schoolId, emailAddress: fatherEmail } },
      update: {},
      create: {
        schoolId,
        givenName: fatherData.givenName,
        surname: familySurname,
        emailAddress: fatherEmail,
        userId: fatherUser.id,
      },
    });
    const mother = await prisma.guardian.upsert({
      where: { schoolId_emailAddress: { schoolId, emailAddress: motherEmail } },
      update: {},
      create: {
        schoolId,
        givenName: motherData.givenName,
        surname: familySurname,
        emailAddress: motherEmail,
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

    // Student (using Sudanese names)
    const gender = i % 2 === 0 ? "M" : "F";
    const studentData = getSudaneseName(gender);
    const middleName = gender === "M"
      ? SUDANESE_MALE_NAMES[(i + 5) % SUDANESE_MALE_NAMES.length]
      : SUDANESE_FEMALE_NAMES[(i + 5) % SUDANESE_FEMALE_NAMES.length];
    const studentEmail = `${studentData.givenName.toLowerCase()}.${familySurname.toLowerCase()}@student.local`;
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

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { userId: studentUser.id },
    });

    const student = existingStudent ?? await prisma.student.create({
      data: {
        schoolId,
        givenName: studentData.givenName,
        middleName: middleName,
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

async function ensureLibraryBooks(schoolId: string) {
  const booksData = [
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      genre: "Fiction",
      rating: 5,
      coverColor: "#8B4513",
      description: "A gripping, heart-wrenching, and wholly remarkable tale of coming-of-age in a South poisoned by virulent prejudice.",
      summary: "The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Through the young eyes of Scout and Jem Finch, Harper Lee explores with rich humor and unswerving honesty the irrationality of adult attitudes toward race and class in the Deep South of the 1930s.",
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      title: "1984",
      author: "George Orwell",
      genre: "Science Fiction",
      rating: 5,
      coverColor: "#2F4F4F",
      description: "A dystopian social science fiction novel and cautionary tale about the dangers of totalitarianism.",
      summary: "Among the seminal texts of the 20th century, Nineteen Eighty-Four is a rare work that grows more haunting as its futuristic purgatory becomes more real. Published in 1949, the book offers political satirist George Orwell's nightmare vision of a totalitarian, bureaucratic world and one poor stiff's attempt to find individuality.",
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      genre: "Romance",
      rating: 5,
      coverColor: "#FFB6C1",
      description: "A romantic novel of manners that follows the character development of Elizabeth Bennet.",
      summary: "Since its immediate success in 1813, Pride and Prejudice has remained one of the most popular novels in the English language. Jane Austen called this brilliant work 'her own darling child' and its vivacious heroine, Elizabeth Bennet, 'as delightful a creature as ever appeared in print.'",
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      genre: "Fiction",
      rating: 4,
      coverColor: "#FFD700",
      description: "A tale of the American Dream's corruption in the materialistic 1920s.",
      summary: "The Great Gatsby, F. Scott Fitzgerald's third book, stands as the supreme achievement of his career. This exemplary novel of the Jazz Age has been acclaimed by generations of readers.",
      totalCopies: 6,
      availableCopies: 6,
    },
    {
      title: "Harry Potter and the Philosopher's Stone",
      author: "J.K. Rowling",
      genre: "Fantasy",
      rating: 5,
      coverColor: "#8B0000",
      description: "The first novel in the Harry Potter series and Rowling's debut novel.",
      summary: "Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. Addressed in green ink on yellowish parchment with a purple seal, they are swiftly confiscated by his grisly aunt and uncle.",
      totalCopies: 8,
      availableCopies: 8,
    },
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      genre: "Fantasy",
      rating: 5,
      coverColor: "#228B22",
      description: "A children's fantasy novel and a prelude to The Lord of the Rings.",
      summary: "Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, rarely traveling any farther than his pantry or cellar. But his contentment is disturbed when the wizard Gandalf and a company of dwarves arrive on his doorstep one day to whisk him away on an adventure.",
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      genre: "Fiction",
      rating: 4,
      coverColor: "#DC143C",
      description: "A story about teenage rebellion and alienation that has been translated into almost all of the world's major languages.",
      summary: "The hero-narrator of The Catcher in the Rye is an ancient child of sixteen, a native New Yorker named Holden Caulfield. Through circumstances that tend to preclude adult, secondhand description, he leaves his prep school in Pennsylvania and goes underground in New York City for three days.",
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: "The Lord of the Rings",
      author: "J.R.R. Tolkien",
      genre: "Fantasy",
      rating: 5,
      coverColor: "#4B0082",
      description: "An epic high-fantasy novel divided into three volumes.",
      summary: "One Ring to rule them all, One Ring to find them, One Ring to bring them all and in the darkness bind them. In ancient times the Rings of Power were crafted by the Elven-smiths, and Sauron, the Dark Lord, forged the One Ring, filling it with his own power so that he could rule all others.",
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      title: "Animal Farm",
      author: "George Orwell",
      genre: "Political Satire",
      rating: 4,
      coverColor: "#8B4513",
      description: "A satirical allegorical novella about Stalinism and the Russian Revolution.",
      summary: "A farm is taken over by its overworked, mistreated animals. With flaming idealism and stirring slogans, they set out to create a paradise of progress, justice, and equality. Thus the stage is set for one of the most telling satiric fables ever penned.",
      totalCopies: 4,
      availableCopies: 4,
    },
    {
      title: "Brave New World",
      author: "Aldous Huxley",
      genre: "Science Fiction",
      rating: 4,
      coverColor: "#4682B4",
      description: "A dystopian novel set in a futuristic World State of genetically modified citizens.",
      summary: "Aldous Huxley's profoundly important classic of world literature, Brave New World is a searching vision of an unequal, technologically-advanced future where humans are genetically bred, socially indoctrinated, and pharmaceutically anesthetized to passively uphold an authoritarian ruling order.",
      totalCopies: 3,
      availableCopies: 3,
    },
    {
      title: "The Chronicles of Narnia",
      author: "C.S. Lewis",
      genre: "Fantasy",
      rating: 5,
      coverColor: "#DAA520",
      description: "A series of seven fantasy novels featuring magical lands and mythical creatures.",
      summary: "Journeys to the end of the world, fantastic creatures, and epic battles between good and evil—what more could any reader ask for in one book? The book that has it all is The Lion, the Witch and the Wardrobe, written in 1949 by Clive Staples Lewis.",
      totalCopies: 6,
      availableCopies: 6,
    },
    {
      title: "Moby-Dick",
      author: "Herman Melville",
      genre: "Adventure",
      rating: 4,
      coverColor: "#000080",
      description: "The saga of Captain Ahab and his obsessive quest to kill the white whale.",
      summary: "In Moby-Dick, Ishmael narrates the monomaniacal quest of Ahab, captain of the whaler Pequod, for revenge on the white whale Moby Dick, which on a previous voyage destroyed Ahab's ship and severed his leg at the knee.",
      totalCopies: 2,
      availableCopies: 2,
    },
  ];

  // Check if books already exist for this school
  const existingBooks = await prisma.book.findMany({
    where: { schoolId },
    select: { title: true },
  });

  const existingTitles = new Set(existingBooks.map((b) => b.title));
  const newBooks = booksData.filter((book) => !existingTitles.has(book.title));

  if (newBooks.length > 0) {
    await prisma.book.createMany({
      data: newBooks.map((book) => ({
        schoolId,
        ...book,
        coverUrl: `/placeholder-book-cover.jpg`, // Using placeholder
      })),
      skipDuplicates: true,
    });
    console.log(`Seeded ${newBooks.length} books for school`);
  } else {
    console.log(`Books already exist for school, skipping...`);
  }
}

async function ensureAnnouncements(schoolId: string, classes: { id: string }[]) {
  const announcements = [
    {
      title: "Welcome to Academic Year 2025-2026",
      body: "We are delighted to welcome all students and parents to the new academic year. Let's make this year successful together!",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Mid-Term Exams Schedule Released",
      body: "The mid-term examination schedule has been published. Please check the timetable section for details.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Parent-Teacher Meeting - Grade 10",
      body: "A parent-teacher meeting is scheduled for next week. All Grade 10 parents are requested to attend.",
      scope: AnnouncementScope.class,
      classId: classes[0]?.id,
      published: true,
    },
    {
      title: "Library New Arrivals",
      body: "The school library has received new books in Science and Literature. Visit the library to explore!",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Sports Day Announcement",
      body: "Annual Sports Day will be held next month. All students are encouraged to participate.",
      scope: AnnouncementScope.school,
      published: false,
    },
  ];

  for (const ann of announcements) {
    const existing = await prisma.announcement.findFirst({
      where: { schoolId, title: ann.title },
    });
    if (!existing) {
      await prisma.announcement.create({
        data: { schoolId, ...ann },
      });
    }
  }
  console.log(`Seeded announcements (skipped duplicates)`);
}

async function ensureSchoolBranding(schoolId: string) {
  await prisma.schoolBranding.upsert({
    where: { schoolId },
    update: {},
    create: {
      schoolId,
      primaryColor: "#1e40af", // Blue
      secondaryColor: "#dc2626", // Red
      borderRadius: "md",
      shadow: "lg",
      isPubliclyListed: true,
      allowSelfEnrollment: false,
      requireParentApproval: true,
      informationSharing: "limited-sharing",
    },
  });
  console.log("Seeded school branding");
}

async function ensureFeeStructures(
  schoolId: string,
  classes: { id: string; name: string }[],
  students: { id: string }[]
) {
  const academicYear = "2025-2026";

  // Create fee structure for Grade 10
  const existingFee = await prisma.feeStructure.findFirst({
    where: { schoolId, name: "Grade 10 Annual Fee 2025-2026" },
  });

  const feeStructure = existingFee ?? await prisma.feeStructure.create({
    data: {
      schoolId,
      name: "Grade 10 Annual Fee 2025-2026",
      academicYear,
      classId: classes[0]?.id,
      tuitionFee: "15000.00",
      admissionFee: "2000.00",
      registrationFee: "500.00",
      examFee: "1000.00",
      libraryFee: "300.00",
      laboratoryFee: "800.00",
      sportsFee: "400.00",
      totalAmount: "20000.00",
      installments: 2,
      isActive: true,
    },
  });

  // Assign fees to first 30 students
  for (let i = 0; i < Math.min(30, students.length); i++) {
    const student = students[i];
    const feeAssignment = await prisma.feeAssignment.upsert({
      where: {
        studentId_feeStructureId_academicYear: {
          studentId: student.id,
          feeStructureId: feeStructure.id,
          academicYear,
        },
      },
      update: {},
      create: {
        schoolId,
        studentId: student.id,
        feeStructureId: feeStructure.id,
        academicYear,
        finalAmount: "20000.00",
        status: i < 20 ? FeeStatus.PAID : FeeStatus.PENDING,
      },
    });

    // Create payments for paid students
    if (i < 20) {
      await prisma.payment.create({
        data: {
          schoolId,
          feeAssignmentId: feeAssignment.id,
          studentId: student.id,
          paymentNumber: `PAY-2025-${String(i + 1).padStart(5, "0")}`,
          amount: "20000.00",
          paymentDate: new Date(),
          paymentMethod: i % 3 === 0 ? PaymentMethod.CASH : i % 3 === 1 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CHEQUE,
          receiptNumber: `RCP-2025-${String(i + 1).padStart(5, "0")}`,
          status: PaymentStatus.SUCCESS,
        },
      });
    }
  }

  console.log("Seeded fee structures and payments");
}

async function ensureExams(
  schoolId: string,
  classes: { id: string; name: string }[],
  subjects: { id: string; subjectName: string }[],
  students: { id: string }[]
) {
  const mathSubject = subjects.find((s) => s.subjectName === "Mathematics");
  const arabicSubject = subjects.find((s) => s.subjectName === "Arabic Language");

  if (!mathSubject || !arabicSubject || classes.length === 0) return;

  // Create exams (check if already exist)
  const existingMathExam = await prisma.exam.findFirst({
    where: { schoolId, title: "Mathematics Mid-Term Exam" },
  });

  const mathExam = existingMathExam ?? await prisma.exam.create({
    data: {
      schoolId,
      title: "Mathematics Mid-Term Exam",
      description: "Mid-term examination for Grade 10 Mathematics",
      classId: classes[0].id,
      subjectId: mathSubject.id,
      examDate: new Date("2025-11-15T00:00:00Z"),
      startTime: "09:00",
      endTime: "11:00",
      duration: 120,
      totalMarks: 100,
      passingMarks: 50,
      examType: ExamType.MIDTERM,
      status: ExamStatus.COMPLETED,
    },
  });

  const existingArabicExam = await prisma.exam.findFirst({
    where: { schoolId, title: "Arabic Language Mid-Term Exam" },
  });

  const arabicExam = existingArabicExam ?? await prisma.exam.create({
    data: {
      schoolId,
      title: "Arabic Language Mid-Term Exam",
      description: "Mid-term examination for Grade 10 Arabic",
      classId: classes[0].id,
      subjectId: arabicSubject.id,
      examDate: new Date("2025-11-16T00:00:00Z"),
      startTime: "09:00",
      endTime: "11:00",
      duration: 120,
      totalMarks: 100,
      passingMarks: 50,
      examType: ExamType.MIDTERM,
      status: ExamStatus.COMPLETED,
    },
  });

  // Create exam results for first 30 students
  for (let i = 0; i < Math.min(30, students.length); i++) {
    const mathMarks = faker.number.int({ min: 45, max: 98 });
    const arabicMarks = faker.number.int({ min: 50, max: 95 });

    await prisma.examResult.create({
      data: {
        schoolId,
        examId: mathExam.id,
        studentId: students[i].id,
        marksObtained: mathMarks,
        totalMarks: 100,
        percentage: mathMarks,
        grade: mathMarks >= 90 ? "A" : mathMarks >= 80 ? "B" : mathMarks >= 70 ? "C" : mathMarks >= 60 ? "D" : "F",
        isAbsent: false,
      },
    });

    await prisma.examResult.create({
      data: {
        schoolId,
        examId: arabicExam.id,
        studentId: students[i].id,
        marksObtained: arabicMarks,
        totalMarks: 100,
        percentage: arabicMarks,
        grade: arabicMarks >= 90 ? "A" : arabicMarks >= 80 ? "B" : arabicMarks >= 70 ? "C" : arabicMarks >= 60 ? "D" : "F",
        isAbsent: false,
      },
    });
  }

  // Create grade boundaries
  await prisma.gradeBoundary.createMany({
    data: [
      { schoolId, grade: "A+", minScore: "95.00", maxScore: "100.00", gpaValue: "4.00" },
      { schoolId, grade: "A", minScore: "90.00", maxScore: "94.99", gpaValue: "3.70" },
      { schoolId, grade: "B+", minScore: "85.00", maxScore: "89.99", gpaValue: "3.30" },
      { schoolId, grade: "B", minScore: "80.00", maxScore: "84.99", gpaValue: "3.00" },
      { schoolId, grade: "C+", minScore: "75.00", maxScore: "79.99", gpaValue: "2.70" },
      { schoolId, grade: "C", minScore: "70.00", maxScore: "74.99", gpaValue: "2.30" },
      { schoolId, grade: "D", minScore: "60.00", maxScore: "69.99", gpaValue: "2.00" },
      { schoolId, grade: "F", minScore: "0.00", maxScore: "59.99", gpaValue: "0.00" },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded exams and results");
}

async function ensureAdmissions(schoolId: string) {
  const academicYear = "2026-2027";

  // Create admission campaign (check if exists)
  const existingCampaign = await prisma.admissionCampaign.findFirst({
    where: { schoolId, name: "Admission Campaign 2026-2027" },
  });

  const campaign = existingCampaign ?? await prisma.admissionCampaign.create({
    data: {
      schoolId,
      name: "Admission Campaign 2026-2027",
      academicYear,
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-05-31T00:00:00Z"),
      status: AdmissionStatus.OPEN,
      description: "Applications open for Grade 7 admission for academic year 2026-2027",
      applicationFee: "500.00",
      totalSeats: 150,
    },
  });

  // Create sample applications with Sudanese names (skip if exist)
  const existingAppsCount = await prisma.application.count({
    where: { schoolId, campaignId: campaign.id },
  });

  if (existingAppsCount === 0) {
    for (let i = 0; i < 20; i++) {
      const gender = i % 2 === 0 ? "M" : "F";
      const studentData = getSudaneseName(gender);
      const fatherData = getSudaneseName("M");
      const motherData = getSudaneseName("F");

      await prisma.application.create({
        data: {
        schoolId,
        campaignId: campaign.id,
        applicationNumber: `APP-2026-${String(i + 1).padStart(5, "0")}`,
        firstName: studentData.givenName,
        lastName: studentData.surname,
        dateOfBirth: new Date(Date.UTC(2014, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 }))),
        gender: gender === "M" ? "MALE" : "FEMALE",
        nationality: "Sudanese",
        email: `${studentData.givenName.toLowerCase()}.applicant@example.com`,
        phone: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`,
        address: `${faker.location.streetAddress()}, Port Sudan`,
        city: "Port Sudan",
        state: "Red Sea",
        postalCode: "11111",
        country: "Sudan",
        fatherName: `${fatherData.givenName} ${fatherData.surname}`,
        fatherPhone: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`,
        motherName: `${motherData.givenName} ${motherData.surname}`,
        motherPhone: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`,
        applyingForClass: "Grade 7",
        status: i < 10 ? AdmissionApplicationStatus.ADMITTED : i < 15 ? AdmissionApplicationStatus.SELECTED : AdmissionApplicationStatus.UNDER_REVIEW,
        submittedAt: new Date(),
        applicationFeePaid: true,
        paymentDate: new Date(),
        },
      });
    }
  }

  console.log("Seeded admission campaigns and applications");
}

async function main() {
  console.log("🌱 Starting seed for Port Sudan International School...");

  const school = await ensureSchool(PORTSUDAN_SCHOOL);
  console.log(`✅ School created/found: ${school.name}`);

  await ensureAuthUsers(school.id, PORTSUDAN_SCHOOL.domain);
  console.log("✅ Auth users created");

  const { schoolYear, term1, periods, yearLevels } = await ensureAcademicStructure(school.id);
  console.log("✅ Academic structure created");

  const { subjects } = await ensureDepartmentsAndSubjects(school.id);
  console.log("✅ Departments and subjects created");

  const { classrooms } = await ensureRooms(school.id);
  console.log("✅ Classrooms created");

  const { teachers, students } = await ensurePeople(school.id);
  console.log(`✅ People created: ${teachers.length} teachers, ${students.length} students`);

  await prisma.studentYearLevel.createMany({
    data: students.map((st, idx) => ({
      schoolId: school.id,
      studentId: st.id,
      levelId: yearLevels[idx % yearLevels.length].id,
      yearId: schoolYear.id,
    })),
    skipDuplicates: true,
  });
  console.log("✅ Student year levels assigned");

  await ensureClassesAndWork(
    school.id,
    term1.id,
    periods,
    classrooms,
    subjects,
    teachers,
    students,
  );
  console.log("✅ Classes and assignments created");

  // Port Sudan working days: Mon–Thu + Sat (Fri+Sun off)
  const workingDays = [1, 2, 3, 4, 6];
  const lunchAfter = 4;

  await prisma.schoolWeekConfig.upsert({
    where: { schoolId_termId: { schoolId: school.id, termId: term1.id } },
    update: { workingDays, defaultLunchAfterPeriod: lunchAfter },
    create: { schoolId: school.id, termId: term1.id, workingDays, defaultLunchAfterPeriod: lunchAfter },
  });
  console.log("✅ School week config created");

  // Seed timetable
  const someClasses = await prisma.class.findMany({
    where: { schoolId: school.id, termId: term1.id },
    select: { id: true, name: true, teacherId: true, classroomId: true },
    take: 6,
  });
  const somePeriods = await prisma.period.findMany({
    where: { schoolId: school.id, yearId: schoolYear.id },
    orderBy: { startTime: "asc" },
    select: { id: true },
    take: 4,
  });
  const days = workingDays.slice(0, 5);
  const timetableRows: any[] = [];
  for (let d = 0; d < days.length; d++) {
    for (let p = 0; p < somePeriods.length; p++) {
      const cls = someClasses[(d + p) % someClasses.length];
      timetableRows.push({
        schoolId: school.id,
        termId: term1.id,
        dayOfWeek: days[d],
        periodId: somePeriods[p].id,
        classId: cls.id,
        teacherId: cls.teacherId,
        classroomId: cls.classroomId,
        weekOffset: 0,
      });
    }
  }
  if (timetableRows.length > 0) {
    await prisma.timetable.createMany({ data: timetableRows, skipDuplicates: true });
  }
  console.log("✅ Timetable created");

  // Seed library books
  await ensureLibraryBooks(school.id);

  // Seed new modules
  await ensureSchoolBranding(school.id);
  await ensureAnnouncements(school.id, someClasses);
  await ensureFeeStructures(school.id, someClasses, students);
  await ensureExams(school.id, someClasses, subjects, students);
  await ensureAdmissions(school.id);

  console.log("✅✅✅ Seed completed successfully for Port Sudan International School!");
  console.log(`📊 Summary:`);
  console.log(`   - School: ${school.name}`);
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Classes: ${someClasses.length}`);
  console.log(`   - Year Levels: ${yearLevels.length}`);
  console.log(`   - Subjects: ${subjects.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


