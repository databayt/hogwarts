// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Server-only: the demo roster's addresses and shared password must never be
// bundled into client JS, even though they're publicly documented.
import "server-only"

/** The showcase tenant. Same school on every root (demo.balqalam.com,
 *  demo.databayt.org, demo.localhost:3000) — a school's identity is its bare
 *  subdomain, see src/lib/root-domain.ts. */
export const DEMO_SUBDOMAIN = "demo"

/** Display order of the role picker: the six school-scoped roles first, then the
 *  two platform (schoolId = null) accounts the demo also exercises. `dev@` is
 *  deliberately absent — DEVELOPER belongs on the SaaS host, not a tenant. */
export const DEMO_ROLE_KEYS = [
  "admin",
  "teacher",
  "student",
  "guardian",
  "accountant",
  "staff",
  "user",
  "applicant",
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
  // Platform accounts (schoolId = null). getUserByEmail() falls through to the
  // platform branch when the demo school has no row for the address, so these
  // resolve fine from the tenant login.
  //
  // GOTCHA: `user@` is the onboarding-wizard test account. Completing onboarding
  // binds it to the school it just created, at which point it is neither a demo
  // user nor a platform user and this button reports "account not found" -- the
  // same thing typing the address into the form does, since both go through
  // getUserByEmail() with the demo schoolId. `pnpm db:reset-test-user` restores it.
  user: "user@balqalam.com",
  applicant: "applicant@balqalam.com",
}

/** = DEMO_PASSWORD in prisma/seeds/constants.ts */
export const DEMO_ACCOUNT_PASSWORD = "1234"
