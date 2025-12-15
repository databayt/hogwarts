import { JoinOption, UserRole } from "./types"

export const JOIN_OPTIONS: JoinOption[] = [
  {
    id: "invite-with-codes",
    title: "Invite with registration codes",
    subtitle: "Recommended",
    description:
      "Generate invitation codes that teachers, staff, students and parents can use to self-register. You can review and approve.",
    recommended: true,
  },
  {
    id: "manual-enrollment",
    title: "Manual enrollment",
    description:
      "Add all teachers, staff, and students yourself through the admin panel.",
    recommended: false,
  },
] as const

export const ROLE_CONFIGS: Record<
  UserRole,
  { name: string; description: string; defaultLimit: number }
> = {
  teacher: {
    name: "Teachers",
    description: "Teaching staff members",
    defaultLimit: 50,
  },
  staff: {
    name: "Staff",
    description: "Non-teaching staff members",
    defaultLimit: 20,
  },
  student: {
    name: "Students",
    description: "Enrolled students",
    defaultLimit: 500,
  },
  parent: {
    name: "Parents",
    description: "Student guardians",
    defaultLimit: 1000,
  },
  admin: {
    name: "Administrators",
    description: "School administrators",
    defaultLimit: 5,
  },
} as const

export const INVITE_CODE_CONFIG = {
  LENGTH: 8,
  EXPIRY_DAYS: 7,
  DEFAULT_MAX_USES: 100,
} as const

export const JOIN_MESSAGES = {
  SELECT_METHOD: "Please select a join method",
  INVALID_CODE: "Invalid invitation code",
  CODE_EXPIRED: "This invitation code has expired",
  CODE_EXHAUSTED: "This invitation code has reached its maximum uses",
  ROLE_LIMIT_REACHED:
    "You have reached the maximum number of users for this role",
  PARENT_APPROVAL_REQUIRED:
    "Parent approval is required for student registration",
  ADMIN_APPROVAL_REQUIRED: "Administrator approval is required for this role",
} as const
