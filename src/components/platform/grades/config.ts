// Steps are now translated via dictionary.school.grades.studentAssignmentInfo and dictionary.school.grades.gradingInfo
// Kept here for reference but should use dictionary in components
export const STEPS = {
  1: "studentAssignmentInfo",
  2: "gradingInfo"
} as const;

export const STEP_FIELDS = {
  1: ['studentId', 'assignmentId', 'classId'] as const,
  2: ['score', 'maxScore', 'grade', 'feedback'] as const
} as const;

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length;

export const GRADE_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A", value: "A" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B", value: "B" },
  { label: "B-", value: "B-" },
  { label: "C+", value: "C+" },
  { label: "C", value: "C" },
  { label: "C-", value: "C-" },
  { label: "D+", value: "D+" },
  { label: "D", value: "D" },
  { label: "D-", value: "D-" },
  { label: "F", value: "F" }
] as const;
