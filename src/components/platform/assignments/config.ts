export const STEPS = {
  1: "Basic Information",
  2: "Details & Settings"
} as const;

export const STEP_FIELDS = {
  1: ['title', 'description', 'classId'] as const,
  2: ['type', 'totalPoints', 'weight', 'dueDate', 'instructions'] as const
} as const;

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length;

export const ASSIGNMENT_TYPES = [
  { label: "Homework", value: "HOMEWORK" },
  { label: "Quiz", value: "QUIZ" },
  { label: "Test", value: "TEST" },
  { label: "Midterm", value: "MIDTERM" },
  { label: "Final Exam", value: "FINAL_EXAM" },
  { label: "Project", value: "PROJECT" },
  { label: "Lab Report", value: "LAB_REPORT" },
  { label: "Essay", value: "ESSAY" },
  { label: "Presentation", value: "PRESENTATION" }
] as const;

export const ASSIGNMENT_STATUSES = [
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Graded", value: "GRADED" }
] as const;
