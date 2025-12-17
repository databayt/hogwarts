"use server"

import { signIn } from "@/auth"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { AuthError } from "next-auth"
import * as z from "zod"

import { db } from "@/lib/db"
import {
  sendTwoFactorTokenEmail,
  sendVerificationEmail,
} from "@/components/auth/mail"
import {
  generateTwoFactorToken,
  generateVerificationToken,
} from "@/components/auth/tokens"
import { getUserByEmail } from "@/components/auth/user"
import { LoginSchema } from "@/components/auth/validation"
import { getTwoFactorConfirmationByUserId } from "@/components/auth/verification/2f-confirmation"
import { getTwoFactorTokenByEmail } from "@/components/auth/verification/2f-token"

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  const validatedFields = LoginSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "Invalid fields!" }
  }

  const { email, password, code } = validatedFields.data

  const existingUser = await getUserByEmail(email)

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" }
  }

  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    )

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    )

    return { success: "Confirmation email sent!" }
  }

  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email)

      if (!twoFactorToken) {
        return { error: "Invalid code!" }
      }

      if (twoFactorToken.token !== code) {
        return { error: "Invalid code!" }
      }

      const hasExpired = new Date(twoFactorToken.expires) < new Date()

      if (hasExpired) {
        return { error: "Code expired!" }
      }

      await db.twoFactorToken.delete({
        where: { id: twoFactorToken.id },
      })

      const existingConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser.id
      )

      if (existingConfirmation) {
        await db.twoFactorConfirmation.delete({
          where: { id: existingConfirmation.id },
        })
      }

      await db.twoFactorConfirmation.create({
        data: {
          userId: existingUser.id,
        },
      })
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email)
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token)

      return { twoFactor: true }
    }
  }

  // Smart redirect based on user role:
  // - DEVELOPER: Redirect to /dashboard (platform admin)
  // - Other roles: Redirect to homepage (/)
  let finalRedirectUrl = callbackUrl || DEFAULT_LOGIN_REDIRECT

  // Extract locale from callbackUrl or default to 'ar'
  const locale = callbackUrl?.match(/^\/(ar|en)\//)
    ? callbackUrl.match(/^\/(ar|en)\//)?.[1]
    : "ar"

  if (existingUser.role === "DEVELOPER") {
    // DEVELOPER gets dashboard access
    finalRedirectUrl = `/${locale}/dashboard`
    console.log("[LOGIN-ACTION] 👑 DEVELOPER - redirecting to dashboard:", {
      role: existingUser.role,
      redirectUrl: finalRedirectUrl,
    })
  } else {
    // All other users go to homepage
    finalRedirectUrl = `/${locale}`
    console.log("[LOGIN-ACTION] 🏠 User - redirecting to homepage:", {
      role: existingUser.role,
      redirectUrl: finalRedirectUrl,
    })
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: finalRedirectUrl,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" }
        default:
          return { error: "Something went wrong!" }
      }
    }

    // Re-throw redirect errors (NEXT_REDIRECT) - this is expected behavior for successful login
    // Check if it's a redirect error by looking at the digest property
    if (error && typeof error === "object" && "digest" in error) {
      const digest = (error as { digest?: string }).digest
      if (digest?.startsWith("NEXT_REDIRECT")) {
        throw error
      }
    }

    // For any other error, log it but don't throw to prevent "Something went wrong" flash
    console.error("[LOGIN-ACTION] Unexpected error during signIn:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
