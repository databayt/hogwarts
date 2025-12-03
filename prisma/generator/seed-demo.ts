/*
  Comprehensive Demo Seed for Demo School
  - Creates demo.databayt.org with complete data across ALL modules
  - Password: 1234 for ALL users (simple for demo purposes)
  - 150 students, 25 teachers, full academic year data
  - 100% module coverage: academics, library, fees, exams, LMS, etc.
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
  AnnouncementScope,
  QuestionType,
  DifficultyLevel,
  BloomLevel,
  QuestionSource
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { seedLibraryBooks } from "../seed/library.seed";

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

// Arabic/Sudanese names for realistic demo data
const MALE_FIRST_NAMES = [
  "Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar",
  "Abdullah", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir",
  "Hamza", "Idris", "Jamal", "Nabil", "Rashid", "Saeed", "Waleed", "Zain"
];

const FEMALE_FIRST_NAMES = [
  "Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla",
  "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal",
  "Mona", "Rehab", "Safaa", "Tahani", "Widad", "Yasmin", "Zainab", "Amal"
];

const SURNAMES = [
  "Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih",
  "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik",
  "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Abbas", "Badawi", "Elsayed"
];

const DEMO_SCHOOL: SchoolSeedInput = {
  domain: "demo",
  name: "Demo International School",
  email: "info@demo.databayt.org",
  website: "https://demo.databayt.org",
  planType: "enterprise",
  maxStudents: 1000,
  maxTeachers: 100,
};

// Simple password for demo: 1234
const DEMO_PASSWORD = "1234";

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

async function ensureDemoUsers(schoolId: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Developer (platform-wide, not tied to a school)
  const existingDev = await prisma.user.findFirst({
    where: { email: "dev@platform.local", schoolId: null }
  });
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

  // Fixed demo credentials
  const demoAccounts = [
    { email: "admin@databayt.org", role: UserRole.ADMIN },
    { email: "accountant@databayt.org", role: UserRole.ACCOUNTANT },
    { email: "teacher@databayt.org", role: UserRole.TEACHER },
    { email: "student@databayt.org", role: UserRole.STUDENT },
    { email: "parent@databayt.org", role: UserRole.GUARDIAN },
  ];

  for (const account of demoAccounts) {
    await prisma.user.upsert({
      where: { email_schoolId: { email: account.email, schoolId } },
      update: {},
      create: {
        email: account.email,
        role: account.role,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });
  }

  console.log("✅ Demo user accounts created (password: 1234)");
}

function timeAt(hour: number, minute = 0) {
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

  // Periods (8 periods)
  const periodsData = [
    { name: "Period 1", startTime: timeAt(8, 0), endTime: timeAt(8, 45) },
    { name: "Period 2", startTime: timeAt(8, 50), endTime: timeAt(9, 35) },
    { name: "Period 3", startTime: timeAt(9, 40), endTime: timeAt(10, 25) },
    { name: "Period 4", startTime: timeAt(10, 30), endTime: timeAt(11, 15) },
    { name: "Period 5", startTime: timeAt(11, 45), endTime: timeAt(12, 30) },
    { name: "Period 6", startTime: timeAt(12, 35), endTime: timeAt(13, 20) },
    { name: "Period 7", startTime: timeAt(13, 25), endTime: timeAt(14, 10) },
    { name: "Period 8", startTime: timeAt(14, 15), endTime: timeAt(15, 0) },
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

  const term2 = await prisma.term.upsert({
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

  // Year Levels (Grades 7-12)
  const levelNames = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
  for (const [index, levelName] of levelNames.entries()) {
    await prisma.yearLevel.upsert({
      where: { schoolId_levelName: { schoolId, levelName } },
      update: {},
      create: { schoolId, levelName, levelOrder: index + 1 },
    });
  }
  const yearLevels = await prisma.yearLevel.findMany({ where: { schoolId }, orderBy: { levelOrder: "asc" } });

  console.log("✅ Academic structure created");
  return { schoolYear, term1, term2, periods, yearLevels };
}

async function ensureDepartmentsAndSubjects(schoolId: string) {
  const departmentNames = [
    "Languages",
    "Sciences",
    "Mathematics",
    "Humanities",
    "Arts",
    "Physical Education",
    "Religious Studies",
    "ICT"
  ];

  const departments = [];
  for (const departmentName of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { schoolId_departmentName: { schoolId, departmentName } },
      update: {},
      create: { schoolId, departmentName },
    });
    departments.push(dept);
  }

  const subjectsInput = [
    { subjectName: "English Language", departmentName: "Languages" },
    { subjectName: "Arabic Language", departmentName: "Languages" },
    { subjectName: "French", departmentName: "Languages" },
    { subjectName: "Mathematics", departmentName: "Mathematics" },
    { subjectName: "Advanced Mathematics", departmentName: "Mathematics" },
    { subjectName: "Physics", departmentName: "Sciences" },
    { subjectName: "Chemistry", departmentName: "Sciences" },
    { subjectName: "Biology", departmentName: "Sciences" },
    { subjectName: "Environmental Science", departmentName: "Sciences" },
    { subjectName: "History", departmentName: "Humanities" },
    { subjectName: "Geography", departmentName: "Humanities" },
    { subjectName: "Economics", departmentName: "Humanities" },
    { subjectName: "Art", departmentName: "Arts" },
    { subjectName: "Music", departmentName: "Arts" },
    { subjectName: "Physical Education", departmentName: "Physical Education" },
    { subjectName: "Sports", departmentName: "Physical Education" },
    { subjectName: "Islamic Studies", departmentName: "Religious Studies" },
    { subjectName: "Computer Science", departmentName: "ICT" },
    { subjectName: "Information Technology", departmentName: "ICT" },
    { subjectName: "Digital Literacy", departmentName: "ICT" },
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
  console.log("✅ Departments and subjects created");
  return { departments, subjects };
}

async function ensureClassrooms(schoolId: string) {
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
    where: { schoolId_name: { schoolId, name: "Computer Lab" } },
    update: {},
    create: { schoolId, name: "Computer Lab" },
  });
  const ctArt = await prisma.classroomType.upsert({
    where: { schoolId_name: { schoolId, name: "Art Studio" } },
    update: {},
    create: { schoolId, name: "Art Studio" },
  });
  const ctGym = await prisma.classroomType.upsert({
    where: { schoolId_name: { schoolId, name: "Gymnasium" } },
    update: {},
    create: { schoolId, name: "Gymnasium" },
  });

  const roomSeeds = [
    { name: "Room 101", typeId: ctLecture.id, capacity: 30 },
    { name: "Room 102", typeId: ctLecture.id, capacity: 30 },
    { name: "Room 103", typeId: ctLecture.id, capacity: 30 },
    { name: "Room 104", typeId: ctLecture.id, capacity: 30 },
    { name: "Room 201", typeId: ctLecture.id, capacity: 30 },
    { name: "Room 202", typeId: ctLecture.id, capacity: 30 },
    { name: "Room 203", typeId: ctLecture.id, capacity: 30 },
    { name: "Room 204", typeId: ctLecture.id, capacity: 30 },
    { name: "Science Lab 1", typeId: ctLab.id, capacity: 24 },
    { name: "Science Lab 2", typeId: ctLab.id, capacity: 24 },
    { name: "Science Lab 3", typeId: ctLab.id, capacity: 24 },
    { name: "Computer Lab 1", typeId: ctComputer.id, capacity: 28 },
    { name: "Computer Lab 2", typeId: ctComputer.id, capacity: 28 },
    { name: "Art Studio", typeId: ctArt.id, capacity: 20 },
    { name: "Music Room", typeId: ctArt.id, capacity: 20 },
    { name: "Gymnasium", typeId: ctGym.id, capacity: 50 },
  ];

  const classrooms = [];
  for (const r of roomSeeds) {
    const created = await prisma.classroom.upsert({
      where: { schoolId_roomName: { schoolId, roomName: r.name } },
      update: {},
      create: { schoolId, typeId: r.typeId, roomName: r.name, capacity: r.capacity },
    });
    classrooms.push(created);
  }

  console.log("✅ Classrooms created");
  return { classrooms };
}

function getRandomName(gender: "M" | "F"): { firstName: string; surname: string } {
  const firstName = gender === "M"
    ? MALE_FIRST_NAMES[Math.floor(Math.random() * MALE_FIRST_NAMES.length)]
    : FEMALE_FIRST_NAMES[Math.floor(Math.random() * FEMALE_FIRST_NAMES.length)];
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  return { firstName, surname };
}

async function ensureTeachers(schoolId: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Create 25 teachers
  const teacherNames = [];
  for (let i = 0; i < 25; i++) {
    const gender = i % 2 === 0 ? "M" : "F";
    const name = getRandomName(gender);
    teacherNames.push({ ...name, gender });
  }

  const teachers = [];
  for (const t of teacherNames) {
    const email = `${t.firstName.toLowerCase()}.${t.surname.toLowerCase()}@demo.databayt.org`;

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

    const teacher = await prisma.teacher.upsert({
      where: { schoolId_emailAddress: { schoolId, emailAddress: email } },
      update: {},
      create: {
        schoolId,
        givenName: t.firstName,
        surname: t.surname,
        gender: t.gender,
        emailAddress: email,
        userId: user.id,
      },
    });

    teachers.push({ id: teacher.id, userId: user.id, emailAddress: email });
  }

  console.log("✅ 25 teachers created");
  return { teachers };
}

async function ensureStudentsAndGuardians(schoolId: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Guardian types
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

  // Create 150 students (25 per grade)
  const students = [];

  for (let i = 0; i < 150; i++) {
    const gender = i % 2 === 0 ? "M" : "F";
    const studentName = getRandomName(gender);
    const fatherName = getRandomName("M");
    const motherName = getRandomName("F");
    const familySurname = studentName.surname;

    // Create parents
    const fatherEmail = `${fatherName.firstName.toLowerCase()}.${familySurname.toLowerCase()}.father.${i}@demo.databayt.org`;
    const motherEmail = `${motherName.firstName.toLowerCase()}.${familySurname.toLowerCase()}.mother.${i}@demo.databayt.org`;

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
        givenName: fatherName.firstName,
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
        givenName: motherName.firstName,
        surname: familySurname,
        emailAddress: motherEmail,
        userId: motherUser.id,
      },
    });

    // Create student
    const studentEmail = `${studentName.firstName.toLowerCase()}.${familySurname.toLowerCase()}.${i}@demo.databayt.org`;
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

    // Age based on grade (grades 7-12, ages 12-17)
    const gradeIndex = Math.floor(i / 25); // 0-5
    const age = 12 + gradeIndex;
    const dobYear = new Date().getFullYear() - age;
    const dob = new Date(Date.UTC(dobYear, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 })));

    const existingStudent = await prisma.student.findUnique({
      where: { userId: studentUser.id },
    });

    const student = existingStudent ?? await prisma.student.create({
      data: {
        schoolId,
        givenName: studentName.firstName,
        middleName: gender === "M" ? "Demo" : "Demo",
        surname: familySurname,
        dateOfBirth: dob,
        gender,
        userId: studentUser.id,
      },
    });

    // Link guardians
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

    students.push({ id: student.id, gradeIndex });
  }

  console.log("✅ 150 students and 150 guardians created");
  return { students };
}

async function ensureClasses(
  schoolId: string,
  termId: string,
  periods: any[],
  classrooms: any[],
  subjects: any[],
  teachers: any[],
  students: any[]
) {
  // Create 24 classes (4 per grade level)
  const coreSubjects = subjects.filter(s =>
    ["English Language", "Mathematics", "Physics", "Chemistry"].includes(s.subjectName)
  );

  const classes = [];

  for (let grade = 0; grade < 6; grade++) {
    for (let section = 0; section < 4; section++) {
      const subject = coreSubjects[section % coreSubjects.length];
      const teacher = teachers[(grade * 4 + section) % teachers.length];
      const classroom = classrooms[section % classrooms.length];
      const startPeriod = periods[(section * 2) % periods.length];
      const endPeriod = periods[((section * 2) + 1) % periods.length];

      const className = `Grade ${grade + 7} ${subject.subjectName} Section ${String.fromCharCode(65 + section)}`;

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
      classes.push({ id: clazz.id, grade, section });

      // Enroll students from this grade
      const gradeStudents = students.filter(s => s.gradeIndex === grade);
      await prisma.studentClass.createMany({
        data: gradeStudents.map((s) => ({ schoolId, studentId: s.id, classId: clazz.id })),
        skipDuplicates: true,
      });
    }
  }

  console.log("✅ 24 classes created with enrollments");
  return { classes };
}

async function ensureLibrary(schoolId: string) {
  // Use the comprehensive library seed with Arabic and English books
  await seedLibraryBooks(prisma, schoolId);
}

async function ensureAssignments(
  schoolId: string,
  classes: any[],
  students: any[]
) {
  // Create 60 assignments (minimum 10 per subject)
  // Create assignments and collect submission data
  const assignmentSubmissions = [];

  for (let i = 0; i < 60; i++) {
    const clazz = classes[i % classes.length];

    const assignment = await prisma.assignment.create({
      data: {
        schoolId,
        classId: clazz.id,
        title: `Assignment ${i + 1}`,
        description: `Complete the ${i + 1} assignment tasks as described in class.`,
        type: i % 3 === 0 ? AssessmentType.HOMEWORK : i % 3 === 1 ? AssessmentType.PROJECT : AssessmentType.QUIZ,
        status: AssessmentStatus.PUBLISHED,
        totalPoints: "100.00",
        weight: (10).toFixed(2),
        dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000),
        publishDate: new Date(),
      },
    });

    // Collect submissions for students in this class
    const enrolledStudents = await prisma.studentClass.findMany({
      where: { classId: clazz.id },
      select: { studentId: true },
    });

    for (const enrollment of enrolledStudents.slice(0, 20)) {
      assignmentSubmissions.push({
        schoolId,
        assignmentId: assignment.id,
        studentId: enrollment.studentId,
        status: Math.random() > 0.3 ? SubmissionStatus.SUBMITTED : SubmissionStatus.NOT_SUBMITTED,
        attachments: [],
        content: Math.random() > 0.3 ? `Submission for assignment ${i + 1}` : null,
      });
    }
  }

  // Batch create all submissions at once
  if (assignmentSubmissions.length > 0) {
    await prisma.assignmentSubmission.createMany({
      data: assignmentSubmissions,
      skipDuplicates: true,
    });
  }

  console.log(`✅ 60 assignments with ${assignmentSubmissions.length} submissions created`);
}

async function ensureExams(
  schoolId: string,
  classes: any[],
  subjects: any[],
  students: any[]
) {
  // Create 12 exams (2 per major subject)
  const majorSubjects = subjects.filter(s =>
    ["English Language", "Mathematics", "Physics", "Chemistry", "Biology", "History"].includes(s.subjectName)
  );

  const examResults = [];

  for (let i = 0; i < 12; i++) {
    const subject = majorSubjects[i % majorSubjects.length];
    const clazz = classes.find(c => c.id) || classes[0];

    const exam = await prisma.exam.create({
      data: {
        schoolId,
        title: `${subject.subjectName} Exam ${Math.floor(i / 6) + 1}`,
        description: `${i % 2 === 0 ? "Mid-term" : "Final"} examination for ${subject.subjectName}`,
        classId: clazz.id,
        subjectId: subject.id,
        examDate: new Date(Date.now() + i * 14 * 24 * 60 * 60 * 1000),
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 50,
        examType: i % 2 === 0 ? ExamType.MIDTERM : ExamType.FINAL,
        status: i < 6 ? ExamStatus.COMPLETED : ExamStatus.PLANNED,
      },
    });

    // Collect exam results for completed exams
    if (i < 6) {
      for (const student of students) {
        const marks = faker.number.int({ min: 45, max: 98 });
        examResults.push({
          schoolId,
          examId: exam.id,
          studentId: student.id,
          marksObtained: marks,
          totalMarks: 100,
          percentage: marks,
          grade: marks >= 90 ? "A" : marks >= 80 ? "B" : marks >= 70 ? "C" : marks >= 60 ? "D" : "F",
          isAbsent: false,
        });
      }
    }
  }

  // Batch create all exam results at once
  if (examResults.length > 0) {
    await prisma.examResult.createMany({
      data: examResults,
      skipDuplicates: true,
    });
  }

  console.log(`✅ 12 exams with ${examResults.length} results created`);
}

async function ensureAttendance(
  schoolId: string,
  classes: any[],
  students: any[]
) {
  const today = new Date();

  // Create attendance for last 20 school days
  for (let dayOffset = 0; dayOffset < 20; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const clazz of classes.slice(0, 10)) {
      const enrolledStudents = await prisma.studentClass.findMany({
        where: { classId: clazz.id },
        select: { studentId: true },
      });

      const attendanceRecords = enrolledStudents.map((enrollment) => ({
        schoolId,
        studentId: enrollment.studentId,
        classId: clazz.id,
        date: dateOnly,
        status: Math.random() > 0.1 ? AttendanceStatus.PRESENT : Math.random() > 0.5 ? AttendanceStatus.ABSENT : AttendanceStatus.LATE,
      }));

      await prisma.attendance.createMany({
        data: attendanceRecords,
        skipDuplicates: true,
      });
    }
  }

  console.log("✅ Full month of attendance data created");
}

async function ensureFees(
  schoolId: string,
  students: any[]
) {
  const academicYear = "2025-2026";

  // Create fee structures for each grade
  const feeStructures = [];
  for (let grade = 0; grade < 6; grade++) {
    const feeStructure = await prisma.feeStructure.create({
      data: {
        schoolId,
        name: `Grade ${grade + 7} Annual Fee 2025-2026`,
        academicYear,
        tuitionFee: "15000.00",
        admissionFee: grade === 0 ? "2000.00" : null,
        registrationFee: "500.00",
        examFee: "1000.00",
        libraryFee: "300.00",
        laboratoryFee: "800.00",
        sportsFee: "400.00",
        totalAmount: grade === 0 ? "20000.00" : "18000.00",
        installments: 2,
        isActive: true,
      },
    });
    feeStructures.push({ structure: feeStructure, grade });
  }

  // Assign fees to all students
  for (const student of students) {
    const feeStructure = feeStructures.find(f => f.grade === student.gradeIndex);
    if (!feeStructure) continue;

    const feeAssignment = await prisma.feeAssignment.upsert({
      where: {
        studentId_feeStructureId_academicYear: {
          studentId: student.id,
          feeStructureId: feeStructure.structure.id,
          academicYear,
        },
      },
      update: {},
      create: {
        schoolId,
        studentId: student.id,
        feeStructureId: feeStructure.structure.id,
        academicYear,
        finalAmount: feeStructure.structure.totalAmount,
        status: Math.random() > 0.2 ? FeeStatus.PAID : FeeStatus.PENDING,
      },
    });

    // Create payments for 80% of students
    if (Math.random() > 0.2) {
      const paymentNumber = `PAY-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`;

      await prisma.payment.upsert({
        where: { paymentNumber },
        update: {},
        create: {
          schoolId,
          feeAssignmentId: feeAssignment.id,
          studentId: student.id,
          paymentNumber,
          amount: feeStructure.structure.totalAmount,
          paymentDate: new Date(),
          paymentMethod: Math.random() > 0.5 ? PaymentMethod.CASH : Math.random() > 0.5 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CHEQUE,
          receiptNumber: `RCP-2025-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`,
          status: PaymentStatus.SUCCESS,
        },
      });
    }
  }

  console.log("✅ Fee structures and payments created");
}

async function ensureLMS(schoolId: string, teachers: any[]) {
  // Create categories
  const categories = [
    { name: "Programming", schoolId },
    { name: "Mathematics", schoolId },
    { name: "Science", schoolId },
    { name: "Languages", schoolId },
    { name: "Arts", schoolId },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const existing = await prisma.streamCategory.findFirst({
      where: { name: cat.name, schoolId },
    });
    if (!existing) {
      const created = await prisma.streamCategory.create({ data: cat });
      createdCategories.push(created);
    } else {
      createdCategories.push(existing);
    }
  }

  // Create 10 courses (most free for demo purposes)
  const courses = [
    {
      title: "Introduction to Programming",
      slug: "intro-programming",
      description: "Learn programming fundamentals with Python",
      price: 0,
      categoryId: createdCategories[0]?.id,
      imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
      isPublished: true,
    },
    {
      title: "Advanced Mathematics",
      slug: "advanced-mathematics",
      description: "Master calculus, algebra, and trigonometry",
      price: 0,
      categoryId: createdCategories[1]?.id,
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
      isPublished: true,
    },
    {
      title: "Physics Fundamentals",
      slug: "physics-fundamentals",
      description: "Understanding physics concepts and applications",
      price: 0,
      categoryId: createdCategories[2]?.id,
      imageUrl: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa",
      isPublished: true,
    },
    {
      title: "English Language Mastery",
      slug: "english-language",
      description: "Improve your English communication skills",
      price: 0,
      categoryId: createdCategories[3]?.id,
      imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d",
      isPublished: true,
    },
    {
      title: "Arabic Language & Literature",
      slug: "arabic-literature",
      description: "Explore Arabic language, grammar, and classic literature",
      price: 0,
      categoryId: createdCategories[3]?.id,
      imageUrl: "https://images.unsplash.com/photo-1544716278-e513176f20b5",
      isPublished: true,
    },
    {
      title: "Islamic Studies",
      slug: "islamic-studies",
      description: "Learn about Islamic history, teachings, and culture",
      price: 0,
      categoryId: createdCategories[3]?.id,
      imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae",
      isPublished: true,
    },
    {
      title: "Chemistry Basics",
      slug: "chemistry-basics",
      description: "Introduction to chemistry principles and experiments",
      price: 0,
      categoryId: createdCategories[2]?.id,
      imageUrl: "https://images.unsplash.com/photo-1532634733-cae1395e440f",
      isPublished: true,
    },
    {
      title: "World History",
      slug: "world-history",
      description: "Journey through major historical events and civilizations",
      price: 0,
      categoryId: createdCategories[3]?.id,
      imageUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1",
      isPublished: true,
    },
    {
      title: "Digital Art & Design",
      slug: "digital-art",
      description: "Create digital masterpieces using modern tools",
      price: 49.99,
      categoryId: createdCategories[4]?.id,
      imageUrl: "https://images.unsplash.com/photo-1561998338-13ad7883b20f",
      isPublished: true,
    },
    {
      title: "Advanced Programming",
      slug: "advanced-programming",
      description: "Master advanced programming concepts and algorithms",
      price: 29.99,
      categoryId: createdCategories[0]?.id,
      imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713",
      isPublished: true,
    },
  ];

  for (const courseData of courses) {
    const existingCourse = await prisma.streamCourse.findFirst({
      where: { slug: courseData.slug, schoolId },
    });

    if (!existingCourse) {
      const course = await prisma.streamCourse.create({
        data: {
          ...courseData,
          schoolId,
          userId: teachers[0]?.userId,
        },
      });

      // Create 3 chapters per course
      for (let c = 0; c < 3; c++) {
        const chapter = await prisma.streamChapter.create({
          data: {
            title: `Chapter ${c + 1}`,
            description: `Chapter ${c + 1} content`,
            position: c + 1,
            isPublished: true,
            courseId: course.id,
          },
        });

        // Create 5 lessons per chapter
        for (let l = 0; l < 5; l++) {
          await prisma.streamLesson.create({
            data: {
              title: `Lesson ${l + 1}`,
              position: l + 1,
              duration: 30 + l * 5,
              isPublished: true,
              isFree: l === 0,
              chapterId: chapter.id,
            },
          });
        }
      }
    }
  }

  console.log("✅ LMS courses with chapters and lessons created");
}

async function ensureAnnouncements(schoolId: string, classes: any[]) {
  const announcements = [
    {
      title: "Welcome to Academic Year 2025-2026",
      body: "We are delighted to welcome all students to the new academic year!",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Mid-Term Exams Schedule",
      body: "The mid-term examination schedule has been published.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Parent-Teacher Meeting",
      body: "A parent-teacher meeting is scheduled for next week.",
      scope: AnnouncementScope.class,
      classId: classes[0]?.id,
      published: true,
    },
    {
      title: "Library New Arrivals",
      body: "The school library has received new books.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Sports Day Announcement",
      body: "Annual Sports Day will be held next month.",
      scope: AnnouncementScope.school,
      published: true,
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

  console.log("✅ Announcements created");
}

async function ensureBranding(schoolId: string) {
  await prisma.schoolBranding.upsert({
    where: { schoolId },
    update: {},
    create: {
      schoolId,
      primaryColor: "#3b82f6",
      secondaryColor: "#8b5cf6",
      borderRadius: "md",
      shadow: "lg",
      isPubliclyListed: true,
      allowSelfEnrollment: false,
      requireParentApproval: true,
      informationSharing: "limited-sharing",
    },
  });
  console.log("✅ School branding created");
}

async function ensureQuestionBank(schoolId: string, subjects: any[]) {
  // Get a teacher to use as createdBy
  const teacher = await prisma.teacher.findFirst({
    where: { schoolId }
  });

  if (!teacher) {
    console.log("⚠️ No teacher found, skipping question bank seed");
    return [];
  }

  const mathSubject = subjects.find(s => s.subjectName === "Mathematics");
  const physicsSubject = subjects.find(s => s.subjectName === "Physics");
  const chemistrySubject = subjects.find(s => s.subjectName === "Chemistry");
  const biologySubject = subjects.find(s => s.subjectName === "Biology");
  const englishSubject = subjects.find(s => s.subjectName === "English Language");
  const arabicSubject = subjects.find(s => s.subjectName === "Arabic Language");
  const historySubject = subjects.find(s => s.subjectName === "History");
  const geographySubject = subjects.find(s => s.subjectName === "Geography");
  const csSubject = subjects.find(s => s.subjectName === "Computer Science");

  const questions = [
    // Mathematics Questions (MCQ, EASY-MEDIUM-HARD, Various Bloom Levels)
    {
      subjectId: mathSubject.id,
      questionText: "What is 15 + 27?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: [
        { text: "42", isCorrect: true },
        { text: "32", isCorrect: false },
        { text: "52", isCorrect: false },
        { text: "40", isCorrect: false }
      ],
      tags: ["arithmetic", "addition", "grade-7"],
      explanation: "15 + 27 = 42",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "Solve for x: 2x + 5 = 15",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 3,
      timeEstimate: 5,
      sampleAnswer: "x = 5",
      tags: ["algebra", "equations", "grade-8"],
      explanation: "Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "What is the derivative of f(x) = x² + 3x - 2?",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.HARD,
      bloomLevel: BloomLevel.APPLY,
      points: 5,
      timeEstimate: 8,
      sampleAnswer: "f'(x) = 2x + 3",
      tags: ["calculus", "derivatives", "grade-12"],
      explanation: "Using power rule: d/dx(x²) = 2x, d/dx(3x) = 3, d/dx(-2) = 0",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "The Pythagorean theorem applies only to right-angled triangles.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ],
      tags: ["geometry", "pythagorean", "grade-9"],
      explanation: "The Pythagorean theorem (a² + b² = c²) only applies to right-angled triangles.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: mathSubject.id,
      questionText: "Calculate the area of a circle with radius 7cm. (Use π ≈ 3.14)",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 2,
      timeEstimate: 4,
      options: [
        { text: "153.86 cm²", isCorrect: true },
        { text: "43.96 cm²", isCorrect: false },
        { text: "21.98 cm²", isCorrect: false },
        { text: "307.72 cm²", isCorrect: false }
      ],
      tags: ["geometry", "circles", "area", "grade-8"],
      explanation: "Area = πr² = 3.14 × 7² = 3.14 × 49 = 153.86 cm²",
      source: QuestionSource.MANUAL
    },

    // Physics Questions
    {
      subjectId: physicsSubject.id,
      questionText: "What is Newton's First Law of Motion?",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 2,
      timeEstimate: 3,
      sampleAnswer: "An object at rest stays at rest and an object in motion stays in motion with the same speed and direction unless acted upon by an unbalanced force.",
      tags: ["mechanics", "newton-laws", "grade-9"],
      explanation: "This is also known as the law of inertia.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: physicsSubject.id,
      questionText: "Calculate the force required to accelerate a 10kg object at 5m/s².",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 3,
      timeEstimate: 5,
      options: [
        { text: "50 N", isCorrect: true },
        { text: "15 N", isCorrect: false },
        { text: "2 N", isCorrect: false },
        { text: "0.5 N", isCorrect: false }
      ],
      tags: ["mechanics", "force", "newton-second-law", "grade-10"],
      explanation: "Using F = ma: F = 10kg × 5m/s² = 50N",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: physicsSubject.id,
      questionText: "Light travels faster in water than in air.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "True", isCorrect: false },
        { text: "False", isCorrect: true }
      ],
      tags: ["optics", "light", "grade-10"],
      explanation: "Light travels slower in water (refractive index ~1.33) than in air (refractive index ~1.00).",
      source: QuestionSource.MANUAL
    },

    // Chemistry Questions
    {
      subjectId: chemistrySubject.id,
      questionText: "What is the chemical symbol for Gold?",
      questionType: QuestionType.FILL_BLANK,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: { acceptedAnswers: ["Au", "AU", "au"], caseSensitive: false },
      tags: ["periodic-table", "elements", "grade-9"],
      explanation: "Gold's chemical symbol is Au, from the Latin 'aurum'.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: chemistrySubject.id,
      questionText: "Balance the equation: H₂ + O₂ → H₂O",
      questionType: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 3,
      timeEstimate: 5,
      sampleAnswer: "2H₂ + O₂ → 2H₂O",
      tags: ["chemical-equations", "balancing", "grade-10"],
      explanation: "We need 2 hydrogen molecules and 1 oxygen molecule to produce 2 water molecules.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: chemistrySubject.id,
      questionText: "What is the pH of a neutral solution at 25°C?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: [
        { text: "7", isCorrect: true },
        { text: "0", isCorrect: false },
        { text: "14", isCorrect: false },
        { text: "3.5", isCorrect: false }
      ],
      tags: ["acids-bases", "ph", "grade-10"],
      explanation: "A neutral solution has equal concentrations of H⁺ and OH⁻ ions, resulting in pH = 7.",
      source: QuestionSource.MANUAL
    },

    // Biology Questions
    {
      subjectId: biologySubject.id,
      questionText: "What is the powerhouse of the cell?",
      questionType: QuestionType.FILL_BLANK,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: { acceptedAnswers: ["mitochondria", "Mitochondria", "mitochondrion"], caseSensitive: false },
      tags: ["cell-biology", "organelles", "grade-9"],
      explanation: "Mitochondria produce ATP through cellular respiration.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: biologySubject.id,
      questionText: "Explain the process of photosynthesis in plants.",
      questionType: QuestionType.ESSAY,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.UNDERSTAND,
      points: 10,
      timeEstimate: 15,
      sampleAnswer: "Photosynthesis is the process by which plants convert light energy into chemical energy. Chlorophyll in the chloroplasts absorbs sunlight, which is used to convert carbon dioxide and water into glucose and oxygen. The equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
      gradingRubric: "Full marks: Complete explanation with equation (10pts). Partial: Missing equation or incomplete explanation (5-7pts). Minimal: Basic understanding only (3-4pts).",
      tags: ["photosynthesis", "plant-biology", "grade-10"],
      explanation: "Photosynthesis occurs in two stages: light-dependent reactions and light-independent reactions (Calvin cycle).",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: biologySubject.id,
      questionText: "DNA stands for Deoxyribonucleic Acid.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ],
      tags: ["genetics", "dna", "grade-11"],
      explanation: "DNA is the molecule that carries genetic information in all living organisms.",
      source: QuestionSource.MANUAL
    },

    // English Questions
    {
      subjectId: englishSubject.id,
      questionText: "What is the plural form of 'child'?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "children", isCorrect: true },
        { text: "childs", isCorrect: false },
        { text: "childrens", isCorrect: false },
        { text: "child's", isCorrect: false }
      ],
      tags: ["grammar", "plurals", "grade-7"],
      explanation: "Child is an irregular noun, and its plural form is children.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: englishSubject.id,
      questionText: "Write a short paragraph (50-100 words) about your favorite season and why you like it.",
      questionType: QuestionType.ESSAY,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.CREATE,
      points: 10,
      timeEstimate: 10,
      sampleAnswer: "My favorite season is autumn. I love watching the leaves change color from green to beautiful shades of red, orange, and yellow. The weather is perfect—not too hot and not too cold. I enjoy walking through parks covered in fallen leaves and the sound they make under my feet. Autumn also brings cozy evenings with hot chocolate and family gatherings during holidays.",
      gradingRubric: "Grammar and spelling (3pts), Content and creativity (4pts), Structure and coherence (3pts)",
      tags: ["writing", "creative", "grade-8"],
      explanation: "This question assesses creative writing and descriptive skills.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: englishSubject.id,
      questionText: "A simile compares two things using 'like' or 'as'.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ],
      tags: ["literature", "figurative-language", "grade-8"],
      explanation: "Example: 'She was as brave as a lion' is a simile.",
      source: QuestionSource.MANUAL
    },

    // Arabic Questions
    {
      subjectId: arabicSubject.id,
      questionText: "ما هو جمع كلمة 'كتاب'؟",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: [
        { text: "كُتُب", isCorrect: true },
        { text: "كتابات", isCorrect: false },
        { text: "كاتب", isCorrect: false },
        { text: "مكتوب", isCorrect: false }
      ],
      tags: ["grammar", "plurals", "grade-7"],
      explanation: "جمع كتاب هو كُتُب (جمع تكسير)",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: arabicSubject.id,
      questionText: "ما هي عاصمة السودان؟",
      questionType: QuestionType.FILL_BLANK,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: { acceptedAnswers: ["الخرطوم", "خرطوم"], caseSensitive: false },
      tags: ["culture", "geography", "grade-7"],
      explanation: "الخرطوم هي عاصمة جمهورية السودان",
      source: QuestionSource.MANUAL
    },

    // History Questions
    {
      subjectId: historySubject.id,
      questionText: "In which year did World War II end?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: [
        { text: "1945", isCorrect: true },
        { text: "1939", isCorrect: false },
        { text: "1918", isCorrect: false },
        { text: "1950", isCorrect: false }
      ],
      tags: ["world-war-2", "modern-history", "grade-10"],
      explanation: "World War II ended in 1945 with the surrender of Japan.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: historySubject.id,
      questionText: "Discuss the main causes of World War I.",
      questionType: QuestionType.ESSAY,
      difficulty: DifficultyLevel.HARD,
      bloomLevel: BloomLevel.ANALYZE,
      points: 15,
      timeEstimate: 20,
      sampleAnswer: "The main causes of World War I include: 1) Militarism - arms race among European powers, 2) Alliances - complex web of treaties, 3) Imperialism - competition for colonies, 4) Nationalism - pride and rivalry among nations. The assassination of Archduke Franz Ferdinand was the immediate trigger that set off these underlying tensions.",
      gradingRubric: "Identification of all 4 main causes (8pts), Analysis and explanation (5pts), Writing quality (2pts)",
      tags: ["world-war-1", "causes", "analysis", "grade-11"],
      explanation: "Remember MAIN: Militarism, Alliances, Imperialism, Nationalism.",
      source: QuestionSource.MANUAL
    },

    // Geography Questions
    {
      subjectId: geographySubject.id,
      questionText: "What is the largest ocean on Earth?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "Pacific Ocean", isCorrect: true },
        { text: "Atlantic Ocean", isCorrect: false },
        { text: "Indian Ocean", isCorrect: false },
        { text: "Arctic Ocean", isCorrect: false }
      ],
      tags: ["oceans", "physical-geography", "grade-7"],
      explanation: "The Pacific Ocean covers about 165 million square kilometers.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: geographySubject.id,
      questionText: "The Nile River is the longest river in the world.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ],
      tags: ["rivers", "africa", "grade-8"],
      explanation: "The Nile River in Africa is approximately 6,650 km long.",
      source: QuestionSource.MANUAL
    },

    // Computer Science Questions
    {
      subjectId: csSubject.id,
      questionText: "What does HTML stand for?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 2,
      options: [
        { text: "HyperText Markup Language", isCorrect: true },
        { text: "High Technology Modern Language", isCorrect: false },
        { text: "Hyper Transfer Markup Language", isCorrect: false },
        { text: "Home Tool Markup Language", isCorrect: false }
      ],
      tags: ["web-development", "html", "grade-9"],
      explanation: "HTML is the standard markup language for creating web pages.",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: csSubject.id,
      questionText: "What is the output of: print(5 + 3 * 2)?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.APPLY,
      points: 2,
      timeEstimate: 3,
      options: [
        { text: "11", isCorrect: true },
        { text: "16", isCorrect: false },
        { text: "13", isCorrect: false },
        { text: "10", isCorrect: false }
      ],
      tags: ["programming", "python", "operators", "grade-10"],
      explanation: "Following order of operations: 3 * 2 = 6, then 5 + 6 = 11",
      source: QuestionSource.MANUAL
    },
    {
      subjectId: csSubject.id,
      questionText: "Binary is a base-2 number system.",
      questionType: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      bloomLevel: BloomLevel.REMEMBER,
      points: 1,
      timeEstimate: 1,
      options: [
        { text: "True", isCorrect: true },
        { text: "False", isCorrect: false }
      ],
      tags: ["number-systems", "binary", "grade-9"],
      explanation: "Binary uses only two digits: 0 and 1.",
      source: QuestionSource.MANUAL
    },
  ];

  // Create all questions
  let createdCount = 0;
  for (const q of questions) {
    const existing = await prisma.questionBank.findFirst({
      where: {
        schoolId,
        subjectId: q.subjectId,
        questionText: q.questionText
      }
    });

    if (!existing) {
      await prisma.questionBank.create({
        data: {
          schoolId,
          createdBy: teacher.id,
          ...q,
          options: q.options ? JSON.parse(JSON.stringify(q.options)) : undefined
        }
      });
      createdCount++;
    }
  }

  // Create analytics for some questions
  const allQuestions = await prisma.questionBank.findMany({ where: { schoolId } });
  for (let i = 0; i < Math.min(15, allQuestions.length); i++) {
    const q = allQuestions[i];
    await prisma.questionAnalytics.upsert({
      where: { questionId: q.id },
      update: {},
      create: {
        schoolId,
        questionId: q.id,
        timesUsed: Math.floor(Math.random() * 20) + 5,
        successRate: Math.random() * 40 + 50, // 50-90%
        avgTimeSpent: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
      }
    });
  }

  console.log(`✅ Question Bank created (${createdCount} new questions, ${allQuestions.length} total)`);
  return allQuestions;
}

// Admission System Seeding
async function ensureAdmissions(schoolId: string) {
  // Create Admission Campaign for 2025-2026
  const campaign = await prisma.admissionCampaign.upsert({
    where: {
      schoolId_name: {
        schoolId,
        name: "Academic Year 2025-2026 Admissions"
      }
    },
    update: {},
    create: {
      schoolId,
      name: "Academic Year 2025-2026 Admissions",
      academicYear: "2025-2026",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-05-31"),
      status: AdmissionStatus.OPEN,
      description: "Open admissions for Academic Year 2025-2026 across all grades (7-12)",
      applicationFee: "500.00",
      totalSeats: 180, // 30 per grade × 6 grades
      requiredDocuments: {
        list: [
          "Birth Certificate",
          "Previous School Transfer Certificate",
          "Previous Year Marksheet",
          "Recent Photograph (2)",
          "Address Proof",
          "Parent ID Proof"
        ]
      },
      eligibilityCriteria: {
        minAge: 12,
        maxAge: 18,
        minPreviousPercentage: 50
      }
    }
  });

  // Create 15 Sample Applications with varied statuses
  const applicationsData = [
    // 5 Admitted (already enrolled as students)
    { status: AdmissionApplicationStatus.ADMITTED, firstName: "Layla", lastName: "Hassan", grade: "Grade 7", meritRank: 1, score: 95 },
    { status: AdmissionApplicationStatus.ADMITTED, firstName: "Kareem", lastName: "Ahmed", grade: "Grade 8", meritRank: 2, score: 93 },
    { status: AdmissionApplicationStatus.ADMITTED, firstName: "Nadia", lastName: "Ibrahim", grade: "Grade 9", meritRank: 3, score: 91 },
    { status: AdmissionApplicationStatus.ADMITTED, firstName: "Tariq", lastName: "Osman", grade: "Grade 10", meritRank: 4, score: 90 },
    { status: AdmissionApplicationStatus.ADMITTED, firstName: "Amira", lastName: "Khalid", grade: "Grade 11", meritRank: 5, score: 88 },

    // 3 Selected (offered admission, awaiting confirmation)
    { status: AdmissionApplicationStatus.SELECTED, firstName: "Yousif", lastName: "Mohamed", grade: "Grade 7", meritRank: 6, score: 87 },
    { status: AdmissionApplicationStatus.SELECTED, firstName: "Salma", lastName: "Ali", grade: "Grade 8", meritRank: 7, score: 85 },
    { status: AdmissionApplicationStatus.SELECTED, firstName: "Hamza", lastName: "Omar", grade: "Grade 9", meritRank: 8, score: 84 },

    // 3 Shortlisted (interview scheduled)
    { status: AdmissionApplicationStatus.INTERVIEW_SCHEDULED, firstName: "Rashid", lastName: "Hassan", grade: "Grade 10", meritRank: 9, score: 82 },
    { status: AdmissionApplicationStatus.INTERVIEW_SCHEDULED, firstName: "Zainab", lastName: "Mustafa", grade: "Grade 11", meritRank: 10, score: 81 },
    { status: AdmissionApplicationStatus.SHORTLISTED, firstName: "Malik", lastName: "Salih", grade: "Grade 12", meritRank: 11, score: 80 },

    // 2 Under Review
    { status: AdmissionApplicationStatus.UNDER_REVIEW, firstName: "Amal", lastName: "Kamal", grade: "Grade 7", meritRank: null, score: null },
    { status: AdmissionApplicationStatus.UNDER_REVIEW, firstName: "Bilal", lastName: "Tariq", grade: "Grade 8", meritRank: null, score: null },

    // 1 Waitlisted
    { status: AdmissionApplicationStatus.WAITLISTED, firstName: "Huda", lastName: "Nabil", grade: "Grade 9", meritRank: 26, score: 75, waitlist: 1 },

    // 1 Rejected
    { status: AdmissionApplicationStatus.REJECTED, firstName: "Samir", lastName: "Bashir", grade: "Grade 10", meritRank: null, score: 45 },
  ];

  for (let i = 0; i < applicationsData.length; i++) {
    const app = applicationsData[i];
    const appNumber = `2025ADM${String(i + 1).padStart(4, '0')}`;

    const existing = await prisma.application.findUnique({
      where: {
        schoolId_applicationNumber: {
          schoolId,
          applicationNumber: appNumber
        }
      }
    });

    if (!existing) {
      await prisma.application.create({
        data: {
          schoolId,
          campaignId: campaign.id,
          applicationNumber: appNumber,
          firstName: app.firstName,
          lastName: app.lastName,
          middleName: "",
          dateOfBirth: new Date(2010, 5, 15 + i),
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          nationality: "Sudanese",
          religion: "Islam",
          email: `${app.firstName.toLowerCase()}.${app.lastName.toLowerCase()}@applicant.demo`,
          phone: `+249-1${String(11111000 + i).padStart(8, '0')}`,
          address: `${100 + i} Main Street`,
          city: "Khartoum",
          state: "Khartoum",
          postalCode: "11111",
          country: "Sudan",
          fatherName: `Father of ${app.firstName}`,
          fatherPhone: `+249-9${String(11111000 + i).padStart(8, '0')}`,
          fatherEmail: `father.${app.lastName.toLowerCase()}@demo.school`,
          motherName: `Mother of ${app.firstName}`,
          motherPhone: `+249-9${String(22222000 + i).padStart(8, '0')}`,
          motherEmail: `mother.${app.lastName.toLowerCase()}@demo.school`,
          previousSchool: i > 4 ? "Previous School Name" : null,
          previousClass: i > 4 ? `Grade ${7 + (i % 6) - 1}` : null,
          previousPercentage: i > 4 ? (70 + (i % 20)).toString() : null,
          applyingForClass: app.grade,
          status: app.status,
          submittedAt: new Date(2025, 2, 15 + i), // Submitted in March 2025
          reviewedAt: app.status !== AdmissionApplicationStatus.UNDER_REVIEW ? new Date(2025, 3, 1 + i) : null,
          entranceScore: app.score ? app.score.toString() : null,
          meritScore: app.score ? app.score.toString() : null,
          meritRank: app.meritRank,
          waitlistNumber: app.waitlist || null,
          admissionOffered: app.status === AdmissionApplicationStatus.SELECTED || app.status === AdmissionApplicationStatus.ADMITTED,
          offerDate: app.status === AdmissionApplicationStatus.SELECTED || app.status === AdmissionApplicationStatus.ADMITTED ? new Date(2025, 3, 10 + i) : null,
          offerExpiryDate: app.status === AdmissionApplicationStatus.SELECTED ? new Date(2025, 3, 25 + i) : null,
          admissionConfirmed: app.status === AdmissionApplicationStatus.ADMITTED,
          confirmationDate: app.status === AdmissionApplicationStatus.ADMITTED ? new Date(2025, 3, 15 + i) : null,
          applicationFeePaid: true,
          paymentDate: new Date(2025, 2, 15 + i)
        }
      });
    }
  }

  console.log("✅ Admission campaign and applications seeded");
}

// Task Management Seeding
async function ensureTasks(schoolId: string) {
  const tasks = [
    // Admin Tasks
    { code: "TASK-001", title: "Review budget for Q2 2025", status: "todo", label: "enhancement", priority: "high", hours: 4 },
    { code: "TASK-002", title: "Approve teacher leave requests", status: "in_progress", label: "feature", priority: "medium", hours: 1 },
    { code: "TASK-003", title: "Update school policies document", status: "done", label: "documentation", priority: "low", hours: 3 },
    { code: "TASK-004", title: "Schedule parent-teacher conferences", status: "todo", label: "feature", priority: "high", hours: 2 },
    { code: "TASK-005", title: "Resolve student transfer request", status: "in_progress", label: "feature", priority: "medium", hours: 2 },

    // Teacher Tasks
    { code: "TASK-006", title: "Grade midterm exam papers - Grade 10", status: "in_progress", label: "feature", priority: "high", hours: 5 },
    { code: "TASK-007", title: "Prepare lesson plan for next week", status: "todo", label: "feature", priority: "medium", hours: 3 },
    { code: "TASK-008", title: "Update attendance records for March", status: "done", label: "feature", priority: "medium", hours: 1 },
    { code: "TASK-009", title: "Create assignment for Chapter 6", status: "todo", label: "feature", priority: "medium", hours: 2 },
    { code: "TASK-010", title: "Respond to parent inquiry about grades", status: "in_progress", label: "feature", priority: "high", hours: 0.5 },

    // System Tasks
    { code: "TASK-011", title: "Backup database (automated)", status: "done", label: "feature", priority: "high", hours: 0 },
    { code: "TASK-012", title: "Generate monthly reports", status: "todo", label: "feature", priority: "medium", hours: 0 },
    { code: "TASK-013", title: "Send attendance alerts to parents", status: "done", label: "feature", priority: "medium", hours: 0 },
    { code: "TASK-014", title: "Process fee payment reminders", status: "in_progress", label: "feature", priority: "high", hours: 0 },
    { code: "TASK-015", title: "Update student progress reports", status: "todo", label: "feature", priority: "low", hours: 0 },

    // Maintenance Tasks
    { code: "TASK-016", title: "Fix library book checkout issue", status: "done", label: "bug", priority: "high", hours: 2 },
    { code: "TASK-017", title: "Update LMS course content", status: "in_progress", label: "enhancement", priority: "medium", hours: 4 },
    { code: "TASK-018", title: "Review and archive old announcements", status: "todo", label: "feature", priority: "low", hours: 1 },
    { code: "TASK-019", title: "Configure QR code attendance system", status: "done", label: "feature", priority: "high", hours: 3 },
    { code: "TASK-020", title: "Prepare annual report for board meeting", status: "todo", label: "documentation", priority: "high", hours: 8 },
  ];

  for (const task of tasks) {
    const existing = await prisma.task.findUnique({
      where: { code: task.code }
    });

    if (!existing) {
      await prisma.task.create({
        data: {
          code: task.code,
          title: task.title,
          status: task.status as any,
          label: task.label as any,
          priority: task.priority as any,
          estimatedHours: task.hours,
          schoolId
        }
      });
    }
  }

  console.log("✅ Task management data seeded (20 tasks)");
}

// Legal & Compliance Seeding
async function ensureLegal(schoolId: string) {
  // Create 3 Legal Documents
  const documents = [
    {
      type: "terms",
      version: "1.0.0",
      title: "Terms of Service",
      content: `# Terms of Service

Welcome to Hogwarts School Management System.

## 1. Acceptance of Terms
By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.

## 2. User Responsibilities
- Maintain confidentiality of your account
- Use the platform only for lawful purposes
- Respect intellectual property rights

## 3. Privacy & Data Protection
Your privacy is important to us. Please review our Privacy Policy.

## 4. Limitation of Liability
The school shall not be liable for any indirect, incidental, special damages.

## 5. Changes to Terms
We reserve the right to modify these terms at any time.

Effective Date: January 1, 2025
Version: 1.0.0`
    },
    {
      type: "privacy",
      version: "1.0.0",
      title: "Privacy Policy",
      content: `# Privacy Policy

Last Updated: January 1, 2025

## Information We Collect
- Personal identification information (name, email, phone)
- Academic records and performance data
- Attendance and behavioral records

## How We Use Your Information
- Provide educational services
- Communicate with students and parents
- Improve our platform and services

## Data Security
We implement appropriate security measures to protect your personal information.

## Your Rights
- Access your personal data
- Request correction or deletion
- Withdraw consent at any time

## Contact Us
For privacy concerns, contact: privacy@demo.school`
    },
    {
      type: "data-processing",
      version: "1.0.0",
      title: "Data Processing Agreement",
      content: `# Data Processing Agreement

## Purpose
This agreement governs the processing of personal data by Hogwarts School.

## Data Processing Principles
- Lawfulness, fairness, and transparency
- Purpose limitation
- Data minimization
- Accuracy
- Storage limitation
- Integrity and confidentiality

## Data Subject Rights
Students and parents have the right to:
- Access their data
- Rectify inaccurate data
- Erase data (right to be forgotten)
- Restrict processing
- Data portability
- Object to processing

## Security Measures
We implement technical and organizational measures to ensure data security.

Effective Date: January 1, 2025`
    }
  ];

  for (const doc of documents) {
    const existing = await prisma.legalDocument.findUnique({
      where: {
        schoolId_type_version: {
          schoolId,
          type: doc.type,
          version: doc.version
        }
      }
    });

    if (!existing) {
      await prisma.legalDocument.create({
        data: {
          schoolId,
          type: doc.type,
          version: doc.version,
          content: doc.content,
          effectiveFrom: new Date("2025-01-01"),
          isActive: true,
          requiresExplicit: true
        }
      });
    }
  }

  // Create consent tracking for some users
  const adminUser = await prisma.user.findFirst({
    where: { schoolId, role: UserRole.ADMIN }
  });

  if (adminUser) {
    for (const doc of documents) {
      const existing = await prisma.legalConsent.findUnique({
        where: {
          schoolId_userId_documentType_documentVersion: {
            schoolId,
            userId: adminUser.id,
            documentType: doc.type,
            documentVersion: doc.version
          }
        }
      });

      if (!existing) {
        await prisma.legalConsent.create({
          data: {
            schoolId,
            userId: adminUser.id,
            documentType: doc.type,
            documentVersion: doc.version,
            consentType: "explicit",
            ipAddress: "192.168.1.1",
            userAgent: "Mozilla/5.0 (Demo Browser)",
            consentedAt: new Date("2025-01-02")
          }
        });
      }
    }
  }

  console.log("✅ Legal documents and consent tracking seeded");
}

async function main() {
  console.log("🌱 Starting comprehensive demo seed...");
  console.log("📋 School: Demo International School");
  console.log("🔑 All passwords: 1234");
  console.log("");

  const school = await ensureSchool(DEMO_SCHOOL);
  console.log(`✅ School: ${school.name} (${school.domain})`);

  await ensureDemoUsers(school.id);

  const { schoolYear, term1, term2, periods, yearLevels } = await ensureAcademicStructure(school.id);
  const { departments, subjects } = await ensureDepartmentsAndSubjects(school.id);
  const { classrooms } = await ensureClassrooms(school.id);
  const { teachers } = await ensureTeachers(school.id);
  const { students } = await ensureStudentsAndGuardians(school.id);

  // Assign students to year levels
  await prisma.studentYearLevel.createMany({
    data: students.map((st) => ({
      schoolId: school.id,
      studentId: st.id,
      levelId: yearLevels[st.gradeIndex].id,
      yearId: schoolYear.id,
    })),
    skipDuplicates: true,
  });

  const { classes } = await ensureClasses(
    school.id,
    term1.id,
    periods,
    classrooms,
    subjects,
    teachers,
    students
  );

  await ensureLibrary(school.id);
  await ensureAssignments(school.id, classes, students);
  await ensureExams(school.id, classes, subjects, students);
  await ensureAttendance(school.id, classes, students);
  await ensureFees(school.id, students);
  await ensureLMS(school.id, teachers);
  await ensureAnnouncements(school.id, classes);
  await ensureBranding(school.id);

  // Seed Question Bank for Exams
  await ensureQuestionBank(school.id, subjects);

  // NEW: Seed additional modules
  await ensureAdmissions(school.id);
  await ensureTasks(school.id);
  await ensureLegal(school.id);

  console.log("");
  console.log("✅✅✅ Demo seed completed successfully!");
  console.log("");
  // Get final counts
  const questionBankCount = await prisma.questionBank.count({ where: { schoolId: school.id } });
  const admissionApplications = await prisma.application.count({ where: { schoolId: school.id } });
  const taskCount = await prisma.task.count({ where: { schoolId: school.id } });
  const legalDocsCount = await prisma.legalDocument.count({ where: { schoolId: school.id } });

  console.log("📊 Summary:");
  console.log(`   - School: ${school.name}`);
  console.log(`   - Domain: ${school.domain} → demo.ed.databayt.org`);
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Library Books: 46 (20 Arabic + 26 English)`);
  console.log(`   - Assignments: 60`);
  console.log(`   - Exams: 12`);
  console.log(`   - Question Bank: ${questionBankCount} questions`);
  console.log(`   - LMS Courses: 10 (with chapters and lessons)`);
  console.log(`   - Admission Applications: ${admissionApplications}`);
  console.log(`   - Tasks: ${taskCount}`);
  console.log(`   - Legal Documents: ${legalDocsCount}`);
  console.log("");
  console.log("🔐 Demo Credentials (password: 1234):");
  console.log("   - admin@databayt.org");
  console.log("   - accountant@databayt.org");
  console.log("   - teacher@databayt.org");
  console.log("   - student@databayt.org");
  console.log("   - parent@databayt.org");
  console.log("   + 25 teachers (e.g., aisha.hassan@demo.databayt.org)");
  console.log("   + 150 students (e.g., ahmed.mohammed.001@demo.databayt.org)");
  console.log("   + 300 parents/guardians");
  console.log("");
  console.log("🚀 Access demo at: https://demo.databayt.org");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
