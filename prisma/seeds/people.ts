/**
 * People Seed Module - Realistic K-12 School
 * Creates 25 teachers, 100 students, and their guardians
 *
 * Distribution:
 * - 25 teachers (1:4 student ratio)
 * - 100 students across 14 grade levels
 * - 200 guardians (2 per student - father & mother)
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
  KHARTOUM_NEIGHBORHOODS,
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
  // PHASE 1: Create Teachers (25 total)
  // ============================================
  console.log("👨‍🏫 Creating teachers (25)...");

  for (const [index, t] of TEACHER_DATA.entries()) {
    const email = `teacher${index + 1}@demo.databayt.org`;
    const fullName = `${t.givenName} ${t.surname}`;

    // Create user account
    const user = await prisma.user.create({
      data: {
        email,
        username: fullName,
        role: UserRole.TEACHER,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });
    users.push({ id: user.id, email, role: UserRole.TEACHER });

    // Create teacher profile
    const teacher = await prisma.teacher.create({
      data: {
        schoolId,
        givenName: t.givenName,
        surname: t.surname,
        gender: t.gender,
        emailAddress: email,
        userId: user.id,
        birthDate: faker.date.birthdate({ min: 25, max: 55, mode: "age" }),
        joiningDate: faker.date.past({ years: 10 }),
      },
    });
    teachers.push({ id: teacher.id, userId: user.id, emailAddress: email });

    // Create teacher phone number
    await prisma.teacherPhoneNumber.create({
      data: {
        schoolId,
        teacherId: teacher.id,
        phoneNumber: `+249-9${faker.string.numeric(8)}`,
        isPrimary: true,
      },
    });

    // Link teacher to department
    const dept = departments.find((d) => d.departmentName === t.dept);
    if (dept) {
      await prisma.teacherDepartment.create({
        data: {
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
  // PHASE 2: Create Guardian Types
  // ============================================
  console.log("👨‍👩‍👧 Creating guardian types...");

  const gtFather = await prisma.guardianType.create({
    data: { schoolId, name: "Father" },
  });
  const gtMother = await prisma.guardianType.create({
    data: { schoolId, name: "Mother" },
  });
  await prisma.guardianType.create({
    data: { schoolId, name: "Guardian" },
  });
  await prisma.guardianType.create({
    data: { schoolId, name: "Grandparent" },
  });
  await prisma.guardianType.create({
    data: { schoolId, name: "Sibling" },
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
      const studentData = getRandomName(gender);

      // Use consistent family surname
      const familySurname = SURNAMES[studentIndex % SURNAMES.length];

      // Calculate appropriate birth date for grade level
      const birthYear = getBirthYearForGrade(dist.level);
      const birthMonth = faker.number.int({ min: 1, max: 12 });
      const birthDay = faker.number.int({ min: 1, max: 28 });
      const dateOfBirth = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));

      // Create student user
      const studentEmail = `student${studentIndex}@demo.databayt.org`;
      const studentUser = await prisma.user.create({
        data: {
          email: studentEmail,
          username: `${studentData.givenName} ${familySurname}`,
          role: UserRole.STUDENT,
          password: passwordHash,
          emailVerified: new Date(),
          school: { connect: { id: schoolId } },
        },
      });
      users.push({ id: studentUser.id, email: studentEmail, role: UserRole.STUDENT });

      // Create student profile
      const middleName =
        gender === "M"
          ? MALE_NAMES[(studentIndex + 10) % MALE_NAMES.length]
          : FEMALE_NAMES[(studentIndex + 10) % FEMALE_NAMES.length];

      const student = await prisma.student.create({
        data: {
          schoolId,
          givenName: studentData.givenName,
          middleName,
          surname: familySurname,
          dateOfBirth,
          gender,
          userId: studentUser.id,
          enrollmentDate: new Date("2025-09-01"),
          studentId: `STU${String(studentIndex).padStart(4, "0")}`,
          currentAddress: `${faker.helpers.arrayElement(KHARTOUM_NEIGHBORHOODS)}، الخرطوم`,
          nationality: "Sudanese",
        },
      });
      students.push({ id: student.id, userId: studentUser.id });
      studentsByLevel[dist.level].push({ id: student.id, userId: studentUser.id });

      // Assign student to year level
      await prisma.studentYearLevel.create({
        data: {
          schoolId,
          studentId: student.id,
          levelId: level.id,
          yearId: schoolYear.id,
        },
      });

      // Create Father
      const fatherData = getRandomName("M");
      const fatherEmail = `father${studentIndex}@demo.databayt.org`;
      const fatherPhone = `+249-9${faker.string.numeric(8)}`;

      const fatherUser = await prisma.user.create({
        data: {
          email: fatherEmail,
          username: `${fatherData.givenName} ${familySurname}`,
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
          phoneNumber: fatherPhone,
          isPrimary: true,
        },
      });

      guardians.push({ id: father.id });

      // Create Mother
      const motherData = getRandomName("F");
      const motherEmail = `mother${studentIndex}@demo.databayt.org`;
      const motherPhone = `+249-9${faker.string.numeric(8)}`;

      const motherUser = await prisma.user.create({
        data: {
          email: motherEmail,
          username: `${motherData.givenName} ${familySurname}`,
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
          phoneNumber: motherPhone,
          isPrimary: true,
        },
      });

      guardians.push({ id: mother.id });

      // Link guardians to student
      await prisma.studentGuardian.create({
        data: {
          schoolId,
          studentId: student.id,
          guardianId: father.id,
          guardianTypeId: gtFather.id,
          isPrimary: false,
        },
      });

      await prisma.studentGuardian.create({
        data: {
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
