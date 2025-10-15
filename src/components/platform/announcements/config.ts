export const STEP_FIELDS = {
  1: ['title', 'body'] as const,
  2: ['scope', 'classId', 'role', 'published'] as const
} as const;

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2]].length;
