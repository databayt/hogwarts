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
    { email: "admin@demo.databayt.org", role: UserRole.ADMIN },
    { email: "accountant@demo.databayt.org", role: UserRole.ACCOUNTANT },
    { email: "teacher@demo.databayt.org", role: UserRole.TEACHER },
    { email: "student@demo.databayt.org", role: UserRole.STUDENT },
    { email: "parent@demo.databayt.org", role: UserRole.GUARDIAN },
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
  const booksData = [];
  const genres = ["Fiction", "Science", "History", "Mathematics", "Literature", "Biography", "Technology", "Philosophy", "Arts", "Geography"];

  for (let i = 0; i < 100; i++) {
    booksData.push({
      schoolId,
      title: `Book Title ${i + 1}`,
      author: `Author ${String.fromCharCode(65 + (i % 26))}`,
      genre: genres[i % genres.length],
      rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
      coverColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      description: `A comprehensive ${genres[i % genres.length].toLowerCase()} book for educational purposes.`,
      summary: `This book covers important topics in ${genres[i % genres.length].toLowerCase()} and is suitable for students and educators.`,
      totalCopies: Math.floor(Math.random() * 5) + 1,
      availableCopies: Math.floor(Math.random() * 5) + 1,
      coverUrl: "/placeholder-book-cover.jpg",
    });
  }

  const existingBooks = await prisma.book.findMany({
    where: { schoolId },
    select: { title: true },
  });

  const existingTitles = new Set(existingBooks.map((b) => b.title));
  const newBooks = booksData.filter((book) => !existingTitles.has(book.title));

  if (newBooks.length > 0) {
    await prisma.book.createMany({
      data: newBooks,
      skipDuplicates: true,
    });
    console.log(`✅ Seeded ${newBooks.length} library books`);
  } else {
    console.log("✅ Library books already exist");
  }
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

  console.log("");
  console.log("✅✅✅ Demo seed completed successfully!");
  console.log("");
  console.log("📊 Summary:");
  console.log(`   - School: ${school.name}`);
  console.log(`   - Domain: ${school.domain} → demo.databayt.org`);
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Classes: ${classes.length}`);
  console.log(`   - Library Books: 100`);
  console.log(`   - Assignments: 60`);
  console.log(`   - Exams: 12`);
  console.log(`   - LMS Courses: 10 (with chapters and lessons)`);
  console.log("");
  console.log("🔐 Demo Credentials (password: 1234):");
  console.log("   - admin@demo.databayt.org");
  console.log("   - teacher@demo.databayt.org");
  console.log("   - student@demo.databayt.org");
  console.log("   - parent@demo.databayt.org");
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
