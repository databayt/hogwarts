import { z } from "zod"

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    // A 4-digit PIN is allowed — school members sign in with one.
    newPassword: z.string().min(4, "Password must be at least 4 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/** First sign-in: no current password — the session already proved the PIN. */
export const firstPasswordSchema = z
  .object({
    newPassword: z.string().min(4),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
  })
