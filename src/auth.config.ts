import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Facebook from "next-auth/providers/facebook"
import Google from "next-auth/providers/google"

import { env } from "@/env.mjs"
import { authLogger } from "@/lib/auth-logger"
import { getUserByEmail } from "@/components/auth/user"
import { LoginSchema } from "@/components/auth/validation"

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER CONFIGURATION LOGGING (runs at startup)
// ═══════════════════════════════════════════════════════════════════════════
authLogger.config("check", {
  step: "Loading auth providers",
  environment: process.env.NODE_ENV,
  google: {
    configured: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
    hasClientId: !!env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!env.GOOGLE_CLIENT_SECRET,
  },
  facebook: {
    configured:
      !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET,
    hasClientId: !!process.env.FACEBOOK_CLIENT_ID,
    hasClientSecret: !!process.env.FACEBOOK_CLIENT_SECRET,
    appId: process.env.FACEBOOK_CLIENT_ID || "NOT_SET",
  },
  credentials: true,
})

export default {
  // Ensure we have at least one provider
  providers: [
    // Google provider - always include if credentials exist
    Google({
      clientId: env.GOOGLE_CLIENT_ID || "",
      clientSecret: env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile) {
        authLogger.oauth("google", "Profile callback received", {
          sub: profile.sub,
          email: profile.email,
          emailVerified: profile.email_verified,
          hasName: !!profile.name,
          hasPicture: !!profile.picture,
          locale: profile.locale,
        })

        // Validate required fields
        if (!profile.email) {
          authLogger.error("Google OAuth: No email in profile", {
            profileKeys: Object.keys(profile),
          })
        }

        return {
          id: profile.sub,
          username: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
        }
      },
    }),
    // Facebook provider - With profile callback for logging
    // IMPORTANT: In Live mode, Facebook requires exact redirect_uri match
    // IMPORTANT: Email permission must be approved in Facebook App Review
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      // Request email scope explicitly
      authorization: {
        params: {
          scope: "email,public_profile",
        },
      },
      profile(profile) {
        authLogger.oauth("facebook", "Profile callback received", {
          id: profile.id,
          email: profile.email,
          hasName: !!profile.name,
          hasPicture: !!profile.picture?.data?.url,
          profileKeys: Object.keys(profile),
        })

        // Check for missing email (common Facebook issue)
        if (!profile.email) {
          authLogger.error(
            "Facebook OAuth: No email returned - check app permissions",
            {
              hint: "User may have denied email permission or app lacks email scope approval",
              profileId: profile.id,
              profileKeys: Object.keys(profile),
            }
          )
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          image: profile.picture?.data?.url,
          emailVerified: new Date(),
        }
      },
    }),
    Credentials({
      async authorize(credentials) {
        authLogger.oauth("credentials", "Authorization started")
        const validatedFields = LoginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data
          authLogger.debug("Credentials: Validation passed", { email })

          const user = await getUserByEmail(email)
          authLogger.debug("Credentials: User lookup result", {
            found: !!user,
            hasPassword: !!user?.password,
            userId: user?.id,
            schoolId: user?.schoolId,
            role: user?.role,
          })

          if (!user || !user.password) {
            authLogger.warn("Credentials: User not found or no password", {
              email,
            })
            return null
          }

          const passwordsMatch = await bcrypt.compare(password, user.password)
          authLogger.debug("Credentials: Password check", {
            matches: passwordsMatch,
          })

          if (passwordsMatch) {
            authLogger.info("Credentials: Authorization successful", {
              userId: user.id,
              email: user.email,
              role: user.role,
              schoolId: user.schoolId,
            })
            return user
          } else {
            authLogger.warn("Credentials: Password mismatch", { email })
          }
        } else {
          authLogger.warn("Credentials: Validation failed", {
            errors: validatedFields.error?.issues,
          })
        }

        authLogger.warn("Credentials: Authorization failed")
        return null
      },
    }),
  ],
} satisfies NextAuthConfig

// Log provider summary
authLogger.info("Auth providers loaded", {
  google: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
  facebook:
    !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET,
  credentials: true,
})
