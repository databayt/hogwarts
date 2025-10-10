export const STEPS = {
  1: "Basic Information",
  2: "Scope & Publishing"
} as const;

export const STEP_FIELDS = {
  1: ['title', 'body'] as const,
  2: ['scope', 'classId', 'role', 'published'] as const
} as const;

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length;

export const SCOPE_OPTIONS = [
  { label: "School", value: "school" },
  { label: "Class", value: "class" },
  { label: "Role", value: "role" }
] as const;

export const ROLE_OPTIONS = [
  { label: "Admin", value: "ADMIN" },
  { label: "Teacher", value: "TEACHER" },
  { label: "Student", value: "STUDENT" },
  { label: "Guardian", value: "GUARDIAN" },
  { label: "Staff", value: "STAFF" },
  { label: "Accountant", value: "ACCOUNTANT" }
] as const;
