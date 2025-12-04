/**
 * Auth Seed Module - Bilingual (AR/EN)
 *
 * Creates authentication users for the Demo School:
 * - DEVELOPER: Platform admin (no school scope)
 * - ADMIN: School administrator
 * - ACCOUNTANT: School finance manager
 * - STAFF: General school staff
 *
 * All users have password: 1234
 * Usernames are stored in English (database) with Arabic display names in constants
 */

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { SeedPrisma, UserRef } from "./types";
import { DEMO_PASSWORD, ADMIN_USERS } from "./constants";

export async function seedAuth(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{
  devUser: UserRef;
  adminUser: UserRef;
  accountantUser: UserRef;
  staffUser: UserRef;
}> {
  console.log("👥 Creating Admin Users (Bilingual AR/EN)...");
  console.log(`   🔑 Password for all users: ${DEMO_PASSWORD}`);
  console.log("");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Find user data from constants
  const devData = ADMIN_USERS.find(u => u.role === "DEVELOPER")!;
  const adminData = ADMIN_USERS.find(u => u.role === "ADMIN")!;
  const accountantData = ADMIN_USERS.find(u => u.role === "ACCOUNTANT")!;
  const staffData = ADMIN_USERS.find(u => u.role === "STAFF")!;

  // Developer (platform-wide, not tied to school)
  const devUser = await prisma.user.create({
    data: {
      email: devData.email,
      username: devData.usernameEn, // English for database
      role: UserRole.DEVELOPER,
      password: passwordHash,
      emailVerified: new Date(),
      // No schoolId - platform admin has access to all schools
    },
  });

  // School Admin
  const adminUser = await prisma.user.create({
    data: {
      email: adminData.email,
      username: adminData.usernameEn,
      role: UserRole.ADMIN,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Accountant
  const accountantUser = await prisma.user.create({
    data: {
      email: accountantData.email,
      username: accountantData.usernameEn,
      role: UserRole.ACCOUNTANT,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Staff
  const staffUser = await prisma.user.create({
    data: {
      email: staffData.email,
      username: staffData.usernameEn,
      role: UserRole.STAFF,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Print bilingual information
  console.log("   ✅ Admin Users Created Successfully");
  console.log("");
  console.log("   📋 User Credentials (Bilingual):");
  console.log("   ┌────────────────────────────────────────────────────────────────────────┐");
  console.log("   │ Role          │ Email                    │ EN Name          │ AR Name   │");
  console.log("   ├────────────────────────────────────────────────────────────────────────┤");

  for (const user of ADMIN_USERS) {
    const roleStr = user.role.padEnd(13);
    const emailStr = user.email.padEnd(24);
    const enStr = user.usernameEn.padEnd(16);
    const arStr = user.usernameAr;
    console.log(`   │ ${roleStr}│ ${emailStr}│ ${enStr}│ ${arStr}`.padEnd(76) + "│");
  }

  console.log("   ├────────────────────────────────────────────────────────────────────────┤");
  console.log("   │ Password: 1234 for all accounts                                        │");
  console.log("   └────────────────────────────────────────────────────────────────────────┘");
  console.log("");

  console.log("   🔐 Role Descriptions (Bilingual):");
  console.log("   ┌────────────────────────────────────────────────────────────────────────┐");
  for (const user of ADMIN_USERS) {
    console.log(`   │ ${user.role.padEnd(13)}: ${user.descriptionEn.padEnd(53)}│`);
    console.log(`   │              : ${user.descriptionAr.padEnd(53)}│`);
    if (user !== ADMIN_USERS[ADMIN_USERS.length - 1]) {
      console.log("   ├────────────────────────────────────────────────────────────────────────┤");
    }
  }
  console.log("   └────────────────────────────────────────────────────────────────────────┘");
  console.log("");

  return {
    devUser: { id: devUser.id, email: devUser.email!, role: devUser.role },
    adminUser: { id: adminUser.id, email: adminUser.email!, role: adminUser.role },
    accountantUser: { id: accountantUser.id, email: accountantUser.email!, role: accountantUser.role },
    staffUser: { id: staffUser.id, email: staffUser.email!, role: staffUser.role },
  };
}
