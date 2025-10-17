import { z } from 'zod';

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().optional(),
  recipientEmail: z.string().email('Invalid email address').optional(),
  amount: z
    .number()
    .min(0.01, 'Amount must be at least $0.01')
    .max(100000, 'Amount cannot exceed $100,000'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description is too long'),
}).refine(
  (data) => data.toAccountId || data.recipientEmail,
  {
    message: 'Either destination account or recipient email is required',
    path: ['toAccountId'],
  }
);

export type TransferFormData = z.infer<typeof transferSchema>;