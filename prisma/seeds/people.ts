/**
 * People Seed Module
 * Creates teachers, students, guardians
 */

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import type { SeedPrisma, UserRef, TeacherRef, StudentRef, GuardianRef, DepartmentRef, YearLevelRef, SchoolYearRef, GuardianTypesRef } from "./types";
import { DEMO_PASSWORD, MALE_NAMES, FEMALE_NAMES, SURNAMES, getRandomName } from "./constants";

// Teacher data with departments
const TEACHER_DATA = [
  // Languages (10)
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
  // Sciences (15)
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
  // Humanities (8)
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
  console.log("👨‍🏫 Creating teachers (50)...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users: UserRef[] = [];
  const teachers: TeacherRef[] = [];

  // Create teachers
  for (const t of TEACHER_DATA) {
    const email = `${t.givenName.toLowerCase()}.${t.surname.toLowerCase()}@demo.databayt.org`;

    const user = await prisma.user.create({
      data: {
        email,
        username: `${t.givenName} ${t.surname}`,
        role: UserRole.TEACHER,
        password: passwordHash,
        emailVerified: new Date(),
        school: { connect: { id: schoolId } },
      },
    });
    users.push({ id: user.id, email, role: UserRole.TEACHER });

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

    // Link to department
    const dept = departments.find((d) => d.departmentName === t.dept);
    if (dept) {
      await prisma.teacherDepartment.create({
        data: { schoolId, teacherId: teacher.id, departmentId: dept.id, isPrimary: true },
      });
    }
  }

  console.log(`   ✅ Created: ${teachers.length} teachers\n`);

  // Guardian types
  console.log("👨‍👩‍👧 Creating guardian types...");
  const gtFather = await prisma.guardianType.create({ data: { schoolId, name: "Father" } });
  const gtMother = await prisma.guardianType.create({ data: { schoolId, name: "Mother" } });
  await prisma.guardianType.create({ data: { schoolId, name: "Uncle" } });
  await prisma.guardianType.create({ data: { schoolId, name: "Aunt" } });
  await prisma.guardianType.create({ data: { schoolId, name: "Grandparent" } });

  // Students and guardians
  console.log("👨‍🎓 Creating students (200) and guardians...");

  const students: StudentRef[] = [];
  const guardians: GuardianRef[] = [];
  const studentsPerLevel = Math.ceil(200 / yearLevels.length);

  for (const [levelIndex, level] of yearLevels.entries()) {
    const count = levelIndex < yearLevels.length - 1 ? studentsPerLevel : 200 - students.length;

    for (let i = 0; i < count && students.length < 200; i++) {
      const gender = i % 2 === 0 ? "M" : "F";
      const studentData = getRandomName(gender);
      const familySurname = SURNAMES[(students.length) % SURNAMES.length];
      const middleName = gender === "M"
        ? MALE_NAMES[(students.length + 5) % MALE_NAMES.length]
        : FEMALE_NAMES[(students.length + 5) % FEMALE_NAMES.length];

      const studentEmail = `student${students.length + 1}@demo.databayt.org`;

      // Student user
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

      // DOB based on grade level
      const baseYear = 2025 - (levelIndex + 5);
      const dobYear = baseYear - faker.number.int({ min: 0, max: 1 });
      const dob = new Date(Date.UTC(dobYear, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 })));

      // Student
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

      // Father
      const fatherData = getRandomName("M");
      const fatherEmail = `father${students.length}@demo.databayt.org`;

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
          phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`,
          isPrimary: true,
        },
      });

      // Mother
      const motherData = getRandomName("F");
      const motherEmail = `mother${students.length}@demo.databayt.org`;

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
          phoneNumber: `+249-9${faker.number.int({ min: 10_000_000, max: 99_999_999 })}`,
          isPrimary: true,
        },
      });

      guardians.push({ id: father.id }, { id: mother.id });

      // Link guardians
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

  console.log(`   ✅ Created: ${students.length} students, ${guardians.length} guardians\n`);

  return {
    users,
    teachers,
    students,
    guardians,
    guardianTypes: { gtFather: { id: gtFather.id }, gtMother: { id: gtMother.id } },
  };
}
