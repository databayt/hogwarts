// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Server-only: the demo roster's addresses and shared password must never be
// bundled into client JS, even though they're publicly documented.
import "server-only"

/** The showcase tenant. Same school on every root (demo.balqalam.com,
 *  demo.databayt.org, demo.localhost:3000) — a school's identity is its bare
 *  subdomain, see src/lib/root-domain.ts. */
export const DEMO_SUBDOMAIN = "demo"

/** Display order of the role picker. School-scoped roles only — dev@ / user@ /
 *  applicant@ have no schoolId and don't belong on a tenant login. */
export const DEMO_ROLE_KEYS = [
  "admin",
  "teacher",
  "student",
  "guardian",
  "accountant",
  "staff",
] as const

export type DemoRoleKey = (typeof DEMO_ROLE_KEYS)[number]

/**
 * Mirrors ADMIN_USERS in prisma/seeds/constants.ts and the roster documented in
 * prisma/seeds/auth.ts. Duplicated rather than imported: prisma/seeds/ lives
 * outside src/ and pulls in seed-only dependencies.
 */
export const DEMO_ACCOUNTS: Record<DemoRoleKey, string> = {
  admin: "admin@balqalam.com",
  teacher: "teacher@balqalam.com",
  student: "student@balqalam.com",
  guardian: "parent@balqalam.com", // GUARDIAN role, "parent@" address
  accountant: "accountant@balqalam.com",
  staff: "staff@balqalam.com",
}

/** = DEMO_PASSWORD in prisma/seeds/constants.ts */
export const DEMO_ACCOUNT_PASSWORD = "1234"
