// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Staff Members Seed
 * Creates 25-30 non-teaching staff with MENA positions
 *
 * Phase 5: People (Non-teaching staff)
 */

import type { PrismaClient } from "@prisma/client"

import {
  getEnglishGivenName,
  getEnglishSurname,
  HP_CHARACTERS,
} from "./constants"
import type { DepartmentRef, UserRef } from "./types"
import {
  generatePersonalEmail,
  generatePhone,
  logSuccess,
  randomElement,
  randomNumber,
} from "./utils"

// ============================================================================
// STAFF DATA
// ============================================================================

interface StaffData {
  firstName: string
  lastName: string
  gender: "M" | "F"
  position: string
  category: string
  emailPrefix: string
}

const STAFF_DATA: StaffData[] = [
  // Admin (8)
  {
    firstName: "عبدالله",
    lastName: "حسن",
    gender: "M",
    position: "نائب المدير",
    category: "admin",
    emailPrefix: "vp",
  },
  {
    firstName: "سارة",
    lastName: "أحمد",
    gender: "F",
    position: "سكرتير المدرسة",
    category: "admin",
    emailPrefix: "secretary",
  },
  {
    firstName: "محمد",
    lastName: "عثمان",
    gender: "M",
    position: "مسؤول شؤون الطلاب",
    category: "admin",
    emailPrefix: "student.affairs",
  },
  {
    firstName: "فاطمة",
    lastName: "إبراهيم",
    gender: "F",
    position: "مسؤولة القبول والتسجيل",
    category: "admin",
    emailPrefix: "admissions",
  },
  {
    firstName: "أحمد",
    lastName: "عبدالرحمن",
    gender: "M",
    position: "مسؤول الأنشطة",
    category: "admin",
    emailPrefix: "activities",
  },
  {
    firstName: "هدى",
    lastName: "يوسف",
    gender: "F",
    position: "مسؤولة العلاقات العامة",
    category: "admin",
    emailPrefix: "pr",
  },
  {
    firstName: "خالد",
    lastName: "الحسن",
    gender: "M",
    position: "مسؤول الموارد البشرية",
    category: "admin",
    emailPrefix: "hr",
  },
  {
    firstName: "مريم",
    lastName: "النور",
    gender: "F",
    position: "مسؤولة الجودة",
    category: "admin",
    emailPrefix: "quality",
  },

  // Finance (4)
  {
    firstName: "إبراهيم",
    lastName: "عبدالله",
    gender: "M",
    position: "محاسب أول",
    category: "finance",
    emailPrefix: "accountant1",
  },
  {
    firstName: "أمينة",
    lastName: "آدم",
    gender: "F",
    position: "محاسبة",
    category: "finance",
    emailPrefix: "accountant2",
  },
  {
    firstName: "عثمان",
    lastName: "موسى",
    gender: "M",
    position: "أمين الصندوق",
    category: "finance",
    emailPrefix: "cashier",
  },
  {
    firstName: "زينب",
    lastName: "عيسى",
    gender: "F",
    position: "مسؤولة الرواتب",
    category: "finance",
    emailPrefix: "payroll",
  },

  // IT (3)
  {
    firstName: "علي",
    lastName: "خليل",
    gender: "M",
    position: "مدير تقنية المعلومات",
    category: "it",
    emailPrefix: "it.manager",
  },
  {
    firstName: "حسن",
    lastName: "صالح",
    gender: "M",
    position: "فني حاسوب",
    category: "it",
    emailPrefix: "it.tech",
  },
  {
    firstName: "نور",
    lastName: "عبدالقادر",
    gender: "F",
    position: "مسؤولة الشبكات",
    category: "it",
    emailPrefix: "network",
  },

  // Facilities (6)
  {
    firstName: "عمر",
    lastName: "الطيب",
    gender: "M",
    position: "مدير المباني والصيانة",
    category: "facilities",
    emailPrefix: "facilities",
  },
  {
    firstName: "يوسف",
    lastName: "بشير",
    gender: "M",
    position: "فني صيانة",
    category: "facilities",
    emailPrefix: "maintenance1",
  },
  {
    firstName: "بكري",
    lastName: "جعفر",
    gender: "M",
    position: "فني صيانة",
    category: "facilities",
    emailPrefix: "maintenance2",
  },
  {
    firstName: "طارق",
    lastName: "المهدي",
    gender: "M",
    position: "حارس أمن",
    category: "facilities",
    emailPrefix: "security1",
  },
  {
    firstName: "مصطفى",
    lastName: "الزين",
    gender: "M",
    position: "حارس أمن",
    category: "facilities",
    emailPrefix: "security2",
  },
  {
    firstName: "ياسر",
    lastName: "عمر",
    gender: "M",
    position: "سائق الحافلة المدرسية",
    category: "facilities",
    emailPrefix: "driver",
  },

  // Support (5)
  {
    firstName: "رقية",
    lastName: "سليمان",
    gender: "F",
    position: "أمينة المكتبة",
    category: "support",
    emailPrefix: "librarian",
  },
  {
    firstName: "سمية",
    lastName: "البشير",
    gender: "F",
    position: "ممرضة المدرسة",
    category: "support",
    emailPrefix: "nurse",
  },
  {
    firstName: "حليمة",
    lastName: "الأمين",
    gender: "F",
    position: "المرشدة الاجتماعية",
    category: "support",
    emailPrefix: "counselor",
  },
  {
    firstName: "عبدالرحمن",
    lastName: "حامد",
    gender: "M",
    position: "مسؤول المقصف",
    category: "support",
    emailPrefix: "cafeteria",
  },
  {
    firstName: "صلاح",
    lastName: "كمال",
    gender: "M",
    position: "مسؤول النقل المدرسي",
    category: "support",
    emailPrefix: "transport",
  },
]

// ============================================================================
// STAFF MEMBERS SEEDING
// ============================================================================

export async function seedStaffMembers(
  prisma: PrismaClient,
  schoolId: string,
  departments: DepartmentRef[],
  adminUsers: UserRef[]
): Promise<number> {
  let count = 0

  // Link staff user to first matching staff member
  const staffUser = adminUsers.find((u) => u.role === "STAFF")

  for (let i = 0; i < STAFF_DATA.length; i++) {
    const staff = STAFF_DATA[i]
    const employeeId = `STAFF${String(i + 1).padStart(3, "0")}`

    // Link first staff member to staff user account
    const userId = i === 0 && staffUser ? staffUser.id : null

    // Index 0 = Hagrid
    const isHagrid = i === 0
    const firstName = isHagrid
      ? HP_CHARACTERS.staff.nameAr.split(" ")[0]
      : staff.firstName
    const lastName = isHagrid
      ? HP_CHARACTERS.staff.nameAr.split(" ").slice(1).join(" ")
      : staff.lastName
    const position = isHagrid ? HP_CHARACTERS.staff.position : staff.position

    // Personal email (firstname-lastname@domain.com)
    const personalEmail = isHagrid
      ? HP_CHARACTERS.staff.personalEmail
      : generatePersonalEmail(
          getEnglishGivenName(staff.firstName, staff.gender),
          getEnglishSurname(staff.lastName),
          i
        )

    try {
      // Find by employeeId first (handles email migration)
      const existing = await prisma.staffMember.findFirst({
        where: { schoolId, employeeId },
      })

      if (!existing) {
        await prisma.staffMember.create({
          data: {
            schoolId,
            employeeId,
            firstName,
            lastName,
            gender: staff.gender === "M" ? "Male" : "Female",
            emailAddress: personalEmail,
            position,
            phoneNumber: generatePhone(i + 200),
            employmentStatus: "ACTIVE",
            employmentType: "FULL_TIME",
            joiningDate: new Date("2024-09-01"),
            city: "الخرطوم",
            state: "الخرطوم",
            country: "SD",
            userId,
          },
        })
        count++
      } else {
        // Update existing staff with personal email + HP data
        await prisma.staffMember.update({
          where: { id: existing.id },
          data: {
            firstName,
            lastName,
            position,
            emailAddress: personalEmail,
            userId,
          },
        })
      }
    } catch {
      // Skip duplicates
    }
  }

  logSuccess("Staff Members", count, "non-teaching staff")

  // Seed related records for created staff
  const staffMembers = await prisma.staffMember.findMany({
    where: { schoolId },
    select: { id: true, position: true },
  })

  if (staffMembers.length > 0) {
    await seedStaffPhoneNumbers(prisma, schoolId, staffMembers)
    await seedStaffQualifications(prisma, schoolId, staffMembers)
    await seedStaffExperienceRecords(prisma, schoolId, staffMembers)
  }

  return count
}

// ============================================================================
// STAFF PHONE NUMBERS
// ============================================================================

async function seedStaffPhoneNumbers(
  prisma: PrismaClient,
  schoolId: string,
  staffMembers: Array<{ id: string }>
): Promise<void> {
  let count = 0

  for (let i = 0; i < staffMembers.length; i++) {
    const staff = staffMembers[i]
    try {
      await prisma.staffPhoneNumber.upsert({
        where: {
          schoolId_staffMemberId_phoneNumber: {
            schoolId,
            staffMemberId: staff.id,
            phoneNumber: generatePhone(i + 300),
          },
        },
        update: {},
        create: {
          schoolId,
          staffMemberId: staff.id,
          phoneNumber: generatePhone(i + 300),
          phoneType: "mobile",
          isPrimary: true,
        },
      })
      count++
    } catch {
      // Skip duplicates
    }
  }

  logSuccess("Staff Phone Numbers", count, "contact numbers")
}

// ============================================================================
// STAFF QUALIFICATIONS
// ============================================================================

const STAFF_QUALIFICATIONS = [
  {
    name: "بكالوريوس إدارة أعمال",
    type: "DEGREE",
    institution: "جامعة الخرطوم",
  },
  { name: "بكالوريوس محاسبة", type: "DEGREE", institution: "جامعة النيلين" },
  {
    name: "بكالوريوس علوم حاسوب",
    type: "DEGREE",
    institution: "جامعة السودان للعلوم والتكنولوجيا",
  },
  {
    name: "دبلوم سكرتارية",
    type: "DEGREE",
    institution: "معهد الإدارة العامة",
  },
  {
    name: "شهادة إسعافات أولية",
    type: "CERTIFICATION",
    institution: "الهلال الأحمر",
  },
  { name: "رخصة قيادة مهنية", type: "LICENSE", institution: "إدارة المرور" },
  {
    name: "شهادة أمن وسلامة",
    type: "CERTIFICATION",
    institution: "الدفاع المدني",
  },
  {
    name: "دبلوم مكتبات",
    type: "DEGREE",
    institution: "جامعة أم درمان الإسلامية",
  },
  { name: "شهادة تمريض", type: "CERTIFICATION", institution: "كلية التمريض" },
  {
    name: "شهادة إرشاد نفسي",
    type: "CERTIFICATION",
    institution: "جامعة الخرطوم",
  },
]

async function seedStaffQualifications(
  prisma: PrismaClient,
  schoolId: string,
  staffMembers: Array<{ id: string }>
): Promise<void> {
  let count = 0

  for (let i = 0; i < staffMembers.length; i++) {
    const staff = staffMembers[i]
    const qual = STAFF_QUALIFICATIONS[i % STAFF_QUALIFICATIONS.length]
    const yearsAgo = randomNumber(3, 15)
    const dateObtained = new Date()
    dateObtained.setFullYear(dateObtained.getFullYear() - yearsAgo)

    try {
      const existing = await prisma.staffQualification.findFirst({
        where: { schoolId, staffMemberId: staff.id, name: qual.name },
      })

      if (!existing) {
        await prisma.staffQualification.create({
          data: {
            schoolId,
            staffMemberId: staff.id,
            qualificationType: qual.type,
            name: qual.name,
            institution: qual.institution,
            dateObtained,
            expiryDate:
              qual.type === "LICENSE"
                ? new Date(dateObtained.getTime() + 5 * 365 * 86400000)
                : null,
          },
        })
        count++
      }
    } catch {
      // Skip
    }
  }

  logSuccess("Staff Qualifications", count, "degrees + certifications")
}

// ============================================================================
// STAFF EXPERIENCE
// ============================================================================

const STAFF_PREV_ORGS = [
  "مدرسة الشهيد الزبير",
  "مجموعة دال الصناعية",
  "بنك فيصل الإسلامي",
  "وزارة التربية والتعليم",
  "شركة سوداتل",
  "المنظمة العربية للتربية",
  "مستشفى الخرطوم التعليمي",
  "شركة MTN السودان",
]

async function seedStaffExperienceRecords(
  prisma: PrismaClient,
  schoolId: string,
  staffMembers: Array<{ id: string; position: string | null }>
): Promise<void> {
  let count = 0

  for (let i = 0; i < staffMembers.length; i++) {
    const staff = staffMembers[i]
    const org = STAFF_PREV_ORGS[i % STAFF_PREV_ORGS.length]
    const yearsAgo = randomNumber(3, 10)
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - yearsAgo)
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + randomNumber(1, 3))

    try {
      const existing = await prisma.staffExperience.findFirst({
        where: { schoolId, staffMemberId: staff.id, organization: org },
      })

      if (!existing) {
        await prisma.staffExperience.create({
          data: {
            schoolId,
            staffMemberId: staff.id,
            organization: org,
            position: staff.position || "موظف",
            startDate,
            endDate,
            isCurrent: false,
            description: `عمل في ${org} بمنصب ${staff.position || "موظف"}`,
          },
        })
        count++
      }
    } catch {
      // Skip
    }
  }

  logSuccess("Staff Experience", count, "previous positions")
}
