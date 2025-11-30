/**
 * Demo-Only Seed Script for Hogwarts School Automation Platform
 *
 * This script:
 * 1. DELETES all existing data from the database
 * 2. Creates ONLY the demo school (demo.databayt.org)
 * 3. Populates comprehensive data to mimic a real school
 *
 * Usage: pnpm db:seed:demo-only
 *
 * Demo Credentials:
 * - Developer: dev@databayt.org / 1234
 * - Admin: admin@demo.databayt.org / 1234
 * - Accountant: accountant@demo.databayt.org / 1234
 * - Teacher: ahmed.hassan@demo.databayt.org / 1234
 * - Student: student@demo.databayt.org / 1234
 * - Guardian: guardian@demo.databayt.org / 1234
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
  Gender,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { seedFinanceModule } from "./seed-modules/finance";
import { seedAdmissionModule } from "./seed-modules/admission";

const prisma = new PrismaClient();

// Demo password for all accounts
const DEMO_PASSWORD = "1234";

// Demo school configuration
const DEMO_SCHOOL = {
  domain: "demo",
  name: "Demo International School",
  email: "info@demo.databayt.org",
  website: "https://demo.databayt.org",
  planType: "enterprise",
  maxStudents: 5000,
  maxTeachers: 500,
};

// Sudanese/Arabic/African names for realistic demo data
const SUDANESE_MALE_NAMES = [
  "Ahmed", "Mohamed", "Osman", "Ibrahim", "Khalid", "Hassan", "Ali", "Omar",
  "Abdalla", "Mustafa", "Kamal", "Tariq", "Yousif", "Salih", "Malik", "Bashir",
  "Hamza", "Idris", "Jamal", "Nabil", "Rashid", "Saeed", "Waleed", "Zain",
  "Amin", "Farouk", "Gamal", "Hisham", "Imad", "Jaafar", "Lutfi", "Munir",
];

const SUDANESE_FEMALE_NAMES = [
  "Fatima", "Aisha", "Mariam", "Amina", "Khadija", "Huda", "Sara", "Layla",
  "Sumaya", "Rania", "Noura", "Zahra", "Samira", "Hana", "Dalal", "Nawal",
  "Mona", "Rehab", "Safaa", "Tahani", "Widad", "Yasmin", "Zainab", "Amal",
  "Basma", "Dalia", "Eman", "Fadia", "Ghada", "Hiba", "Inas", "Jumana",
];

const SUDANESE_SURNAMES = [
  "Hassan", "Ali", "Ahmed", "Mohamed", "Ibrahim", "Osman", "Yousif", "Salih",
  "Abdalla", "Mustafa", "Khalid", "Omar", "Abdelrahman", "Kamal", "Malik",
  "Bashir", "Hamza", "Idris", "Jamal", "Nabil", "Abbas", "Badawi", "Elsayed",
  "Fadl", "Gaber", "Habib", "Ismail", "Jafar", "Karam", "Latif", "Mahdi",
];

// Helper to generate Sudanese names
function getSudaneseName(gender: "M" | "F"): { givenName: string; surname: string } {
  const givenName = gender === "M"
    ? SUDANESE_MALE_NAMES[Math.floor(Math.random() * SUDANESE_MALE_NAMES.length)]
    : SUDANESE_FEMALE_NAMES[Math.floor(Math.random() * SUDANESE_FEMALE_NAMES.length)];
  const surname = SUDANESE_SURNAMES[Math.floor(Math.random() * SUDANESE_SURNAMES.length)];
  return { givenName, surname };
}

function timeAt(hour: number, minute = 0) {
  const d = new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
  return d;
}

// ==================== DATABASE CLEANUP ====================

async function deleteAllData() {
  console.log("\n🗑️  Deleting ALL existing data from database...");
  console.log("   (This ensures a clean demo-only setup)\n");

  // Delete in reverse dependency order to avoid FK constraints
  const deleteOperations = [
    // Stream/LMS
    prisma.streamLesson.deleteMany(),
    prisma.streamChapter.deleteMany(),
    prisma.streamPurchase.deleteMany(),
    prisma.streamCourse.deleteMany(),
    prisma.streamCategory.deleteMany(),

    // Finance Module
    prisma.financialReport.deleteMany(),
    prisma.expenseReceipt.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.budgetAllocation.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.walletTransaction.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.transfer.deleteMany(),
    prisma.bankReconciliation.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.bankAccount.deleteMany(),
    prisma.userInvoiceItem.deleteMany(),
    prisma.userInvoice.deleteMany(),
    prisma.userInvoiceAddress.deleteMany(),
    prisma.salarySlip.deleteMany(),
    prisma.payrollRun.deleteMany(),
    prisma.timesheetEntry.deleteMany(),
    prisma.timesheetPeriod.deleteMany(),
    prisma.salaryDeduction.deleteMany(),
    prisma.salaryAllowance.deleteMany(),
    prisma.salaryStructure.deleteMany(),
    prisma.expenseCategory.deleteMany(),
    prisma.chartOfAccount.deleteMany(),
    prisma.fiscalYear.deleteMany(),

    // Academics
    prisma.reportCardGrade.deleteMany(),
    prisma.reportCard.deleteMany(),
    prisma.result.deleteMany(),
    prisma.examResult.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.gradeBoundary.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.assignmentSubmission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.scoreRange.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.timetable.deleteMany(),
    prisma.schoolWeekConfig.deleteMany(),
    prisma.studentClass.deleteMany(),
    prisma.class.deleteMany(),
    prisma.studentYearLevel.deleteMany(),

    // Library
    prisma.borrowRecord.deleteMany(),
    prisma.book.deleteMany(),

    // Fees
    prisma.fine.deleteMany(),
    prisma.scholarshipApplication.deleteMany(),
    prisma.scholarship.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.feeAssignment.deleteMany(),
    prisma.feeStructure.deleteMany(),

    // Admission
    prisma.communication.deleteMany(),
    prisma.application.deleteMany(),
    prisma.admissionCampaign.deleteMany(),

    // People
    prisma.studentGuardian.deleteMany(),
    prisma.guardianPhoneNumber.deleteMany(),
    prisma.guardian.deleteMany(),
    prisma.teacherDepartment.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.student.deleteMany(),

    // Academic Structure
    prisma.classroom.deleteMany(),
    prisma.classroomType.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.department.deleteMany(),
    prisma.yearLevel.deleteMany(),
    prisma.period.deleteMany(),
    prisma.term.deleteMany(),
    prisma.schoolYear.deleteMany(),

    // Announcements
    prisma.announcement.deleteMany(),

    // Guardian Types
    prisma.guardianType.deleteMany(),

    // School Configuration
    prisma.schoolBranding.deleteMany(),

    // Auth
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.twoFactorToken.deleteMany(),
    prisma.twoFactorConfirmation.deleteMany(),
    prisma.user.deleteMany(),

    // Schools (last)
    prisma.school.deleteMany(),
  ];

  for (const operation of deleteOperations) {
    try {
      await operation;
    } catch {
      // Continue even if some tables don't exist
    }
  }

  console.log("   ✅ All existing data deleted\n");
}

// ==================== SCHOOL CREATION ====================

async function createDemoSchool() {
  console.log("🏫 Creating Demo School...");

  const school = await prisma.school.create({
    data: {
      name: DEMO_SCHOOL.name,
      domain: DEMO_SCHOOL.domain,
      email: DEMO_SCHOOL.email,
      website: DEMO_SCHOOL.website,
      timezone: "Africa/Khartoum",
      planType: DEMO_SCHOOL.planType,
      maxStudents: DEMO_SCHOOL.maxStudents,
      maxTeachers: DEMO_SCHOOL.maxTeachers,
    },
  });

  console.log(`   ✅ Created school: ${school.name} (${school.domain})\n`);
  return school;
}

// ==================== AUTH USERS ====================

async function createAuthUsers(schoolId: string) {
  console.log("👥 Creating auth users with demo password (1234)...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Developer (platform-wide, not tied to a school)
  const devUser = await prisma.user.create({
    data: {
      email: "dev@databayt.org",
      name: "Platform Developer",
      role: UserRole.DEVELOPER,
      password: passwordHash,
      emailVerified: new Date(),
    },
  });

  // School Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@demo.databayt.org",
      name: "School Administrator",
      role: UserRole.ADMIN,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Accountant
  const accountantUser = await prisma.user.create({
    data: {
      email: "accountant@demo.databayt.org",
      name: "School Accountant",
      role: UserRole.ACCOUNTANT,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Staff
  const staffUser = await prisma.user.create({
    data: {
      email: "staff@demo.databayt.org",
      name: "Support Staff",
      role: UserRole.STAFF,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  console.log("   ✅ Created: Developer, Admin, Accountant, Staff users\n");

  return { devUser, adminUser, accountantUser, staffUser };
}

// ==================== ACADEMIC STRUCTURE ====================

async function createAcademicStructure(schoolId: string) {
  console.log("📚 Creating academic structure...");

  // School Year
  const yearName = "2025-2026";
  const schoolYear = await prisma.schoolYear.create({
    data: {
      schoolId,
      yearName,
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Periods (typical school day)
  const periodsData = [
    { name: "Period 1", startTime: timeAt(7, 45), endTime: timeAt(8, 30) },
    { name: "Period 2", startTime: timeAt(8, 35), endTime: timeAt(9, 20) },
    { name: "Period 3", startTime: timeAt(9, 30), endTime: timeAt(10, 15) },
    { name: "Period 4", startTime: timeAt(10, 25), endTime: timeAt(11, 10) },
    { name: "Period 5", startTime: timeAt(11, 20), endTime: timeAt(12, 5) },
    { name: "Period 6", startTime: timeAt(12, 15), endTime: timeAt(13, 0) },
    { name: "Period 7", startTime: timeAt(13, 45), endTime: timeAt(14, 30) },
    { name: "Period 8", startTime: timeAt(14, 35), endTime: timeAt(15, 20) },
  ];

  for (const p of periodsData) {
    await prisma.period.create({
      data: { schoolId, yearId: schoolYear.id, name: p.name, startTime: p.startTime, endTime: p.endTime },
    });
  }
  const periods = await prisma.period.findMany({ where: { schoolId, yearId: schoolYear.id }, orderBy: { name: "asc" } });

  // Terms
  const term1 = await prisma.term.create({
    data: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 1,
      startDate: new Date("2025-09-01T00:00:00Z"),
      endDate: new Date("2026-01-15T00:00:00Z"),
    },
  });

  const term2 = await prisma.term.create({
    data: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 2,
      startDate: new Date("2026-01-16T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
    },
  });

  // Year Levels (KG through Grade 12)
  const levelNames = [
    "KG 1", "KG 2",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
  ];

  for (const [index, levelName] of levelNames.entries()) {
    await prisma.yearLevel.create({
      data: { schoolId, levelName, levelOrder: index + 1 },
    });
  }
  const yearLevels = await prisma.yearLevel.findMany({ where: { schoolId }, orderBy: { levelOrder: "asc" } });

  console.log(`   ✅ Created: 1 school year, 8 periods, 2 terms, ${yearLevels.length} year levels\n`);

  return { schoolYear, term1, term2, periods, yearLevels };
}

// ==================== DEPARTMENTS & SUBJECTS ====================

async function createDepartmentsAndSubjects(schoolId: string) {
  console.log("📖 Creating departments and subjects...");

  const departmentData = [
    {
      name: "Languages",
      subjects: ["Arabic Language", "English Language", "French Language"],
    },
    {
      name: "Sciences",
      subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "Environmental Science"],
    },
    {
      name: "Humanities",
      subjects: ["Geography", "History", "Civics", "Economics"],
    },
    {
      name: "Religious Studies",
      subjects: ["Islamic Studies", "Quran"],
    },
    {
      name: "ICT",
      subjects: ["Computer Science", "Information Technology", "Digital Literacy"],
    },
    {
      name: "Arts & Physical Education",
      subjects: ["Art", "Music", "Physical Education", "Health Education"],
    },
  ];

  const departments: { id: string; departmentName: string }[] = [];
  const subjects: { id: string; subjectName: string }[] = [];

  for (const dept of departmentData) {
    const department = await prisma.department.create({
      data: { schoolId, departmentName: dept.name },
    });
    departments.push(department);

    for (const subjectName of dept.subjects) {
      const subject = await prisma.subject.create({
        data: { schoolId, departmentId: department.id, subjectName },
      });
      subjects.push(subject);
    }
  }

  console.log(`   ✅ Created: ${departments.length} departments, ${subjects.length} subjects\n`);

  return { departments, subjects };
}

// ==================== CLASSROOMS ====================

async function createClassrooms(schoolId: string) {
  console.log("🏛️ Creating classrooms...");

  const ctClassroom = await prisma.classroomType.create({
    data: { schoolId, name: "Standard Classroom" },
  });
  const ctLab = await prisma.classroomType.create({
    data: { schoolId, name: "Laboratory" },
  });
  const ctComputer = await prisma.classroomType.create({
    data: { schoolId, name: "Computer Lab" },
  });
  const ctLibrary = await prisma.classroomType.create({
    data: { schoolId, name: "Library" },
  });
  const ctArt = await prisma.classroomType.create({
    data: { schoolId, name: "Art Room" },
  });

  const roomSeeds = [
    // Standard Classrooms
    ...Array.from({ length: 30 }, (_, i) => ({
      name: `Room ${101 + i}`,
      typeId: ctClassroom.id,
      capacity: 35,
    })),
    // Labs
    { name: "Physics Lab", typeId: ctLab.id, capacity: 30 },
    { name: "Chemistry Lab", typeId: ctLab.id, capacity: 30 },
    { name: "Biology Lab", typeId: ctLab.id, capacity: 30 },
    // Computer Labs
    { name: "Computer Lab 1", typeId: ctComputer.id, capacity: 40 },
    { name: "Computer Lab 2", typeId: ctComputer.id, capacity: 40 },
    // Others
    { name: "Main Library", typeId: ctLibrary.id, capacity: 100 },
    { name: "Art Studio", typeId: ctArt.id, capacity: 25 },
  ];

  const classrooms: { id: string }[] = [];
  for (const r of roomSeeds) {
    const classroom = await prisma.classroom.create({
      data: { schoolId, typeId: r.typeId, roomName: r.name, capacity: r.capacity },
    });
    classrooms.push(classroom);
  }

  console.log(`   ✅ Created: ${classrooms.length} classrooms\n`);

  return { classrooms };
}

// ==================== TEACHERS ====================

async function createTeachers(schoolId: string, departments: { id: string; departmentName: string }[]) {
  console.log("👨‍🏫 Creating teachers (50+)...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Teacher data with subjects
  const teacherSeeds = [
    // Languages Department (10)
    { givenName: "Ahmed", surname: "Hassan", gender: "M", dept: "Languages" },
    { givenName: "Fatima", surname: "Ali", gender: "F", dept: "Languages" },
    { givenName: "Mohamed", surname: "Ibrahim", gender: "M", dept: "Languages" },
    { givenName: "Mariam", surname: "Yousif", gender: "F", dept: "Languages" },
    { givenName: "Khalid", surname: "Ahmed", gender: "M", dept: "Languages" },
    { givenName: "Sara", surname: "Abbas", gender: "F", dept: "Languages" },
    { givenName: "Omar", surname: "Salih", gender: "M", dept: "Languages" },
    { givenName: "Huda", surname: "Ibrahim", gender: "F", dept: "Languages" },
    { givenName: "Tariq", surname: "Bashir", gender: "M", dept: "Languages" },
    { givenName: "Layla", surname: "Hamza", gender: "F", dept: "Languages" },
    // Sciences Department (15)
    { givenName: "Ibrahim", surname: "Malik", gender: "M", dept: "Sciences" },
    { givenName: "Amina", surname: "Kamal", gender: "F", dept: "Sciences" },
    { givenName: "Mustafa", surname: "Idris", gender: "M", dept: "Sciences" },
    { givenName: "Noura", surname: "Nabil", gender: "F", dept: "Sciences" },
    { givenName: "Hamza", surname: "Badawi", gender: "M", dept: "Sciences" },
    { givenName: "Zahra", surname: "Hassan", gender: "F", dept: "Sciences" },
    { givenName: "Osman", surname: "Ali", gender: "M", dept: "Sciences" },
    { givenName: "Samira", surname: "Mohamed", gender: "F", dept: "Sciences" },
    { givenName: "Hassan", surname: "Omar", gender: "M", dept: "Sciences" },
    { givenName: "Rania", surname: "Khalid", gender: "F", dept: "Sciences" },
    { givenName: "Jamal", surname: "Abdalla", gender: "M", dept: "Sciences" },
    { givenName: "Dalal", surname: "Mustafa", gender: "F", dept: "Sciences" },
    { givenName: "Nabil", surname: "Hassan", gender: "M", dept: "Sciences" },
    { givenName: "Hana", surname: "Ibrahim", gender: "F", dept: "Sciences" },
    { givenName: "Rashid", surname: "Osman", gender: "M", dept: "Sciences" },
    // Humanities Department (8)
    { givenName: "Saeed", surname: "Yousif", gender: "M", dept: "Humanities" },
    { givenName: "Sumaya", surname: "Salih", gender: "F", dept: "Humanities" },
    { givenName: "Waleed", surname: "Ahmed", gender: "M", dept: "Humanities" },
    { givenName: "Nawal", surname: "Ali", gender: "F", dept: "Humanities" },
    { givenName: "Zain", surname: "Mohamed", gender: "M", dept: "Humanities" },
    { givenName: "Mona", surname: "Ibrahim", gender: "F", dept: "Humanities" },
    { givenName: "Amin", surname: "Hassan", gender: "M", dept: "Humanities" },
    { givenName: "Rehab", surname: "Omar", gender: "F", dept: "Humanities" },
    // Religious Studies (6)
    { givenName: "Farouk", surname: "Khalid", gender: "M", dept: "Religious Studies" },
    { givenName: "Aisha", surname: "Yousif", gender: "F", dept: "Religious Studies" },
    { givenName: "Gamal", surname: "Salih", gender: "M", dept: "Religious Studies" },
    { givenName: "Khadija", surname: "Ahmed", gender: "F", dept: "Religious Studies" },
    { givenName: "Hisham", surname: "Ali", gender: "M", dept: "Religious Studies" },
    { givenName: "Widad", surname: "Mohamed", gender: "F", dept: "Religious Studies" },
    // ICT (6)
    { givenName: "Imad", surname: "Ibrahim", gender: "M", dept: "ICT" },
    { givenName: "Yasmin", surname: "Hassan", gender: "F", dept: "ICT" },
    { givenName: "Jaafar", surname: "Omar", gender: "M", dept: "ICT" },
    { givenName: "Zainab", surname: "Khalid", gender: "F", dept: "ICT" },
    { givenName: "Lutfi", surname: "Yousif", gender: "M", dept: "ICT" },
    { givenName: "Amal", surname: "Salih", gender: "F", dept: "ICT" },
    // Arts & PE (5)
    { givenName: "Munir", surname: "Ahmed", gender: "M", dept: "Arts & Physical Education" },
    { givenName: "Basma", surname: "Ali", gender: "F", dept: "Arts & Physical Education" },
    { givenName: "Abdalla", surname: "Mohamed", gender: "M", dept: "Arts & Physical Education" },
    { givenName: "Dalia", surname: "Ibrahim", gender: "F", dept: "Arts & Physical Education" },
    { givenName: "Kamal", surname: "Hassan", gender: "M", dept: "Arts & Physical Education" },
  ];

  const teacherUsers: { id: string; email: string; role: string }[] = [];
  const teachers: { id: string; userId: string; emailAddress: string }[] = [];

  for (const t of teacherSeeds) {
    const email = `${t.givenName.toLowerCase()}.${t.surname.toLowerCase()}@demo.databayt.org`;

    const user = await prisma.user.create({
      data: {
        email,
        name: `${t.givenName} ${t.surname}`,
        role: UserRole.TEACHER,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });

    teacherUsers.push({ id: user.id, email, role: UserRole.TEACHER });

    const teacher = await prisma.teacher.create({
      data: {
        schoolId,
        givenName: t.givenName,
        surname: t.surname,
        gender: t.gender,
        emailAddress: email,
        userId: user.id,
      },
    });

    teachers.push({ id: teacher.id, userId: user.id, emailAddress: email });

    // Link teacher to department
    const dept = departments.find((d) => d.departmentName === t.dept);
    if (dept) {
      await prisma.teacherDepartment.create({
        data: { schoolId, teacherId: teacher.id, departmentId: dept.id, isPrimary: true },
      });
    }
  }

  console.log(`   ✅ Created: ${teachers.length} teachers with user accounts\n`);

  return { teacherUsers, teachers };
}

// ==================== GUARDIAN TYPES ====================

async function createGuardianTypes(schoolId: string) {
  const gtFather = await prisma.guardianType.create({
    data: { schoolId, name: "Father" },
  });
  const gtMother = await prisma.guardianType.create({
    data: { schoolId, name: "Mother" },
  });
  const gtUncle = await prisma.guardianType.create({
    data: { schoolId, name: "Uncle" },
  });
  const gtAunt = await prisma.guardianType.create({
    data: { schoolId, name: "Aunt" },
  });
  const gtGrandparent = await prisma.guardianType.create({
    data: { schoolId, name: "Grandparent" },
  });

  return { gtFather, gtMother, gtUncle, gtAunt, gtGrandparent };
}

// ==================== STUDENTS & GUARDIANS ====================

async function createStudentsAndGuardians(
  schoolId: string,
  yearLevels: { id: string; levelName: string }[],
  schoolYear: { id: string },
  guardianTypes: { gtFather: { id: string }; gtMother: { id: string } }
) {
  console.log("👨‍🎓 Creating students (200+) and guardians...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const students: { id: string; userId: string }[] = [];
  const guardians: { id: string }[] = [];
  const studentUsers: { id: string; email: string; role: string }[] = [];

  // Create 200 students distributed across grade levels
  const studentsPerLevel = Math.ceil(200 / yearLevels.length);

  for (const [levelIndex, level] of yearLevels.entries()) {
    const count = levelIndex < yearLevels.length - 1 ? studentsPerLevel : 200 - students.length;

    for (let i = 0; i < count && students.length < 200; i++) {
      const gender = i % 2 === 0 ? "M" : "F";
      const studentData = getSudaneseName(gender);
      const familySurname = SUDANESE_SURNAMES[(students.length) % SUDANESE_SURNAMES.length];
      const middleName = gender === "M"
        ? SUDANESE_MALE_NAMES[(students.length + 5) % SUDANESE_MALE_NAMES.length]
        : SUDANESE_FEMALE_NAMES[(students.length + 5) % SUDANESE_FEMALE_NAMES.length];

      // Student email
      const studentEmail = `student${students.length + 1}@demo.databayt.org`;

      // Create student user
      const studentUser = await prisma.user.create({
        data: {
          email: studentEmail,
          name: `${studentData.givenName} ${familySurname}`,
          role: UserRole.STUDENT,
          password: passwordHash,
          emailVerified: new Date(),
          school: { connect: { id: schoolId } },
        },
      });

      studentUsers.push({ id: studentUser.id, email: studentEmail, role: UserRole.STUDENT });

      // Calculate DOB based on grade level
      const baseYear = 2025 - (levelIndex + 5); // KG1 is ~5 years old
      const dobYear = baseYear - faker.number.int({ min: 0, max: 1 });
      const dob = new Date(Date.UTC(dobYear, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 })));

      // Create student
      const student = await prisma.student.create({
        data: {
          schoolId,
          givenName: studentData.givenName,
          middleName,
          surname: familySurname,
          dateOfBirth: dob,
          gender,
          userId: studentUser.id,
        },
      });

      students.push({ id: student.id, userId: studentUser.id });

      // Assign to year level
      await prisma.studentYearLevel.create({
        data: {
          schoolId,
          studentId: student.id,
          levelId: level.id,
          yearId: schoolYear.id,
        },
      });

      // Create guardians (father and mother)
      const fatherData = getSudaneseName("M");
      const motherData = getSudaneseName("F");

      const fatherEmail = `father${students.length}@demo.databayt.org`;
      const motherEmail = `mother${students.length}@demo.databayt.org`;

      // Father user and guardian
      const fatherUser = await prisma.user.create({
        data: {
          email: fatherEmail,
          name: `${fatherData.givenName} ${familySurname}`,
          role: UserRole.GUARDIAN,
          password: passwordHash,
          emailVerified: new Date(),
          school: { connect: { id: schoolId } },
        },
      });

      const father = await prisma.guardian.create({
        data: {
          schoolId,
          givenName: fatherData.givenName,
          surname: familySurname,
          emailAddress: fatherEmail,
          userId: fatherUser.id,
        },
      });

      await prisma.guardianPhoneNumber.create({
        data: {
          schoolId,
          guardianId: father.id,
          phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`,
          isPrimary: true,
        },
      });

      // Mother user and guardian
      const motherUser = await prisma.user.create({
        data: {
          email: motherEmail,
          name: `${motherData.givenName} ${familySurname}`,
          role: UserRole.GUARDIAN,
          password: passwordHash,
          emailVerified: new Date(),
          school: { connect: { id: schoolId } },
        },
      });

      const mother = await prisma.guardian.create({
        data: {
          schoolId,
          givenName: motherData.givenName,
          surname: familySurname,
          emailAddress: motherEmail,
          userId: motherUser.id,
        },
      });

      await prisma.guardianPhoneNumber.create({
        data: {
          schoolId,
          guardianId: mother.id,
          phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`,
          isPrimary: true,
        },
      });

      guardians.push({ id: father.id }, { id: mother.id });

      // Link guardians to student
      await prisma.studentGuardian.create({
        data: {
          schoolId,
          studentId: student.id,
          guardianId: father.id,
          guardianTypeId: guardianTypes.gtFather.id,
          isPrimary: false,
        },
      });

      await prisma.studentGuardian.create({
        data: {
          schoolId,
          studentId: student.id,
          guardianId: mother.id,
          guardianTypeId: guardianTypes.gtMother.id,
          isPrimary: true,
        },
      });
    }
  }

  console.log(`   ✅ Created: ${students.length} students, ${guardians.length} guardians\n`);

  return { students, guardians, studentUsers };
}

// ==================== CLASSES & ENROLLMENTS ====================

async function createClassesAndEnrollments(
  schoolId: string,
  termId: string,
  periods: { id: string }[],
  classrooms: { id: string }[],
  subjects: { id: string; subjectName: string }[],
  teachers: { id: string }[],
  students: { id: string }[]
) {
  console.log("📝 Creating classes and enrollments...");

  const targetSubjects = ["Mathematics", "Arabic Language", "English Language", "Physics", "Chemistry", "Biology"];
  const chosenSubjects = subjects.filter((s) => targetSubjects.includes(s.subjectName));
  const sectionLabels = ["A", "B", "C"];
  const gradeLabels = ["10", "11", "12"];
  const classesCreated: { id: string; name: string }[] = [];

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
        classesCreated.push({ id: clazz.id, name: className });

        // Enroll students (distribute based on grade)
        const gradeIndex = gradeLabels.indexOf(grade);
        const startStudent = gradeIndex * 30 + si * 10;
        const endStudent = Math.min(startStudent + 12, students.length);
        const enrollStudents = students.slice(startStudent, endStudent);

        await prisma.studentClass.createMany({
          data: enrollStudents.map((s) => ({ schoolId, studentId: s.id, classId: clazz.id })),
          skipDuplicates: true,
        });

        // Create one assignment per class
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

        // Create submissions
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

  // Attendance for today
  if (classesCreated[0]) {
    const today = new Date();
    const dateOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const attendanceRecords = students.slice(0, 50).map((s, index) => ({
      schoolId,
      studentId: s.id,
      classId: classesCreated[index % classesCreated.length].id,
      date: dateOnly,
      status: index % 5 === 0 ? AttendanceStatus.ABSENT : index % 7 === 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
    }));

    await prisma.attendance.createMany({
      data: attendanceRecords,
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ Created: ${classesCreated.length} classes with enrollments and assignments\n`);

  return { classes: classesCreated };
}

// ==================== LIBRARY ====================

async function createLibrary(schoolId: string) {
  console.log("📚 Creating library books...");

  const booksData = [
    { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Fiction", rating: 5, coverColor: "#8B4513", totalCopies: 8, availableCopies: 6 },
    { title: "1984", author: "George Orwell", genre: "Science Fiction", rating: 5, coverColor: "#2F4F4F", totalCopies: 10, availableCopies: 7 },
    { title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance", rating: 5, coverColor: "#FFB6C1", totalCopies: 6, availableCopies: 5 },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Fiction", rating: 4, coverColor: "#FFD700", totalCopies: 7, availableCopies: 6 },
    { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", genre: "Fantasy", rating: 5, coverColor: "#8B0000", totalCopies: 15, availableCopies: 10 },
    { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", rating: 5, coverColor: "#228B22", totalCopies: 8, availableCopies: 6 },
    { title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "Fiction", rating: 4, coverColor: "#DC143C", totalCopies: 5, availableCopies: 4 },
    { title: "The Lord of the Rings", author: "J.R.R. Tolkien", genre: "Fantasy", rating: 5, coverColor: "#4B0082", totalCopies: 6, availableCopies: 4 },
    { title: "Animal Farm", author: "George Orwell", genre: "Political Satire", rating: 4, coverColor: "#8B4513", totalCopies: 8, availableCopies: 7 },
    { title: "Brave New World", author: "Aldous Huxley", genre: "Science Fiction", rating: 4, coverColor: "#4682B4", totalCopies: 5, availableCopies: 5 },
    { title: "The Chronicles of Narnia", author: "C.S. Lewis", genre: "Fantasy", rating: 5, coverColor: "#DAA520", totalCopies: 10, availableCopies: 8 },
    { title: "Introduction to Algorithms", author: "Thomas H. Cormen", genre: "Education", rating: 5, coverColor: "#1E90FF", totalCopies: 12, availableCopies: 10 },
    { title: "Physics: Principles with Applications", author: "Douglas C. Giancoli", genre: "Education", rating: 4, coverColor: "#32CD32", totalCopies: 15, availableCopies: 12 },
    { title: "Chemistry: The Central Science", author: "Theodore L. Brown", genre: "Education", rating: 4, coverColor: "#9932CC", totalCopies: 15, availableCopies: 13 },
    { title: "Biology", author: "Neil A. Campbell", genre: "Education", rating: 5, coverColor: "#20B2AA", totalCopies: 14, availableCopies: 11 },
    { title: "Oxford English Dictionary", author: "Oxford University Press", genre: "Reference", rating: 5, coverColor: "#000080", totalCopies: 20, availableCopies: 18 },
    { title: "Arabic Grammar Simplified", author: "Dr. Ahmed Hassan", genre: "Education", rating: 4, coverColor: "#8B0000", totalCopies: 25, availableCopies: 22 },
    { title: "World History: Patterns of Interaction", author: "Various Authors", genre: "Education", rating: 4, coverColor: "#CD853F", totalCopies: 18, availableCopies: 15 },
    { title: "Geography: Realms, Regions, and Concepts", author: "H.J. de Blij", genre: "Education", rating: 4, coverColor: "#006400", totalCopies: 12, availableCopies: 10 },
    { title: "The Quran: English Translation", author: "Various Translators", genre: "Religious Studies", rating: 5, coverColor: "#006400", totalCopies: 30, availableCopies: 28 },
  ];

  await prisma.book.createMany({
    data: booksData.map((book) => ({
      schoolId,
      title: book.title,
      author: book.author,
      genre: book.genre,
      rating: book.rating,
      coverColor: book.coverColor,
      description: `A comprehensive book on ${book.genre.toLowerCase()}.`,
      summary: `${book.title} by ${book.author} is an essential read in the ${book.genre} category.`,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      coverUrl: `/placeholder-book-cover.jpg`,
    })),
    skipDuplicates: true,
  });

  console.log(`   ✅ Created: ${booksData.length} library books\n`);
}

// ==================== ANNOUNCEMENTS ====================

async function createAnnouncements(schoolId: string, classes: { id: string }[]) {
  console.log("📢 Creating announcements...");

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
      title: "Parent-Teacher Meeting",
      body: "A parent-teacher meeting is scheduled for next week. All parents are requested to attend.",
      scope: AnnouncementScope.school,
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
      published: true,
    },
    {
      title: "Science Fair Registration Open",
      body: "Registration for the annual Science Fair is now open. Submit your projects by the end of the month.",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Holiday Notice - Eid Celebration",
      body: "School will remain closed from [date] to [date] for Eid celebrations. Enjoy the holiday!",
      scope: AnnouncementScope.school,
      published: true,
    },
    {
      title: "Class Assignment Due",
      body: "Reminder: Your class assignment is due this Friday. Please submit on time.",
      scope: AnnouncementScope.class,
      classId: classes[0]?.id,
      published: true,
    },
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: { schoolId, ...ann },
    });
  }

  console.log(`   ✅ Created: ${announcements.length} announcements\n`);
}

// ==================== SCHOOL BRANDING ====================

async function createSchoolBranding(schoolId: string) {
  await prisma.schoolBranding.create({
    data: {
      schoolId,
      primaryColor: "#1e40af",
      secondaryColor: "#dc2626",
      borderRadius: "md",
      shadow: "lg",
      isPubliclyListed: true,
      allowSelfEnrollment: true,
      requireParentApproval: true,
      informationSharing: "full-sharing",
    },
  });
}

// ==================== FEES ====================

async function createFeesAndPayments(
  schoolId: string,
  classes: { id: string; name: string }[],
  students: { id: string }[]
) {
  console.log("💰 Creating fee structures and payments...");

  const academicYear = "2025-2026";

  // Create multiple fee structures
  const feeStructures = [
    { name: "Grade 10-12 Annual Fee", tuition: 20000, admission: 3000, registration: 800, exam: 1500, library: 500, lab: 1200, sports: 600, total: 27600 },
    { name: "Grade 7-9 Annual Fee", tuition: 15000, admission: 2500, registration: 600, exam: 1200, library: 400, lab: 800, sports: 500, total: 21000 },
    { name: "Grade 1-6 Annual Fee", tuition: 12000, admission: 2000, registration: 500, exam: 1000, library: 300, lab: 500, sports: 400, total: 16700 },
    { name: "KG Annual Fee", tuition: 10000, admission: 1500, registration: 400, exam: 500, library: 200, lab: 0, sports: 300, total: 12900 },
  ];

  const createdStructures = [];
  for (const [index, fs] of feeStructures.entries()) {
    const structure = await prisma.feeStructure.create({
      data: {
        schoolId,
        name: `${fs.name} ${academicYear}`,
        academicYear,
        classId: classes[index % classes.length]?.id,
        tuitionFee: fs.tuition.toString(),
        admissionFee: fs.admission.toString(),
        registrationFee: fs.registration.toString(),
        examFee: fs.exam.toString(),
        libraryFee: fs.library.toString(),
        laboratoryFee: fs.lab.toString(),
        sportsFee: fs.sports.toString(),
        totalAmount: fs.total.toString(),
        installments: 3,
        isActive: true,
      },
    });
    createdStructures.push({ ...structure, total: fs.total });
  }

  // Assign fees to students and create payments
  let paymentCount = 0;
  for (let i = 0; i < Math.min(150, students.length); i++) {
    const student = students[i];
    const structure = createdStructures[i % createdStructures.length];
    const isPaid = i < 100; // 100 students paid, 50 pending

    const feeAssignment = await prisma.feeAssignment.create({
      data: {
        schoolId,
        studentId: student.id,
        feeStructureId: structure.id,
        academicYear,
        finalAmount: structure.total.toString(),
        status: isPaid ? FeeStatus.PAID : i < 120 ? FeeStatus.PARTIAL : FeeStatus.PENDING,
      },
    });

    if (isPaid || i < 120) {
      const paymentAmount = isPaid ? structure.total : structure.total * 0.5;
      const paymentNumber = `PAY-2025-${String(paymentCount + 1).padStart(5, "0")}`;

      await prisma.payment.create({
        data: {
          schoolId,
          feeAssignmentId: feeAssignment.id,
          studentId: student.id,
          paymentNumber,
          amount: paymentAmount.toString(),
          paymentDate: new Date(),
          paymentMethod: i % 3 === 0 ? PaymentMethod.CASH : i % 3 === 1 ? PaymentMethod.BANK_TRANSFER : PaymentMethod.CHEQUE,
          receiptNumber: `RCP-2025-${String(paymentCount + 1).padStart(5, "0")}`,
          status: PaymentStatus.SUCCESS,
        },
      });

      paymentCount++;
    }
  }

  console.log(`   ✅ Created: ${createdStructures.length} fee structures, ${paymentCount} payments\n`);
}

// ==================== EXAMS ====================

async function createExams(
  schoolId: string,
  classes: { id: string; name: string }[],
  subjects: { id: string; subjectName: string }[],
  students: { id: string }[]
) {
  console.log("📝 Creating exams and results...");

  const examSubjects = subjects.filter(s =>
    ["Mathematics", "Arabic Language", "English Language", "Physics", "Chemistry"].includes(s.subjectName)
  );

  const exams: { id: string; subjectName: string }[] = [];

  for (const subject of examSubjects) {
    // Midterm exam
    const midterm = await prisma.exam.create({
      data: {
        schoolId,
        title: `${subject.subjectName} Mid-Term Exam`,
        description: `Mid-term examination for ${subject.subjectName}`,
        classId: classes[0].id,
        subjectId: subject.id,
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
    exams.push({ id: midterm.id, subjectName: subject.subjectName });

    // Final exam (scheduled)
    const final = await prisma.exam.create({
      data: {
        schoolId,
        title: `${subject.subjectName} Final Exam`,
        description: `Final examination for ${subject.subjectName}`,
        classId: classes[0].id,
        subjectId: subject.id,
        examDate: new Date("2026-01-15T00:00:00Z"),
        startTime: "09:00",
        endTime: "12:00",
        duration: 180,
        totalMarks: 100,
        passingMarks: 50,
        examType: ExamType.FINAL,
        status: ExamStatus.SCHEDULED,
      },
    });
    exams.push({ id: final.id, subjectName: subject.subjectName });
  }

  // Create exam results for completed exams
  const completedExams = exams.filter((_, index) => index % 2 === 0); // Only midterms

  for (const exam of completedExams) {
    for (let i = 0; i < Math.min(50, students.length); i++) {
      const marks = faker.number.int({ min: 40, max: 98 });
      const grade = marks >= 90 ? "A" : marks >= 80 ? "B" : marks >= 70 ? "C" : marks >= 60 ? "D" : "F";

      await prisma.examResult.create({
        data: {
          schoolId,
          examId: exam.id,
          studentId: students[i].id,
          marksObtained: marks,
          totalMarks: 100,
          percentage: marks,
          grade,
          isAbsent: false,
        },
      });
    }
  }

  // Grade boundaries
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

  console.log(`   ✅ Created: ${exams.length} exams with results\n`);
}

// ==================== WEEK CONFIG & TIMETABLE ====================

async function createTimetable(
  schoolId: string,
  termId: string,
  schoolYear: { id: string },
  periods: { id: string }[],
  classes: { id: string; name: string }[]
) {
  console.log("📅 Creating timetable...");

  // Working days: Sun-Thu (Friday off)
  const workingDays = [0, 1, 2, 3, 4]; // Sunday to Thursday

  await prisma.schoolWeekConfig.create({
    data: {
      schoolId,
      termId,
      workingDays,
      defaultLunchAfterPeriod: 4,
    },
  });

  // Create timetable entries
  const timetableRows: {
    schoolId: string;
    termId: string;
    dayOfWeek: number;
    periodId: string;
    classId: string;
    teacherId: string | null;
    classroomId: string | null;
    weekOffset: number;
  }[] = [];

  const classesWithDetails = await prisma.class.findMany({
    where: { schoolId, termId },
    select: { id: true, name: true, teacherId: true, classroomId: true },
    take: 20,
  });

  for (let d = 0; d < workingDays.length; d++) {
    for (let p = 0; p < Math.min(6, periods.length); p++) {
      const cls = classesWithDetails[(d + p) % classesWithDetails.length];
      if (cls) {
        timetableRows.push({
          schoolId,
          termId,
          dayOfWeek: workingDays[d],
          periodId: periods[p].id,
          classId: cls.id,
          teacherId: cls.teacherId,
          classroomId: cls.classroomId,
          weekOffset: 0,
        });
      }
    }
  }

  if (timetableRows.length > 0) {
    await prisma.timetable.createMany({ data: timetableRows, skipDuplicates: true });
  }

  console.log(`   ✅ Created: ${timetableRows.length} timetable entries\n`);
}

// ==================== LMS/STREAM COURSES ====================

async function createStreamCourses(
  schoolId: string,
  teachers: { id: string; userId: string }[]
) {
  console.log("🎓 Creating LMS courses...");

  // Create categories
  const categories = [
    { name: "Programming", schoolId },
    { name: "Mathematics", schoolId },
    { name: "Science", schoolId },
    { name: "Languages", schoolId },
    { name: "Business", schoolId },
  ];

  const createdCategories = [];
  for (const cat of categories) {
    const created = await prisma.streamCategory.create({ data: cat });
    createdCategories.push(created);
  }

  // Sample courses
  const coursesData = [
    {
      title: "Introduction to Python Programming",
      slug: "intro-python-programming",
      description: "Learn Python from scratch with hands-on projects.",
      price: 49.99,
      categoryId: createdCategories[0]?.id,
      isPublished: true,
      chapters: [
        { title: "Getting Started with Python", lessons: ["What is Python?", "Installing Python", "Your First Program"] },
        { title: "Python Basics", lessons: ["Variables", "Operators", "Control Flow"] },
      ],
    },
    {
      title: "Advanced Mathematics",
      slug: "advanced-mathematics",
      description: "Master calculus, linear algebra, and differential equations.",
      price: 79.99,
      categoryId: createdCategories[1]?.id,
      isPublished: true,
      chapters: [
        { title: "Calculus Fundamentals", lessons: ["Limits", "Derivatives", "Integration"] },
        { title: "Linear Algebra", lessons: ["Matrices", "Vectors", "Transformations"] },
      ],
    },
    {
      title: "Physics: Mechanics",
      slug: "physics-mechanics",
      description: "Explore classical mechanics, forces, and motion.",
      price: 59.99,
      categoryId: createdCategories[2]?.id,
      isPublished: true,
      chapters: [
        { title: "Newton's Laws", lessons: ["First Law", "Second Law", "Third Law"] },
        { title: "Energy and Work", lessons: ["Work", "Energy Conservation"] },
      ],
    },
    {
      title: "English Language Mastery",
      slug: "english-language-mastery",
      description: "Improve your English skills.",
      price: 0,
      categoryId: createdCategories[3]?.id,
      isPublished: true,
      chapters: [
        { title: "Grammar Essentials", lessons: ["Tenses", "Present Tense", "Past Tense"] },
        { title: "Vocabulary Building", lessons: ["Common Phrases", "Academic Vocabulary"] },
      ],
    },
  ];

  let courseCount = 0;
  for (const courseData of coursesData) {
    const { chapters, ...courseInfo } = courseData;

    const course = await prisma.streamCourse.create({
      data: {
        ...courseInfo,
        schoolId,
        userId: teachers[0]?.userId,
        imageUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&h=450&fit=crop",
      },
    });

    // Create chapters and lessons
    for (let ci = 0; ci < chapters.length; ci++) {
      const chapter = await prisma.streamChapter.create({
        data: {
          title: chapters[ci].title,
          description: `Chapter ${ci + 1}`,
          position: ci + 1,
          isPublished: true,
          courseId: course.id,
        },
      });

      for (let li = 0; li < chapters[ci].lessons.length; li++) {
        await prisma.streamLesson.create({
          data: {
            title: chapters[ci].lessons[li],
            position: li + 1,
            duration: faker.number.int({ min: 15, max: 45 }),
            isPublished: true,
            isFree: li === 0,
            chapterId: chapter.id,
          },
        });
      }
    }

    courseCount++;
  }

  console.log(`   ✅ Created: ${courseCount} LMS courses with chapters and lessons\n`);
}

// ==================== LESSON PLANS ====================

async function createLessonPlans(
  schoolId: string,
  classes: { id: string; name: string }[]
) {
  console.log("📖 Creating lesson plans...");

  const lessonTopics = [
    { title: "Introduction to Algebra", objectives: "Understand basic algebraic concepts" },
    { title: "Arabic Grammar: Verb Conjugation", objectives: "Master verb conjugation" },
    { title: "English Literature: Poetry Analysis", objectives: "Analyze poetic devices" },
    { title: "Physics: Newton's Laws", objectives: "Apply Newton's laws" },
    { title: "Chemistry: Periodic Table", objectives: "Understand periodic trends" },
    { title: "Biology: Cell Structure", objectives: "Identify cell organelles" },
    { title: "Geography: Climate Zones", objectives: "Understand global climate patterns" },
    { title: "Islamic Studies: Quran Recitation", objectives: "Improve tajweed" },
  ];

  for (let i = 0; i < Math.min(16, classes.length * 2); i++) {
    const classObj = classes[i % classes.length];
    const topic = lessonTopics[i % lessonTopics.length];

    const lessonDate = new Date();
    lessonDate.setDate(lessonDate.getDate() + faker.number.int({ min: 1, max: 30 }));

    await prisma.lesson.create({
      data: {
        schoolId,
        classId: classObj.id,
        title: topic.title,
        description: `Comprehensive lesson on ${topic.title}`,
        lessonDate,
        startTime: "09:00",
        endTime: "10:00",
        objectives: topic.objectives,
        materials: "Textbook, whiteboard, projector",
        activities: "Lecture, Group discussion, Practice exercises",
        assessment: "Quiz, homework assignment",
        status: i < 5 ? "COMPLETED" : i < 10 ? "IN_PROGRESS" : "PLANNED",
      },
    });
  }

  console.log(`   ✅ Created: ${Math.min(16, classes.length * 2)} lesson plans\n`);
}

// ==================== REPORT CARDS ====================

async function createReportCards(
  schoolId: string,
  termId: string,
  students: { id: string }[],
  subjects: { id: string; subjectName: string }[]
) {
  console.log("📊 Creating report cards...");

  for (let i = 0; i < Math.min(50, students.length); i++) {
    const student = students[i];

    const subjectGrades = subjects.slice(0, 5).map((subject) => {
      const score = faker.number.int({ min: 60, max: 98 });
      const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D";
      return { subjectId: subject.id, score, grade };
    });

    const avgScore = subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length;
    const overallGrade = avgScore >= 90 ? "A" : avgScore >= 80 ? "B" : avgScore >= 70 ? "C" : "D";
    const gpa = avgScore >= 90 ? "3.70" : avgScore >= 80 ? "3.00" : avgScore >= 70 ? "2.30" : "2.00";

    const reportCard = await prisma.reportCard.create({
      data: {
        schoolId,
        studentId: student.id,
        termId,
        overallGrade,
        overallGPA: gpa,
        rank: i + 1,
        totalStudents: students.length,
        daysPresent: faker.number.int({ min: 80, max: 95 }),
        daysAbsent: faker.number.int({ min: 0, max: 5 }),
        daysLate: faker.number.int({ min: 0, max: 3 }),
        teacherComments: "Good performance. Keep up the excellent work!",
        isPublished: i < 30,
        publishedAt: i < 30 ? new Date() : null,
      },
    });

    for (const gradeData of subjectGrades) {
      await prisma.reportCardGrade.create({
        data: {
          schoolId,
          reportCardId: reportCard.id,
          subjectId: gradeData.subjectId,
          grade: gradeData.grade,
          score: gradeData.score.toString(),
          maxScore: "100.00",
          percentage: gradeData.score,
          comments: "Good progress",
        },
      });
    }
  }

  console.log(`   ✅ Created: 50 report cards with grades\n`);
}

// ==================== MAIN EXECUTION ====================

async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║   🏫 HOGWARTS DEMO-ONLY SEED                                     ║");
  console.log("║   Creating comprehensive demo school at demo.databayt.org       ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Step 1: Delete ALL existing data
  await deleteAllData();

  // Step 2: Create demo school
  const school = await createDemoSchool();

  // Step 3: Create auth users
  const { adminUser, accountantUser } = await createAuthUsers(school.id);

  // Step 4: Create academic structure
  const { schoolYear, term1, periods, yearLevels } = await createAcademicStructure(school.id);

  // Step 5: Create departments and subjects
  const { departments, subjects } = await createDepartmentsAndSubjects(school.id);

  // Step 6: Create classrooms
  const { classrooms } = await createClassrooms(school.id);

  // Step 7: Create teachers
  const { teacherUsers, teachers } = await createTeachers(school.id, departments);

  // Step 8: Create guardian types
  const guardianTypes = await createGuardianTypes(school.id);

  // Step 9: Create students and guardians
  const { students, studentUsers } = await createStudentsAndGuardians(
    school.id,
    yearLevels,
    schoolYear,
    guardianTypes
  );

  // Step 10: Create classes and enrollments
  const { classes } = await createClassesAndEnrollments(
    school.id,
    term1.id,
    periods,
    classrooms,
    subjects,
    teachers,
    students
  );

  // Step 11: Create timetable
  await createTimetable(school.id, term1.id, schoolYear, periods, classes);

  // Step 12: Create library
  await createLibrary(school.id);

  // Step 13: Create school branding
  await createSchoolBranding(school.id);

  // Step 14: Create announcements
  await createAnnouncements(school.id, classes);

  // Step 15: Create fees and payments
  await createFeesAndPayments(school.id, classes, students);

  // Step 16: Create exams
  await createExams(school.id, classes, subjects, students);

  // Step 17: Create LMS courses
  await createStreamCourses(school.id, teachers);

  // Step 18: Create lesson plans
  await createLessonPlans(school.id, classes);

  // Step 19: Create report cards
  await createReportCards(school.id, term1.id, students, subjects);

  // Step 20: Seed admission module
  const allUsers = [
    adminUser,
    accountantUser,
    ...teacherUsers,
    ...studentUsers,
  ];
  await seedAdmissionModule(prisma, { school, users: allUsers as Array<{ id: string; email: string }> });

  // Step 21: Seed finance module
  await seedFinanceModule(prisma, {
    school,
    users: allUsers as Array<{ id: string; email: string; role: string }>,
    teachers: teachers.map(t => ({ id: t.id, emailAddress: t.emailAddress })),
    students,
  });

  // Final Summary
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║   ✅ DEMO SEED COMPLETED SUCCESSFULLY                            ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log("\n");
  console.log("📊 Summary:");
  console.log(`   🏫 School: ${school.name} (${school.domain}.databayt.org)`);
  console.log(`   👨‍🏫 Teachers: ${teachers.length}`);
  console.log(`   👨‍🎓 Students: ${students.length}`);
  console.log(`   📚 Classes: ${classes.length}`);
  console.log(`   📖 Year Levels: ${yearLevels.length}`);
  console.log(`   📝 Subjects: ${subjects.length}`);
  console.log(`   📚 Library Books: 20`);
  console.log(`   🎓 LMS Courses: 4`);
  console.log(`   📊 Report Cards: 50`);
  console.log("\n");
  console.log("🔐 Demo Credentials (password: 1234 for all):");
  console.log("   Developer:  dev@databayt.org");
  console.log("   Admin:      admin@demo.databayt.org");
  console.log("   Accountant: accountant@demo.databayt.org");
  console.log("   Teacher:    ahmed.hassan@demo.databayt.org");
  console.log("   Student:    student1@demo.databayt.org");
  console.log("   Guardian:   father1@demo.databayt.org");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
