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
      checks: [], // Disable PKCE temporarily
    }),
    // Facebook provider - always include if credentials exist
    Facebook({
      clientId: env.FACEBOOK_CLIENT_ID || "",
      clientSecret: env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          // Pass additional parameters to Facebook
          scope: 'email',
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          username: profile.name || "Facebook User",
          email: profile.email || `${profile.id}@facebook.com`,
          image: profile.picture?.data?.url || null,
          emailVerified: new Date(),
        };
      },
      checks: [], // Disable PKCE temporarily
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (passwordsMatch) return user;
        }

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