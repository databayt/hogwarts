import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import authConfig from "./auth.config"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('🎉 SIGN IN EVENT:', {
        userId: user.id,
        email: user.email,
        provider: account?.provider,
        isNewUser,
        timestamp: new Date().toISOString()
      });
    },
    async signOut({ session, token }) {
      console.log('🚪 SIGN OUT EVENT:', {
        sessionId: session?.user?.id,
        tokenId: token?.id,
        timestamp: new Date().toISOString()
      });
    },
    async session({ session, token }) {
      console.log('📋 SESSION EVENT:', {
        sessionId: session?.user?.id,
        tokenId: token?.id,
        timestamp: new Date().toISOString()
      });
    },
  },
  cookies: {
    pkceCodeVerifier: {
      name: `authjs.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        maxAge: 900, // 15 minutes
      },
    },
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      console.log('🔐 JWT CALLBACK START:', { trigger, hasUser: !!user, hasAccount: !!account });
      
      if (user) {
        console.log('👤 User data received:', { 
          id: user.id, 
          email: user.email,
          hasRole: 'role' in user,
          hasSchoolId: 'schoolId' in user
        });
        
        token.id = user.id
        // Only set role and schoolId if they exist on the user object
        if ('role' in user) {
          token.role = (user as any).role
          console.log('🎭 Role set in token:', token.role);
        }
        if ('schoolId' in user) {
          token.schoolId = (user as any).schoolId
          console.log('🏫 SchoolId set in token:', token.schoolId);
        }
        
        // Ensure we have a proper session token
        if (account) {
          token.provider = account.provider
          token.providerAccountId = account.providerAccountId
          console.log('🔗 Account linked:', { provider: account.provider, id: account.providerAccountId });
        }
      }
      
      // Debug JWT state
      console.log('🔐 JWT CALLBACK END:', {
        tokenId: token?.id,
        hasRole: !!token?.role,
        hasSchoolId: !!token?.schoolId,
        provider: token?.provider,
        iat: token?.iat,
        exp: token?.exp,
        sub: token?.sub
      });
      
      return token
    },
    async session({ session, token, user }) {
      console.log('📋 SESSION CALLBACK START:', { 
        hasToken: !!token, 
        hasUser: !!user,
        sessionUser: session.user?.id 
      });
      
      if (token) {
        session.user.id = token.id as string
        if (token.role) (session.user as any).role = token.role
        if (token.schoolId) (session.user as any).schoolId = token.schoolId
        
        console.log('🔑 Token data applied to session:', {
          id: token.id,
          role: token.role,
          schoolId: token.schoolId
        });
      }
      
      // Debug session state
      console.log('📋 SESSION CALLBACK END:', {
        sessionId: session.user?.id,
        hasRole: !!(session.user as any)?.role,
        hasSchoolId: !!(session.user as any)?.schoolId,
        tokenId: token?.id,
        sessionToken: token?.sessionToken,
        iat: token?.iat,
        exp: token?.exp,
        email: session.user?.email
      });
      
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 REDIRECT CALLBACK START:', { url, baseUrl });
      
      // Check if this is a subdomain callback
      if (url.includes('portsudan.localhost:3000')) {
        console.log('🎯 Subdomain callback detected, returning as-is');
        return url;
      }

      // Handle Facebook redirect with #_=_ hash
      if (url.includes('#_=_')) {
        console.log('📘 Facebook redirect detected, cleaning hash and redirecting to subdomain');
        // Clean the Facebook hash and redirect to the subdomain dashboard
        const cleanUrl = url.replace(/#.*$/, '');
        const subdomainUrl = 'http://portsudan.localhost:3000/dashboard';
        console.log('🎯 Redirecting to subdomain:', subdomainUrl);
        return subdomainUrl;
      }

      // Handle OAuth callback completion - redirect to subdomain
      if (url.includes('/api/auth/callback/')) {
        console.log('🔄 OAuth callback detected, redirecting to subdomain dashboard');
        const subdomainUrl = 'http://portsudan.localhost:3000/dashboard';
        console.log('🎯 Redirecting to subdomain after OAuth:', subdomainUrl);
        return subdomainUrl;
      }

      // Handle main domain redirects - check if user came from subdomain
      if (url === baseUrl || url === `${baseUrl}/`) {
        console.log('🏠 Main domain redirect detected, checking if user came from subdomain');
        // Redirect to subdomain dashboard since user likely came from there
        const subdomainUrl = 'http://portsudan.localhost:3000/dashboard';
        console.log('🎯 Redirecting to subdomain dashboard:', subdomainUrl);
        return subdomainUrl;
      }

      // Handle dashboard redirects on main domain - redirect to subdomain
      if (url === `${baseUrl}/dashboard`) {
        console.log('📊 Main domain dashboard redirect detected, redirecting to subdomain');
        const subdomainUrl = 'http://portsudan.localhost:3000/dashboard';
        console.log('🎯 Redirecting to subdomain dashboard:', subdomainUrl);
        return subdomainUrl;
      }

      // Log all redirect attempts for debugging
      console.log('🔄 Processing redirect:', { url, baseUrl });
      
      // Check if this is an error
      if (url.includes('/error')) {
        console.log('❌ Error page detected, investigating...');
      }

      // Default behavior
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}${url}`;
        console.log('🔄 Default behavior - relative path, returning:', finalUrl);
        return finalUrl;
      }
      else if (new URL(url).origin === baseUrl) {
        console.log('🔄 Default behavior - same origin, returning:', url);
        return url;
      }
      
      console.log('🔄 Default behavior - external URL, returning baseUrl:', baseUrl);
      return baseUrl
    },
  },
  ...authConfig,
})

// Debug logging for NextAuth initialization
console.log('NextAuth initialization - Environment check:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_SECRET: !!process.env.AUTH_SECRET,
  GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: !!process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: !!process.env.FACEBOOK_CLIENT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

// Debug cookie configuration
console.log('🍪 Cookie configuration:', {
  pkceCodeVerifier: {
    name: 'authjs.pkce.code_verifier',
    options: { sameSite: 'lax', secure: false, httpOnly: true }
  },
  sessionToken: {
    name: 'authjs.session-token',
    options: { sameSite: 'lax', secure: false, httpOnly: true }
  },
  callbackUrl: {
    name: 'authjs.callback-url',
    options: { sameSite: 'lax', secure: false }
  },
  csrfToken: {
    name: 'authjs.csrf-token',
    options: { sameSite: 'lax', secure: false, httpOnly: true }
  }
});