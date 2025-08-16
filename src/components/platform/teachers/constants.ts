export const STEPS = {
  1: "Basic Information",
  2: "Contact Details"
} as const;

export const STEP_FIELDS = {
  1: ['givenName', 'surname', 'gender'] as const,
  2: ['emailAddress'] as const
} as const;

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length;

export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" }
] as const;
