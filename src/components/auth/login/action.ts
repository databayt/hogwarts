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

  // Smart subdomain redirect: Redirect users to their school's subdomain
  let finalRedirectUrl = callbackUrl || DEFAULT_LOGIN_REDIRECT

  if (existingUser.schoolId && existingUser.role !== "DEVELOPER") {
    console.log(
      "[LOGIN-ACTION] 🎯 Implementing smart subdomain redirect for user:",
      {
        userId: existingUser.id,
        email: existingUser.email,
        schoolId: existingUser.schoolId,
        role: existingUser.role,
      }
    )

    try {
      const school = await db.school.findUnique({
        where: { id: existingUser.schoolId },
        select: { domain: true },
      })

      console.log("[LOGIN-ACTION] 🏫 School lookup result:", {
        schoolId: existingUser.schoolId,
        domain: school?.domain,
      })

      if (school?.domain) {
        const isDev = process.env.NODE_ENV === "development"
        const subdomain = school.domain

        // Extract locale from callbackUrl or default to 'ar'
        const locale = callbackUrl?.match(/^\/(ar|en)\//)
          ? callbackUrl.match(/^\/(ar|en)\//)?.[1]
          : "ar"
        const path = `/${locale}/dashboard`

        finalRedirectUrl = isDev
          ? `http://${subdomain}.localhost:3000${path}`
          : `https://${subdomain}.databayt.org${path}`

        console.log("[LOGIN-ACTION] ✅ Smart redirect URL constructed:", {
          subdomain,
          locale,
          path,
          finalUrl: finalRedirectUrl,
        })
      }
    } catch (error) {
      console.error(
        "[LOGIN-ACTION] ❌ Error looking up school for redirect:",
        error
      )
      // Fall back to default redirect if school lookup fails
    }
  } else {
    console.log(
      "[LOGIN-ACTION] 👑 Platform admin or no schoolId - using default redirect:",
      {
        role: existingUser.role,
        schoolId: existingUser.schoolId,
        redirectUrl: finalRedirectUrl,
      }
    )
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
