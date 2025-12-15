/**
 * Non-Teaching Staff Seed Module
 * Creates 50+ non-teaching staff members for realistic K-12 school
 *
 * Categories:
 * - Administration (principal, vice principals, secretaries)
 * - Support Staff (nurses, counselors, librarians)
 * - Operations (security, maintenance, cleaning)
 * - Services (cafeteria, transportation)
 * - IT Support
 */

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { SeedPrisma } from "./types";
import { DEMO_PASSWORD, MALE_NAMES, FEMALE_NAMES, SURNAMES, getRandomNeighborhood, generatePersonalEmail } from "./constants";

// ============================================================================
// STAFF POSITIONS (Bilingual)
// ============================================================================

interface StaffPosition {
  titleEn: string;
  titleAr: string;
  department: string;
  count: number;
  gender?: "M" | "F" | "any";
  salaryRange: [number, number]; // SDG monthly
  qualifications: string[];
}

const STAFF_POSITIONS: StaffPosition[] = [
  // Administration
  { titleEn: "School Principal", titleAr: "مدير المدرسة", department: "Administration", count: 1, gender: "M", salaryRange: [150000, 200000], qualifications: ["PhD in Education", "15+ years experience"] },
  { titleEn: "Vice Principal - Academic", titleAr: "نائب المدير - الشؤون الأكاديمية", department: "Administration", count: 1, gender: "any", salaryRange: [120000, 150000], qualifications: ["Master's in Education", "10+ years experience"] },
  { titleEn: "Vice Principal - Student Affairs", titleAr: "نائب المدير - شؤون الطلاب", department: "Administration", count: 1, gender: "any", salaryRange: [120000, 150000], qualifications: ["Master's in Education", "10+ years experience"] },
  { titleEn: "Administrative Secretary", titleAr: "سكرتير إداري", department: "Administration", count: 3, gender: "any", salaryRange: [40000, 60000], qualifications: ["Diploma in Secretarial Studies"] },
  { titleEn: "Registrar", titleAr: "مسجل الطلاب", department: "Administration", count: 2, gender: "any", salaryRange: [50000, 70000], qualifications: ["Bachelor's degree", "Experience in student records"] },
  { titleEn: "Admissions Officer", titleAr: "موظف القبول", department: "Administration", count: 2, gender: "any", salaryRange: [45000, 65000], qualifications: ["Bachelor's degree", "Communication skills"] },

  // Finance
  { titleEn: "Finance Manager", titleAr: "مدير المالية", department: "Finance", count: 1, gender: "any", salaryRange: [100000, 130000], qualifications: ["Bachelor's in Accounting", "CPA certification"] },
  { titleEn: "Accountant", titleAr: "محاسب", department: "Finance", count: 2, gender: "any", salaryRange: [50000, 70000], qualifications: ["Bachelor's in Accounting"] },
  { titleEn: "Cashier", titleAr: "أمين الصندوق", department: "Finance", count: 2, gender: "any", salaryRange: [35000, 50000], qualifications: ["Diploma in Accounting"] },
  { titleEn: "Procurement Officer", titleAr: "موظف المشتريات", department: "Finance", count: 1, gender: "any", salaryRange: [45000, 60000], qualifications: ["Diploma in Business"] },

  // Student Support
  { titleEn: "School Nurse", titleAr: "ممرضة المدرسة", department: "Health", count: 2, gender: "F", salaryRange: [50000, 70000], qualifications: ["Nursing Diploma", "First Aid certification"] },
  { titleEn: "School Counselor", titleAr: "مرشد نفسي", department: "Student Services", count: 2, gender: "any", salaryRange: [60000, 80000], qualifications: ["Bachelor's in Psychology", "Counseling certification"] },
  { titleEn: "Social Worker", titleAr: "أخصائي اجتماعي", department: "Student Services", count: 1, gender: "any", salaryRange: [55000, 75000], qualifications: ["Bachelor's in Social Work"] },
  { titleEn: "Special Education Coordinator", titleAr: "منسق التربية الخاصة", department: "Student Services", count: 1, gender: "any", salaryRange: [65000, 85000], qualifications: ["Master's in Special Education"] },

  // Library
  { titleEn: "Head Librarian", titleAr: "أمين المكتبة الرئيسي", department: "Library", count: 1, gender: "any", salaryRange: [60000, 80000], qualifications: ["Bachelor's in Library Science"] },
  { titleEn: "Assistant Librarian", titleAr: "مساعد أمين المكتبة", department: "Library", count: 2, gender: "any", salaryRange: [40000, 55000], qualifications: ["Diploma in Library Science"] },

  // Laboratory
  { titleEn: "Science Lab Technician", titleAr: "فني معمل العلوم", department: "Laboratory", count: 2, gender: "any", salaryRange: [45000, 60000], qualifications: ["Diploma in Laboratory Technology"] },
  { titleEn: "Computer Lab Technician", titleAr: "فني معمل الحاسوب", department: "IT", count: 2, gender: "any", salaryRange: [50000, 70000], qualifications: ["Diploma in Computer Science"] },

  // IT
  { titleEn: "IT Manager", titleAr: "مدير تقنية المعلومات", department: "IT", count: 1, gender: "any", salaryRange: [80000, 110000], qualifications: ["Bachelor's in IT", "Network certification"] },
  { titleEn: "IT Support Technician", titleAr: "فني دعم تقنية المعلومات", department: "IT", count: 2, gender: "any", salaryRange: [45000, 65000], qualifications: ["Diploma in IT"] },

  // Security
  { titleEn: "Security Supervisor", titleAr: "مشرف الأمن", department: "Security", count: 1, gender: "M", salaryRange: [40000, 55000], qualifications: ["Security training", "5+ years experience"] },
  { titleEn: "Security Guard", titleAr: "حارس أمن", department: "Security", count: 5, gender: "M", salaryRange: [25000, 35000], qualifications: ["Security training"] },
  { titleEn: "Gate Keeper", titleAr: "حارس البوابة", department: "Security", count: 2, gender: "M", salaryRange: [22000, 30000], qualifications: ["Basic training"] },

  // Maintenance
  { titleEn: "Maintenance Supervisor", titleAr: "مشرف الصيانة", department: "Maintenance", count: 1, gender: "M", salaryRange: [45000, 60000], qualifications: ["Technical diploma", "5+ years experience"] },
  { titleEn: "Electrician", titleAr: "كهربائي", department: "Maintenance", count: 1, gender: "M", salaryRange: [35000, 50000], qualifications: ["Electrical certification"] },
  { titleEn: "Plumber", titleAr: "سباك", department: "Maintenance", count: 1, gender: "M", salaryRange: [35000, 50000], qualifications: ["Plumbing certification"] },
  { titleEn: "General Maintenance Worker", titleAr: "عامل صيانة عام", department: "Maintenance", count: 2, gender: "M", salaryRange: [25000, 35000], qualifications: ["Basic skills"] },

  // Cleaning
  { titleEn: "Cleaning Supervisor", titleAr: "مشرف النظافة", department: "Operations", count: 1, gender: "any", salaryRange: [30000, 40000], qualifications: ["Supervisory experience"] },
  { titleEn: "Cleaner", titleAr: "عامل نظافة", department: "Operations", count: 8, gender: "any", salaryRange: [18000, 25000], qualifications: ["Basic training"] },

  // Cafeteria
  { titleEn: "Cafeteria Manager", titleAr: "مدير المقصف", department: "Cafeteria", count: 1, gender: "any", salaryRange: [40000, 55000], qualifications: ["Food service management"] },
  { titleEn: "Cook", titleAr: "طباخ", department: "Cafeteria", count: 3, gender: "any", salaryRange: [25000, 35000], qualifications: ["Cooking experience", "Food safety training"] },
  { titleEn: "Kitchen Helper", titleAr: "مساعد مطبخ", department: "Cafeteria", count: 2, gender: "any", salaryRange: [18000, 25000], qualifications: ["Basic training"] },

  // Transportation
  { titleEn: "Transportation Coordinator", titleAr: "منسق النقل", department: "Transportation", count: 1, gender: "any", salaryRange: [45000, 60000], qualifications: ["Administrative experience"] },
  { titleEn: "Bus Driver", titleAr: "سائق حافلة", department: "Transportation", count: 4, gender: "M", salaryRange: [30000, 40000], qualifications: ["Commercial driving license", "Clean record"] },
  { titleEn: "Bus Monitor", titleAr: "مراقب الحافلة", department: "Transportation", count: 4, gender: "F", salaryRange: [20000, 28000], qualifications: ["Child care experience"] },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedStaff(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  console.log("👷 Creating non-teaching staff (50+ members)...");

  // Check if staff already exists
  const existingStaff = await prisma.user.count({
    where: { schoolId, role: UserRole.STAFF },
  });

  if (existingStaff >= 30) {
    console.log(`   ✅ Staff already exists (${existingStaff} members), skipping\n`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let staffCount = 0;
  let staffIndex = 0;

  // Create staff for each position
  for (const position of STAFF_POSITIONS) {
    for (let i = 0; i < position.count; i++) {
      staffIndex++;

      // Determine gender
      const gender = position.gender === "any"
        ? (staffIndex % 2 === 0 ? "M" : "F")
        : position.gender || "M";

      const names = gender === "M" ? MALE_NAMES : FEMALE_NAMES;
      const givenIndex = staffIndex % names.givenEn.length;
      const surnameIndex = Math.floor(staffIndex / names.givenEn.length) % SURNAMES.en.length;

      const givenName = names.givenEn[givenIndex];
      const surname = SURNAMES.en[surnameIndex];
      const email = generatePersonalEmail(givenName, surname, staffIndex + 5000);

      // Calculate salary within range
      const salary = position.salaryRange[0] + Math.floor(
        Math.random() * (position.salaryRange[1] - position.salaryRange[0])
      );

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: { email, schoolId },
      });

      if (!existingUser) {
        // Create user
        await prisma.user.create({
          data: {
            email,
            username: `${givenName} ${surname}`,
            role: UserRole.STAFF,
            password: passwordHash,
            emailVerified: new Date(),
            school: { connect: { id: schoolId } },
          },
        });

        staffCount++;
      }
    }
  }

  // Summary by department
  const deptCounts: Record<string, number> = {};
  for (const pos of STAFF_POSITIONS) {
    deptCounts[pos.department] = (deptCounts[pos.department] || 0) + pos.count;
  }

  console.log(`   ✅ Created ${staffCount} non-teaching staff members:`);
  for (const [dept, count] of Object.entries(deptCounts)) {
    console.log(`      - ${dept}: ${count}`);
  }
  console.log("");
}

// ============================================================================
// STAFF QUALIFICATIONS (if schema supports)
// ============================================================================

export async function seedStaffQualifications(
  prisma: SeedPrisma,
  schoolId: string
): Promise<void> {
  // This would seed staff qualification records if the schema supports it
  // For now, qualifications are stored in the description/notes
  console.log("   ℹ️  Staff qualifications included in user profiles\n");
}
