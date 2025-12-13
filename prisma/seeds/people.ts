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
  STUDENT_DISTRIBUTION,
  MALE_NAMES,
  FEMALE_NAMES,
  SURNAMES,
  getRandomName,
  getBirthYearForGrade,
  getRandomNeighborhood,
  generatePersonalEmail,
  getAllTeachers,
  TARGET_TEACHER_COUNT,
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
  // PHASE 1: Create Teachers (100 total) - Bilingual
  // ============================================
  const allTeachers = getAllTeachers();
  console.log(`👨‍🏫 Creating teachers (${allTeachers.length}, Bilingual AR/EN)...`);

  for (const [index, t] of allTeachers.entries()) {
    // Use personal email (e.g., fatima.hassan@gmail.com) instead of numbered IDs
    const email = generatePersonalEmail(t.givenNameEn, t.surnameEn, index + 30000);
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
  console.log(`      - Target: ${TARGET_TEACHER_COUNT} teachers (1:10 student ratio)`);
  console.log(`      - Covers all K-12 levels with bilingual names\n`);

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
  // PHASE 3: Create Students (1000 total) with Guardians
  // ============================================
  console.log("👨‍🎓 Creating students (1000) with guardians (2000)...");

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

      // Upsert student user by email (personal email format)
      const studentEmail = generatePersonalEmail(
        studentData.givenNameEn,
        familySurnameEn,
        studentIndex
      );
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

      // Create Father (English names for database, personal email)
      const fatherData = getRandomName("M", studentIndex + 1000);
      const fatherEmail = generatePersonalEmail(
        fatherData.givenNameEn,
        familySurnameEn,
        studentIndex + 10000 // Offset to avoid collision with student emails
      );
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

      // Create Mother (English names for database, personal email)
      const motherData = getRandomName("F", studentIndex + 2000);
      const motherEmail = generatePersonalEmail(
        motherData.givenNameEn,
        familySurnameEn,
        studentIndex + 20000 // Offset to avoid collision with other emails
      );
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

// ============================================
// Teacher Qualifications, Experience & Expertise
// ============================================

// Qualification templates (bilingual)
const QUALIFICATION_TEMPLATES = {
  degrees: [
    { type: "DEGREE", nameEn: "Bachelor of Education", nameAr: "بكالوريوس التربية", majors: ["Primary Education", "Secondary Education", "Special Education"] },
    { type: "DEGREE", nameEn: "Bachelor of Science", nameAr: "بكالوريوس العلوم", majors: ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"] },
    { type: "DEGREE", nameEn: "Bachelor of Arts", nameAr: "بكالوريوس الآداب", majors: ["English", "Arabic", "History", "Geography", "Islamic Studies"] },
    { type: "DEGREE", nameEn: "Master of Education", nameAr: "ماجستير التربية", majors: ["Curriculum & Instruction", "Educational Leadership", "Educational Psychology"] },
    { type: "DEGREE", nameEn: "Master of Science", nameAr: "ماجستير العلوم", majors: ["Applied Mathematics", "Physics", "Chemistry"] },
    { type: "DEGREE", nameEn: "PhD in Education", nameAr: "دكتوراه في التربية", majors: ["Educational Research", "Higher Education"] },
  ],
  certifications: [
    { type: "CERTIFICATION", nameEn: "Teaching License", nameAr: "رخصة التدريس", hasExpiry: true },
    { type: "CERTIFICATION", nameEn: "TEFL Certificate", nameAr: "شهادة تدريس اللغة الإنجليزية", hasExpiry: false },
    { type: "CERTIFICATION", nameEn: "First Aid Certification", nameAr: "شهادة الإسعافات الأولية", hasExpiry: true },
    { type: "CERTIFICATION", nameEn: "Child Protection Training", nameAr: "تدريب حماية الطفل", hasExpiry: true },
    { type: "CERTIFICATION", nameEn: "Special Education Certificate", nameAr: "شهادة التربية الخاصة", hasExpiry: false },
    { type: "CERTIFICATION", nameEn: "Cambridge Teaching Certificate", nameAr: "شهادة كامبريدج للتدريس", hasExpiry: false },
    { type: "CERTIFICATION", nameEn: "ICT in Education Certificate", nameAr: "شهادة تقنية المعلومات في التعليم", hasExpiry: false },
    { type: "CERTIFICATION", nameEn: "Educational Assessment Certificate", nameAr: "شهادة التقييم التربوي", hasExpiry: false },
  ],
  licenses: [
    { type: "LICENSE", nameEn: "National Teaching License", nameAr: "رخصة التدريس الوطنية", hasExpiry: true },
    { type: "LICENSE", nameEn: "Subject Teaching License", nameAr: "رخصة تدريس المادة", hasExpiry: true },
  ],
};

// Universities (bilingual)
const UNIVERSITIES = [
  { en: "University of Khartoum", ar: "جامعة الخرطوم" },
  { en: "Sudan University of Science and Technology", ar: "جامعة السودان للعلوم والتكنولوجيا" },
  { en: "Omdurman Islamic University", ar: "جامعة أم درمان الإسلامية" },
  { en: "Al-Neelain University", ar: "جامعة النيلين" },
  { en: "Ahfad University for Women", ar: "جامعة الأحفاد للبنات" },
  { en: "University of Gezira", ar: "جامعة الجزيرة" },
  { en: "Red Sea University", ar: "جامعة البحر الأحمر" },
  { en: "Nile Valley University", ar: "جامعة وادي النيل" },
];

// Previous schools for experience
const PREVIOUS_SCHOOLS = [
  { en: "Khartoum International School", ar: "مدرسة الخرطوم الدولية" },
  { en: "Al-Amjad National School", ar: "مدرسة الأمجاد الوطنية" },
  { en: "Unity High School", ar: "مدرسة الوحدة الثانوية" },
  { en: "Al-Nahda Secondary School", ar: "مدرسة النهضة الثانوية" },
  { en: "Al-Fajr Private School", ar: "مدرسة الفجر الخاصة" },
  { en: "Comboni School", ar: "مدرسة كمبوني" },
  { en: "Al-Riyadh Model School", ar: "مدرسة الرياض النموذجية" },
  { en: "Al-Iman Islamic School", ar: "مدرسة الإيمان الإسلامية" },
];

// Position titles
const POSITIONS = [
  { en: "Teacher", ar: "معلم" },
  { en: "Senior Teacher", ar: "معلم أول" },
  { en: "Department Head", ar: "رئيس قسم" },
  { en: "Classroom Teacher", ar: "معلم فصل" },
  { en: "Subject Teacher", ar: "معلم مادة" },
  { en: "Assistant Teacher", ar: "معلم مساعد" },
];

export async function seedTeacherQualifications(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("📜 Creating teacher qualifications & experience...");

  // Get all teachers
  const teachers = await prisma.teacher.findMany({
    where: { schoolId },
    select: { id: true, givenName: true, surname: true },
  });

  if (teachers.length === 0) {
    console.log("   ⚠️  No teachers found, skipping qualifications\n");
    return;
  }

  // Check existing counts
  const existingQuals = await prisma.teacherQualification.count({ where: { schoolId } });
  const existingExp = await prisma.teacherExperience.count({ where: { schoolId } });

  if (existingQuals >= 100 && existingExp >= 50) {
    console.log(`   ✅ Qualifications already exist (${existingQuals} quals, ${existingExp} exp), skipping\n`);
    return;
  }

  const now = new Date();
  let qualCount = 0;
  let expCount = 0;
  let expertiseCount = 0;

  // Get subjects for expertise mapping
  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    select: { id: true, subjectName: true },
  });

  for (const [index, teacher] of teachers.entries()) {
    // ============================================
    // 1. Qualifications (2-3 per teacher)
    // ============================================

    // Primary degree (everyone has one)
    const degreeTemplate = QUALIFICATION_TEMPLATES.degrees[index % QUALIFICATION_TEMPLATES.degrees.length];
    const university = UNIVERSITIES[index % UNIVERSITIES.length];
    const major = degreeTemplate.majors[index % degreeTemplate.majors.length];
    const yearsAgo = 10 + Math.floor(Math.random() * 15); // 10-25 years ago

    await prisma.teacherQualification.upsert({
      where: {
        schoolId_teacherId_qualificationType_name: {
          schoolId,
          teacherId: teacher.id,
          qualificationType: degreeTemplate.type,
          name: degreeTemplate.nameEn,
        },
      },
      update: {},
      create: {
        schoolId,
        teacherId: teacher.id,
        qualificationType: degreeTemplate.type,
        name: degreeTemplate.nameEn,
        institution: university.en,
        major,
        dateObtained: new Date(now.getFullYear() - yearsAgo, Math.floor(Math.random() * 12), 15),
      },
    });
    qualCount++;

    // Teaching certification (80% have one)
    if (Math.random() < 0.8) {
      const certTemplate = QUALIFICATION_TEMPLATES.certifications[index % QUALIFICATION_TEMPLATES.certifications.length];
      const certYearsAgo = Math.floor(Math.random() * 10);
      const certDate = new Date(now.getFullYear() - certYearsAgo, Math.floor(Math.random() * 12), 15);

      await prisma.teacherQualification.upsert({
        where: {
          schoolId_teacherId_qualificationType_name: {
            schoolId,
            teacherId: teacher.id,
            qualificationType: certTemplate.type,
            name: certTemplate.nameEn,
          },
        },
        update: {},
        create: {
          schoolId,
          teacherId: teacher.id,
          qualificationType: certTemplate.type,
          name: certTemplate.nameEn,
          institution: "Ministry of Education",
          dateObtained: certDate,
          expiryDate: certTemplate.hasExpiry
            ? new Date(certDate.getFullYear() + 5, certDate.getMonth(), certDate.getDate())
            : null,
          licenseNumber: certTemplate.hasExpiry ? `LIC-${String(index + 1).padStart(5, "0")}` : null,
        },
      });
      qualCount++;
    }

    // Advanced degree (30% have masters/PhD)
    if (Math.random() < 0.3) {
      const advancedDegree = QUALIFICATION_TEMPLATES.degrees.find(d =>
        d.nameEn.includes("Master") || d.nameEn.includes("PhD")
      );
      if (advancedDegree) {
        const advYearsAgo = 5 + Math.floor(Math.random() * 10);
        const advUniversity = UNIVERSITIES[(index + 3) % UNIVERSITIES.length];
        const advMajor = advancedDegree.majors[index % advancedDegree.majors.length];

        await prisma.teacherQualification.upsert({
          where: {
            schoolId_teacherId_qualificationType_name: {
              schoolId,
              teacherId: teacher.id,
              qualificationType: advancedDegree.type,
              name: advancedDegree.nameEn,
            },
          },
          update: {},
          create: {
            schoolId,
            teacherId: teacher.id,
            qualificationType: advancedDegree.type,
            name: advancedDegree.nameEn,
            institution: advUniversity.en,
            major: advMajor,
            dateObtained: new Date(now.getFullYear() - advYearsAgo, Math.floor(Math.random() * 12), 15),
          },
        });
        qualCount++;
      }
    }

    // ============================================
    // 2. Experience (1-3 previous positions per teacher)
    // ============================================

    const expCount_teacher = 1 + Math.floor(Math.random() * 3);
    let expEndDate = new Date(now.getFullYear() - 1, 8, 1); // Start from last year

    for (let e = 0; e < expCount_teacher; e++) {
      const school = PREVIOUS_SCHOOLS[(index + e) % PREVIOUS_SCHOOLS.length];
      const position = POSITIONS[e % POSITIONS.length];
      const duration = 2 + Math.floor(Math.random() * 5); // 2-6 years
      const startDate = new Date(expEndDate.getFullYear() - duration, 8, 1);

      // Check if this exact record exists
      const existingRecord = await prisma.teacherExperience.findFirst({
        where: {
          schoolId,
          teacherId: teacher.id,
          institution: school.en,
          position: position.en,
        },
      });

      if (!existingRecord) {
        await prisma.teacherExperience.create({
          data: {
            schoolId,
            teacherId: teacher.id,
            institution: school.en,
            position: position.en,
            startDate,
            endDate: expEndDate,
            isCurrent: false,
            description: `Taught classes and contributed to curriculum development at ${school.en}.`,
          },
        });
        expCount++;
      }

      expEndDate = new Date(startDate.getFullYear() - 1, 8, 1); // Gap before previous job
    }

    // ============================================
    // 3. Subject Expertise (1-2 subjects per teacher)
    // ============================================

    if (subjects.length > 0) {
      const numSubjects = 1 + Math.floor(Math.random() * 2);
      const teacherSubjects = subjects
        .sort(() => Math.random() - 0.5)
        .slice(0, numSubjects);

      for (const [si, subject] of teacherSubjects.entries()) {
        const expertiseLevel = si === 0 ? "PRIMARY" : "SECONDARY";

        await prisma.teacherSubjectExpertise.upsert({
          where: {
            schoolId_teacherId_subjectId: {
              schoolId,
              teacherId: teacher.id,
              subjectId: subject.id,
            },
          },
          update: { expertiseLevel },
          create: {
            schoolId,
            teacherId: teacher.id,
            subjectId: subject.id,
            expertiseLevel,
          },
        });
        expertiseCount++;
      }
    }
  }

  console.log(`   ✅ Created teacher professional data:`);
  console.log(`      - ${qualCount} qualifications (degrees, certifications)`);
  console.log(`      - ${expCount} experience records (previous positions)`);
  console.log(`      - ${expertiseCount} subject expertise mappings\n`);
}
