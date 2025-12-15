import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Facebook from "next-auth/providers/facebook"
import Google from "next-auth/providers/google"

import { env } from "@/env.mjs"
import { getUserByEmail } from "@/components/auth/user"
import { LoginSchema } from "@/components/auth/validation"

// Debug logging for environment variables
console.log("Auth config - Environment check:", {
  GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: !!env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: !!env.FACEBOOK_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
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
        return {
          id: profile.sub,
          username: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
        }
      },
    }),
    // Facebook provider - Let NextAuth handle redirect_uri automatically
    // Specify userinfo to request email and profile picture fields
    Facebook({
      clientId: env.FACEBOOK_CLIENT_ID || "",
      clientSecret: env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "email public_profile",
        },
      },
      // Specify userinfo endpoint with required fields
      userinfo: {
        url: "https://graph.facebook.com/me",
        params: {
          fields: "id,name,email,picture.width(250).height(250)",
        },
      },
      profile(profile) {
        console.log(
          "[Facebook OAuth] Raw profile:",
          JSON.stringify(profile, null, 2)
        )
        return {
          id: profile.id,
          name: profile.name || "Facebook User",
          username: profile.name || "Facebook User",
          email: profile.email || `${profile.id}@facebook.com`,
          image: profile.picture?.data?.url || null,
          emailVerified: new Date(),
        }
      },
    }),
    Credentials({
      async authorize(credentials) {
        console.log("[CREDENTIALS-AUTH] 🔐 Starting credentials authorization")
        const validatedFields = LoginSchema.safeParse(credentials)

        if (validatedFields.success) {
          const { email, password } = validatedFields.data
          console.log(
            "[CREDENTIALS-AUTH] ✅ Validation successful, email:",
            email
          )

          const user = await getUserByEmail(email)
          console.log("[CREDENTIALS-AUTH] 👤 User lookup result:", {
            found: !!user,
            hasPassword: !!user?.password,
            userId: user?.id,
            userSchoolId: user?.schoolId,
            userRole: user?.role,
          })

          if (!user || !user.password) {
            console.log("[CREDENTIALS-AUTH] ❌ User not found or no password")
            return null
          }

          const passwordsMatch = await bcrypt.compare(password, user.password)

          console.log("[CREDENTIALS-AUTH] 🔑 Password match:", passwordsMatch)

          if (passwordsMatch) {
            console.log(
              "[CREDENTIALS-AUTH] ✅ Authorization successful, returning user"
            )
            return user
          }
        } else {
          console.log("[CREDENTIALS-AUTH] ❌ Validation failed")
        }

        console.log("[CREDENTIALS-AUTH] ❌ Authorization failed")
        return null
      },
    }),
  ],
} satisfies NextAuthConfig

// Debug logging for loaded providers
console.log("Auth config - Providers loaded:", {
  google: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
  facebook: !!env.FACEBOOK_CLIENT_ID && !!env.FACEBOOK_CLIENT_SECRET,
  credentials: true,
})
