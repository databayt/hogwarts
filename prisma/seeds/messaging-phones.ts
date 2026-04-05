// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Messaging Phone Numbers Seed
 *
 * Creates StaffMember records for admin and accountant test accounts
 * and adds WhatsApp-reachable phone numbers. Required for WhatsApp
 * dual-delivery testing.
 *
 * Usage: pnpm db:seed:single messaging-phones
 */

import type { PrismaClient } from "@prisma/client"

import { HP_CHARACTERS } from "./constants"

const MESSAGING_ACCOUNTS = [
  {
    email: "admin@databayt.org",
    role: "ADMIN",
    nameAr: HP_CHARACTERS.admin.nameAr,
    nameEn: HP_CHARACTERS.admin.nameEn,
    personalEmail: HP_CHARACTERS.admin.personalEmail,
    position: "School Administrator",
    phone: "00966557721603",
    gender: HP_CHARACTERS.admin.gender === "M" ? "MALE" : "FEMALE",
  },
  {
    email: "accountant@databayt.org",
    role: "ACCOUNTANT",
    nameAr: HP_CHARACTERS.accountant.nameAr,
    nameEn: HP_CHARACTERS.accountant.nameEn,
    personalEmail: HP_CHARACTERS.accountant.personalEmail,
    position: "School Accountant",
    phone: "00966504559207",
    gender: HP_CHARACTERS.accountant.gender === "M" ? "MALE" : "FEMALE",
  },
] as const

export async function seedMessagingPhones(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  console.log("  Seeding messaging phone numbers...")

  for (const account of MESSAGING_ACCOUNTS) {
    // Find the user
    const user = await prisma.user.findFirst({
      where: { email: account.email, schoolId },
      select: { id: true, username: true },
    })

    if (!user) {
      console.log(`    SKIP: ${account.email} not found in school`)
      continue
    }

    // Split Arabic name into first/last
    const nameParts = account.nameAr.split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ")

    // Upsert StaffMember linked to this user
    const staffMember = await prisma.staffMember.upsert({
      where: {
        schoolId_emailAddress: {
          schoolId,
          emailAddress: account.personalEmail,
        },
      },
      update: {
        userId: user.id,
        firstName,
        lastName,
        position: account.position,
        gender: account.gender,
      },
      create: {
        schoolId,
        userId: user.id,
        firstName,
        lastName,
        emailAddress: account.personalEmail,
        position: account.position,
        gender: account.gender,
        employmentStatus: "ACTIVE",
        employmentType: "FULL_TIME",
        joiningDate: new Date("2025-01-01"),
      },
    })

    // Upsert primary phone number
    await prisma.staffPhoneNumber.upsert({
      where: {
        schoolId_staffMemberId_phoneNumber: {
          schoolId,
          staffMemberId: staffMember.id,
          phoneNumber: account.phone,
        },
      },
      update: {
        isPrimary: true,
        phoneType: "mobile",
      },
      create: {
        schoolId,
        staffMemberId: staffMember.id,
        phoneNumber: account.phone,
        phoneType: "mobile",
        isPrimary: true,
      },
    })

    console.log(
      `    OK: ${account.email} -> StaffMember + phone ${account.phone}`
    )
  }

  console.log("  Done: messaging phone numbers seeded")
}
