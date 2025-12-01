/**
 * Auth Seed Module
 * Creates authentication users (admin, accountant, staff)
 */

import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { SeedPrisma, UserRef } from "./types";
import { DEMO_PASSWORD } from "./constants";

export async function seedAuth(
  prisma: SeedPrisma,
  schoolId: string
): Promise<{
  devUser: UserRef;
  adminUser: UserRef;
  accountantUser: UserRef;
  staffUser: UserRef;
}> {
  console.log("👥 Creating auth users (password: 1234)...");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Developer (platform-wide, not tied to school)
  const devUser = await prisma.user.create({
    data: {
      email: "dev@databayt.org",
      username: "Platform Developer",
      role: UserRole.DEVELOPER,
      password: passwordHash,
      emailVerified: new Date(),
    },
  });

  // School Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@databayt.org",
      username: "School Administrator",
      role: UserRole.ADMIN,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Accountant
  const accountantUser = await prisma.user.create({
    data: {
      email: "accountant@databayt.org",
      username: "School Accountant",
      role: UserRole.ACCOUNTANT,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  // Staff
  const staffUser = await prisma.user.create({
    data: {
      email: "staff@databayt.org",
      username: "Support Staff",
      role: UserRole.STAFF,
      password: passwordHash,
      emailVerified: new Date(),
      school: { connect: { id: schoolId } },
    },
  });

  console.log(`   ✅ Created: 4 auth users (Developer, Admin, Accountant, Staff)\n`);

  return {
    devUser: { id: devUser.id, email: devUser.email!, role: devUser.role },
    adminUser: { id: adminUser.id, email: adminUser.email!, role: adminUser.role },
    accountantUser: { id: accountantUser.id, email: accountantUser.email!, role: accountantUser.role },
    staffUser: { id: staffUser.id, email: staffUser.email!, role: staffUser.role },
  };
}
