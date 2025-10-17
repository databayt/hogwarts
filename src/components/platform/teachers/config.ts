export const STEPS = {
  1: "Basic Information",
  2: "Contact Details",
  3: "Employment Details",
  4: "Qualifications",
  5: "Experience",
  6: "Subject Expertise",
  7: "Review & Submit"
} as const;

export const STEP_FIELDS = {
  1: ['givenName', 'surname', 'gender', 'birthDate'] as const,
  2: ['emailAddress'] as const,
  3: ['employeeId', 'joiningDate', 'employmentStatus', 'employmentType', 'contractStartDate', 'contractEndDate'] as const,
  4: ['qualifications'] as const,
  5: ['experiences'] as const,
  6: ['subjectExpertise'] as const,
  7: [] as const // Review step has no fields
} as const;

export const TOTAL_FIELDS = [
  ...STEP_FIELDS[1],
  ...STEP_FIELDS[2],
  ...STEP_FIELDS[3]
].length;

export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" }
] as const;

export const EMPLOYMENT_STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "On Leave", value: "ON_LEAVE" },
  { label: "Terminated", value: "TERMINATED" },
  { label: "Retired", value: "RETIRED" }
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  { label: "Full-Time", value: "FULL_TIME" },
  { label: "Part-Time", value: "PART_TIME" },
  { label: "Contract", value: "CONTRACT" },
  { label: "Substitute", value: "SUBSTITUTE" }
] as const;

export const QUALIFICATION_TYPE_OPTIONS = [
  { label: "Degree", value: "DEGREE" },
  { label: "Certification", value: "CERTIFICATION" },
  { label: "License", value: "LICENSE" }
] as const;

export const EXPERTISE_LEVEL_OPTIONS = [
  { label: "Primary (Main Subject)", value: "PRIMARY" },
  { label: "Secondary (Can Teach)", value: "SECONDARY" },
  { label: "Certified", value: "CERTIFIED" }
] as const;

export const CLASS_TEACHER_ROLE_OPTIONS = [
  { label: "Primary Teacher", value: "PRIMARY" },
  { label: "Co-Teacher", value: "CO_TEACHER" },
  { label: "Assistant", value: "ASSISTANT" }
] as const;
