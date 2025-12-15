"use server"

import * as z from "zod"

import { sendPasswordResetEmail } from "@/components/auth/mail"
import { generatePasswordResetToken } from "@/components/auth/tokens"

import { getUserByEmail } from "../user"
import { ResetSchema } from "../validation"

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "Invalid emaiL!" }
  }

  const { email } = validatedFields.data

  const existingUser = await getUserByEmail(email)

  if (!existingUser) {
    return { error: "Email not found!" }
  }

  const passwordResetToken = await generatePasswordResetToken(email)
  await sendPasswordResetEmail(
    passwordResetToken.email,
    passwordResetToken.token
  )

  return { success: "Reset email sent!" }
}
