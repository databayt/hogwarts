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

/**
 * Login Context - Distinguishes between SaaS and School marketing entry points
 *
 * CRITICAL BEHAVIOR:
 * - "saas": User logged in from SaaS marketing (ed.databayt.org)
 *   → Stay on SaaS marketing after login (unless callbackUrl specified)
 * - "school": User logged in from School marketing (demo.databayt.org)
 *   → Stay on school marketing after login (unless callbackUrl specified)
 *
 * The ONLY path to /onboarding is via explicit callbackUrl (from "Get Started" button)
 */
export type LoginContext = "saas" | "school"

export interface LoginOptions {
  /** Explicit redirect URL (e.g., from "Get Started" or "Platform" link) */
  callbackUrl?: string | null
  /** Login context - determines where to stay after login */
  context?: LoginContext
  /** School subdomain (when context is "school") */
  subdomain?: string | null
}

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrlOrOptions?: string | null | LoginOptions
) => {
  // Handle both legacy (string callbackUrl) and new (options object) signatures
  let callbackUrl: string | null | undefined
  let context: LoginContext = "saas"
  let subdomain: string | null | undefined

  if (
    typeof callbackUrlOrOptions === "object" &&
    callbackUrlOrOptions !== null
  ) {
    callbackUrl = callbackUrlOrOptions.callbackUrl
    context = callbackUrlOrOptions.context || "saas"
    subdomain = callbackUrlOrOptions.subdomain
  } else {
    callbackUrl = callbackUrlOrOptions
  }
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

  // ============================================================================
  // SMART REDIRECT LOGIC - User Flow Distinction
  // ============================================================================
  //
  // CRITICAL RULES:
  // 1. /onboarding is ONLY reachable via explicit callbackUrl (from "Get Started" button)
  // 2. Login button alone → STAY on current marketing page (SaaS or School)
  // 3. Platform link → attempts /dashboard with membership check
  // 4. DEVELOPER role → always has access to SaaS dashboard
  //
  // ============================================================================

  // Extract locale from callbackUrl or default to 'ar'
  const locale = callbackUrl?.match(/^\/(ar|en)\//)
    ? callbackUrl.match(/^\/(ar|en)\//)?.[1]
    : "ar"

  let finalRedirectUrl: string

  // CASE 1: Explicit callbackUrl provided (from "Get Started" or "Platform" link)
  if (callbackUrl && callbackUrl !== "/" && callbackUrl !== `/${locale}`) {
    // Check if requesting /onboarding
    if (callbackUrl.includes("/onboarding")) {
      // Only "Get Started" button leads here - allow it
      finalRedirectUrl = callbackUrl
      console.log(
        "[LOGIN-ACTION] 🚀 Get Started flow - redirecting to onboarding:",
        {
          callbackUrl,
          finalRedirectUrl,
        }
      )
    }
    // Check if requesting /dashboard on school subdomain
    else if (callbackUrl.includes("/dashboard") && subdomain) {
      // User clicked "Platform" on school marketing
      // Check if user is a member of THIS school
      if (existingUser.schoolId) {
        const school = await db.school.findUnique({
          where: { id: existingUser.schoolId },
          select: { domain: true },
        })

        if (school?.domain === subdomain) {
          // User is a member of this school - allow dashboard access
          finalRedirectUrl = callbackUrl
          console.log(
            "[LOGIN-ACTION] 🏫 School member accessing their dashboard:",
            {
              subdomain,
              userSchool: school.domain,
              finalRedirectUrl,
            }
          )
        } else {
          // User belongs to a DIFFERENT school - deny access
          finalRedirectUrl = `/${locale}/access-denied`
          console.log("[LOGIN-ACTION] ⛔ User belongs to different school:", {
            requestedSchool: subdomain,
            userSchool: school?.domain,
            finalRedirectUrl,
          })
        }
      } else if (existingUser.role === "DEVELOPER") {
        // DEVELOPER can access any school's dashboard
        finalRedirectUrl = callbackUrl
        console.log("[LOGIN-ACTION] 👑 DEVELOPER accessing school dashboard:", {
          subdomain,
          finalRedirectUrl,
        })
      } else {
        // User has no school - deny dashboard access
        finalRedirectUrl = `/${locale}/access-denied`
        console.log(
          "[LOGIN-ACTION] ⛔ User has no school - cannot access dashboard:",
          {
            requestedSchool: subdomain,
            finalRedirectUrl,
          }
        )
      }
    }
    // Check if requesting SaaS dashboard on main domain
    else if (callbackUrl.includes("/dashboard") && !subdomain) {
      if (existingUser.role === "DEVELOPER") {
        // DEVELOPER can access SaaS dashboard
        finalRedirectUrl = callbackUrl
        console.log("[LOGIN-ACTION] 👑 DEVELOPER accessing SaaS dashboard:", {
          finalRedirectUrl,
        })
      } else if (existingUser.schoolId) {
        // User has a school - redirect to THEIR school's dashboard
        const school = await db.school.findUnique({
          where: { id: existingUser.schoolId },
          select: { domain: true },
        })

        if (school?.domain) {
          const useHttps = process.env.NEXTAUTH_URL?.startsWith("https")
          const protocol = useHttps ? "https" : "http"
          const baseUrl =
            process.env.NODE_ENV === "production"
              ? `https://${school.domain}.databayt.org`
              : `${protocol}://${school.domain}.localhost:3000`
          finalRedirectUrl = `${baseUrl}/${locale}/dashboard`
          console.log(
            "[LOGIN-ACTION] 🏫 Redirecting to user's school dashboard:",
            {
              school: school.domain,
              finalRedirectUrl,
            }
          )
        } else {
          finalRedirectUrl = `/${locale}`
          console.log(
            "[LOGIN-ACTION] ⚠️ School domain not found, staying on homepage"
          )
        }
      } else {
        // No school, not DEVELOPER - deny SaaS dashboard access
        finalRedirectUrl = `/${locale}/access-denied`
        console.log(
          "[LOGIN-ACTION] ⛔ Non-DEVELOPER without school cannot access SaaS dashboard"
        )
      }
    }
    // Other callbackUrl - follow it
    else {
      finalRedirectUrl = callbackUrl
      console.log("[LOGIN-ACTION] 📍 Following explicit callbackUrl:", {
        callbackUrl,
      })
    }
  }
  // CASE 2: No callbackUrl - Login button clicked (stay on current page)
  else {
    // Determine where to "stay" based on context
    if (context === "school" && subdomain) {
      // Logged in from school marketing - stay there
      const useHttps = process.env.NEXTAUTH_URL?.startsWith("https")
      const protocol = useHttps ? "https" : "http"
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? `https://${subdomain}.databayt.org`
          : `${protocol}://${subdomain}.localhost:3000`
      finalRedirectUrl = `${baseUrl}/${locale}`
      console.log("[LOGIN-ACTION] 🏠 Staying on school marketing:", {
        subdomain,
        finalRedirectUrl,
      })
    } else {
      // Logged in from SaaS marketing
      if (existingUser.role === "DEVELOPER") {
        // DEVELOPER → auto-redirect to SaaS dashboard
        finalRedirectUrl = `/${locale}/dashboard`
        console.log(
          "[LOGIN-ACTION] 👑 DEVELOPER auto-redirect to SaaS dashboard:",
          {
            finalRedirectUrl,
          }
        )
      } else {
        // Non-DEVELOPER → stay on SaaS marketing
        finalRedirectUrl = `/${locale}`
        console.log("[LOGIN-ACTION] 🏠 Staying on SaaS marketing:", {
          finalRedirectUrl,
        })
      }
    }
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
