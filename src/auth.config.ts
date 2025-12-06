import { getUserByEmail } from "@/components/auth/user";
import { LoginSchema } from "@/components/auth/validation";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import { env } from "@/env.mjs";

// Debug logging for environment variables
console.log('Auth config - Environment check:', {
  GOOGLE_CLIENT_ID: !!env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: !!env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: !!env.FACEBOOK_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV
});

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
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          username: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
        };
      },
    }),
    // Facebook provider - SIMPLEST possible configuration
    // If this doesn't work, the issue is external (Facebook app settings or user account)
    Facebook({
      clientId: env.FACEBOOK_CLIENT_ID || "",
      clientSecret: env.FACEBOOK_CLIENT_SECRET || "",
    }),
    Credentials({
      async authorize(credentials) {
        console.log('[CREDENTIALS-AUTH] 🔐 Starting credentials authorization');
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          console.log('[CREDENTIALS-AUTH] ✅ Validation successful, email:', email);

          const user = await getUserByEmail(email);
          console.log('[CREDENTIALS-AUTH] 👤 User lookup result:', {
            found: !!user,
            hasPassword: !!user?.password,
            userId: user?.id,
            userSchoolId: user?.schoolId,
            userRole: user?.role
          });

          if (!user || !user.password) {
            console.log('[CREDENTIALS-AUTH] ❌ User not found or no password');
            return null;
          }

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          console.log('[CREDENTIALS-AUTH] 🔑 Password match:', passwordsMatch);

          if (passwordsMatch) {
            console.log('[CREDENTIALS-AUTH] ✅ Authorization successful, returning user');
            return user;
          }
        } else {
          console.log('[CREDENTIALS-AUTH] ❌ Validation failed');
        }

        console.log('[CREDENTIALS-AUTH] ❌ Authorization failed');
        return null;
      }
    })
  ],
} satisfies NextAuthConfig;

// Debug logging for loaded providers
console.log('Auth config - Providers loaded:', {
  google: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
  facebook: !!env.FACEBOOK_CLIENT_ID && !!env.FACEBOOK_CLIENT_SECRET,
  credentials: true
});