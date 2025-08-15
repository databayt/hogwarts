import { z } from 'zod';

export const joinSchema = z.object({
  joinMethod: z.enum(['invite-with-codes', 'manual-enrollment'], {
    required_error: "Please select a join method",
  }),
  autoApproval: z.boolean().default(false),
  requireParentApproval: z.boolean().default(true),
  allowSelfEnrollment: z.boolean().default(false),
});

export type JoinFormData = z.infer<typeof joinSchema>;
