/**
 * People Seed Module - Bilingual (AR/EN)
 * Creates 25 teachers, 100 students, and their guardians
 *
 * Distribution:
 * - 25 teachers (1:4 student ratio)
 * - 100 students across 14 grade levels
 * - 200 guardians (2 per student - father & mother)
 *
 * Uses UPSERT patterns - safe to run multiple times
 */

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type {
  SeedPrisma,
  UserRef,
  TeacherRef,
  StudentRef,
  GuardianRef,
  DepartmentRef,
  YearLevelRef,
  SchoolYearRef,
  GuardianTypesRef,
} from "./types";
import {
  DEMO_PASSWORD,
  TEACHER_DATA,
  STUDENT_DISTRIBUTION,
  MALE_NAMES,
  FEMALE_NAMES,
  SURNAMES,
  getRandomName,
  getBirthYearForGrade,
  getRandomNeighborhood,
} from "./constants";

// Track used email suffixes to ensure uniqueness
let emailCounter = 0;

function generateUniqueEmail(prefix: string, domain: string = "demo.databayt.org"): string {
  emailCounter++;
  return `${prefix}${emailCounter}@${domain}`;
}

export async function seedPeople(
  prisma: SeedPrisma,
  schoolId: string,
  departments: DepartmentRef[],
  yearLevels: YearLevelRef[],
  schoolYear: SchoolYearRef
): Promise<{
  users: UserRef[];
  teachers: TeacherRef[];
  students: StudentRef[];
  guardians: GuardianRef[];
  guardianTypes: GuardianTypesRef;
}> {
  // Reset email counter
  emailCounter = 0;

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users: UserRef[] = [];
  const teachers: TeacherRef[] = [];
  const students: StudentRef[] = [];
  const guardians: GuardianRef[] = [];

  // ============================================
  // PHASE 1: Create Teachers (25 total) - Bilingual
  // ============================================
  console.log("👨‍🏫 Creating teachers (25, Bilingual AR/EN)...");

  for (const [index, t] of TEACHER_DATA.entries()) {
    const email = `teacher${index + 1}@demo.databayt.org`;
    const fullNameEn = `${t.givenNameEn} ${t.surnameEn}`;

    // findFirst + create user account by email + schoolId
    let user = await prisma.user.findFirst({
      where: { email, schoolId },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: fullNameEn,
          role: UserRole.TEACHER,
          password: passwordHash,
          emailVerified: new Date(),
          school: { connect: { id: schoolId } },
        },
      });
    }
    users.push({ id: user.id, email, role: UserRole.TEACHER });

    // Upsert teacher profile by schoolId + emailAddress
    const teacher = await prisma.teacher.upsert({
      where: { schoolId_emailAddress: { schoolId, emailAddress: email } },
      update: {
        givenName: t.givenNameEn,
        surname: t.surnameEn,
        gender: t.gender,
        userId: user.id,
      },
      create: {
        schoolId,
        givenName: t.givenNameEn,
        surname: t.surnameEn,
        gender: t.gender,
        emailAddress: email,
        userId: user.id,
        birthDate: faker.date.birthdate({ min: 25, max: 55, mode: "age" }),
        joiningDate: faker.date.past({ years: 10 }),
      },
    });
    teachers.push({ id: teacher.id, userId: user.id, emailAddress: email });

    // Upsert teacher phone number by schoolId + teacherId + phoneNumber
    const phoneNumber = `+249-9${faker.string.numeric(8)}`;
    await prisma.teacherPhoneNumber.upsert({
      where: { schoolId_teacherId_phoneNumber: { schoolId, teacherId: teacher.id, phoneNumber } },
      update: { isPrimary: true },
      create: {
        schoolId,
        teacherId: teacher.id,
        phoneNumber,
        isPrimary: true,
      },
    });

    // Link teacher to department (upsert by schoolId + teacherId + departmentId)
    const dept = departments.find((d) => d.departmentName === t.departmentEn);
    if (dept) {
      await prisma.teacherDepartment.upsert({
        where: { schoolId_teacherId_departmentId: { schoolId, teacherId: teacher.id, departmentId: dept.id } },
        update: { isPrimary: true },
        create: {
          schoolId,
          teacherId: teacher.id,
          departmentId: dept.id,
          isPrimary: true,
        },
      });
    }
  }

  console.log(`   ✅ Created: ${teachers.length} teachers`);
  console.log(`      - KG Teachers: 3`);
  console.log(`      - Primary Teachers: 8`);
  console.log(`      - Secondary Teachers: 14\n`);

  // ============================================
  // PHASE 2: Create Guardian Types (upsert by name)
  // ============================================
  console.log("👨‍👩‍👧 Creating guardian types...");

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
  await prisma.guardianType.upsert({
    where: { schoolId_name: { schoolId, name: "Guardian" } },
    update: {},
    create: { schoolId, name: "Guardian" },
  });
  await prisma.guardianType.upsert({
    where: { schoolId_name: { schoolId, name: "Grandparent" } },
    update: {},
    create: { schoolId, name: "Grandparent" },
  });
  await prisma.guardianType.upsert({
    where: { schoolId_name: { schoolId, name: "Sibling" } },
    update: {},
    create: { schoolId, name: "Sibling" },
  });

  console.log(`   ✅ Created: 5 guardian types\n`);

  // ============================================
  // PHASE 3: Create Students (100 total) with Guardians
  // ============================================
  console.log("👨‍🎓 Creating students (100) with guardians (200)...");

  let studentIndex = 0;
  const studentsByLevel: Record<string, StudentRef[]> = {};

  for (const dist of STUDENT_DISTRIBUTION) {
    const level = yearLevels.find((l) => l.levelName === dist.level);
    if (!level) {
      console.warn(`   ⚠️ Level not found: ${dist.level}`);
      continue;
    }

    studentsByLevel[dist.level] = [];

    for (let i = 0; i < dist.count; i++) {
      studentIndex++;

      // Alternate gender for realistic distribution
      const gender = i % 2 === 0 ? "M" : "F";
      const studentData = getRandomName(gender, studentIndex);

      // Use consistent family surname (English for database)
      const familySurnameEn = SURNAMES.en[studentIndex % SURNAMES.en.length];
      const familySurnameAr = SURNAMES.ar[studentIndex % SURNAMES.ar.length];

      // Calculate appropriate birth date for grade level
      const birthYear = getBirthYearForGrade(dist.level);
      const birthMonth = faker.number.int({ min: 1, max: 12 });
      const birthDay = faker.number.int({ min: 1, max: 28 });
      const dateOfBirth = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));

      // Upsert student user by email
      const studentEmail = `student${studentIndex}@demo.databayt.org`;
      let studentUser = await prisma.user.findFirst({
        where: { email: studentEmail, schoolId },
      });
      if (!studentUser) {
        studentUser = await prisma.user.create({
          data: {
            email: studentEmail,
            username: `${studentData.givenNameEn} ${familySurnameEn}`,
            role: UserRole.STUDENT,
            password: passwordHash,
            emailVerified: new Date(),
            school: { connect: { id: schoolId } },
          },
        });
      }
      users.push({ id: studentUser.id, email: studentEmail, role: UserRole.STUDENT });

      // Create student profile (English names for database)
      const middleNameEn =
        gender === "M"
          ? MALE_NAMES.givenEn[(studentIndex + 10) % MALE_NAMES.givenEn.length]
          : FEMALE_NAMES.givenEn[(studentIndex + 10) % FEMALE_NAMES.givenEn.length];

      // Get neighborhood in bilingual format
      const neighborhood = getRandomNeighborhood(studentIndex);
      const studentId = `STU${String(studentIndex).padStart(4, "0")}`;

      // Upsert student by schoolId + studentId
      const student = await prisma.student.upsert({
        where: { schoolId_studentId: { schoolId, studentId } },
        update: {
          givenName: studentData.givenNameEn,
          middleName: middleNameEn,
          surname: familySurnameEn,
          gender,
          userId: studentUser.id,
        },
        create: {
          schoolId,
          givenName: studentData.givenNameEn,
          middleName: middleNameEn,
          surname: familySurnameEn,
          dateOfBirth,
          gender,
          userId: studentUser.id,
          enrollmentDate: new Date("2025-09-01"),
          studentId,
          currentAddress: `${neighborhood.en}, Khartoum`,
          nationality: "Sudanese",
        },
      });
      students.push({ id: student.id, userId: studentUser.id });
      studentsByLevel[dist.level].push({ id: student.id, userId: studentUser.id });

      // Upsert student year level by schoolId + studentId + yearId
      await prisma.studentYearLevel.upsert({
        where: { schoolId_studentId_yearId: { schoolId, studentId: student.id, yearId: schoolYear.id } },
        update: { levelId: level.id },
        create: {
          schoolId,
          studentId: student.id,
          levelId: level.id,
          yearId: schoolYear.id,
        },
      });

      // Create Father (English names for database)
      const fatherData = getRandomName("M", studentIndex + 1000);
      const fatherEmail = `father${studentIndex}@demo.databayt.org`;
      const fatherPhone = `+249-9${faker.string.numeric(8)}`;

      // findFirst + create father user by email + schoolId
      let fatherUser = await prisma.user.findFirst({
        where: { email: fatherEmail, schoolId },
      });
      if (!fatherUser) {
        fatherUser = await prisma.user.create({
          data: {
            email: fatherEmail,
            username: `${fatherData.givenNameEn} ${familySurnameEn}`,
            role: UserRole.GUARDIAN,
            password: passwordHash,
            emailVerified: new Date(),
            school: { connect: { id: schoolId } },
          },
        });
      }

      // Upsert father guardian by schoolId + emailAddress
      const father = await prisma.guardian.upsert({
        where: { schoolId_emailAddress: { schoolId, emailAddress: fatherEmail } },
        update: {
          givenName: fatherData.givenNameEn,
          surname: familySurnameEn,
          userId: fatherUser.id,
        },
        create: {
          schoolId,
          givenName: fatherData.givenNameEn,
          surname: familySurnameEn,
          emailAddress: fatherEmail,
          userId: fatherUser.id,
        },
      });

      // Upsert father phone number
      await prisma.guardianPhoneNumber.upsert({
        where: { schoolId_guardianId_phoneNumber: { schoolId, guardianId: father.id, phoneNumber: fatherPhone } },
        update: { isPrimary: true },
        create: {
          schoolId,
          guardianId: father.id,
          phoneNumber: fatherPhone,
          isPrimary: true,
        },
      });

      guardians.push({ id: father.id });

      // Create Mother (English names for database)
      const motherData = getRandomName("F", studentIndex + 2000);
      const motherEmail = `mother${studentIndex}@demo.databayt.org`;
      const motherPhone = `+249-9${faker.string.numeric(8)}`;

      // findFirst + create mother user by email + schoolId
      let motherUser = await prisma.user.findFirst({
        where: { email: motherEmail, schoolId },
      });
      if (!motherUser) {
        motherUser = await prisma.user.create({
          data: {
            email: motherEmail,
            username: `${motherData.givenNameEn} ${familySurnameEn}`,
            role: UserRole.GUARDIAN,
            password: passwordHash,
            emailVerified: new Date(),
            school: { connect: { id: schoolId } },
          },
        });
      }

      // Upsert mother guardian by schoolId + emailAddress
      const mother = await prisma.guardian.upsert({
        where: { schoolId_emailAddress: { schoolId, emailAddress: motherEmail } },
        update: {
          givenName: motherData.givenNameEn,
          surname: familySurnameEn,
          userId: motherUser.id,
        },
        create: {
          schoolId,
          givenName: motherData.givenNameEn,
          surname: familySurnameEn,
          emailAddress: motherEmail,
          userId: motherUser.id,
        },
      });

      // Upsert mother phone number
      await prisma.guardianPhoneNumber.upsert({
        where: { schoolId_guardianId_phoneNumber: { schoolId, guardianId: mother.id, phoneNumber: motherPhone } },
        update: { isPrimary: true },
        create: {
          schoolId,
          guardianId: mother.id,
          phoneNumber: motherPhone,
          isPrimary: true,
        },
      });

      guardians.push({ id: mother.id });

      // Upsert student-guardian links by schoolId + studentId + guardianId
      await prisma.studentGuardian.upsert({
        where: { schoolId_studentId_guardianId: { schoolId, studentId: student.id, guardianId: father.id } },
        update: {
          guardianTypeId: gtFather.id,
          isPrimary: false,
        },
        create: {
          schoolId,
          studentId: student.id,
          guardianId: father.id,
          guardianTypeId: gtFather.id,
          isPrimary: false,
        },
      });

      await prisma.studentGuardian.upsert({
        where: { schoolId_studentId_guardianId: { schoolId, studentId: student.id, guardianId: mother.id } },
        update: {
          guardianTypeId: gtMother.id,
          isPrimary: true,
        },
        create: {
          schoolId,
          studentId: student.id,
          guardianId: mother.id,
          guardianTypeId: gtMother.id,
          isPrimary: true,
        },
      });
    }
  }

  // Print distribution summary
  console.log(`   ✅ Created: ${students.length} students, ${guardians.length} guardians`);
  console.log(`\n   Distribution by Grade Level:`);
  for (const dist of STUDENT_DISTRIBUTION) {
    const count = studentsByLevel[dist.level]?.length || 0;
    const section = dist.level.startsWith("KG")
      ? "KG"
      : dist.level.includes("Grade 1") ||
        dist.level.includes("Grade 2") ||
        dist.level.includes("Grade 3") ||
        dist.level.includes("Grade 4") ||
        dist.level.includes("Grade 5") ||
        dist.level.includes("Grade 6")
      ? "Primary"
      : dist.level.includes("Grade 7") ||
        dist.level.includes("Grade 8") ||
        dist.level.includes("Grade 9")
      ? "Intermediate"
      : "Secondary";
    console.log(`      - ${dist.level.padEnd(10)}: ${count} students (${section})`);
  }
  console.log("");

  return {
    users,
    teachers,
    students,
    guardians,
    guardianTypes: { gtFather: { id: gtFather.id }, gtMother: { id: gtMother.id } },
  };
}
