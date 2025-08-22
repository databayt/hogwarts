import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import authConfig from "./auth.config"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour
    generateSessionToken: () => {
      const token = `session_${Date.now()}`;
      console.log('🔑 Generated session token:', token);
      return token;
    },
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
        domain: undefined, // Allow cookies to be shared across subdomains
      },
    },
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        domain: undefined, // Allow cookies to be shared across subdomains
      },
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
        domain: undefined, // Allow cookies to be shared across subdomains
      },
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        domain: undefined, // Allow cookies to be shared across subdomains
      },
    },
    // Add explicit configuration for all NextAuth cookies
    state: {
      name: `authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        domain: undefined, // Allow cookies to be shared across subdomains
      },
    },
    nonce: {
      name: `authjs.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
        domain: undefined, // Allow cookies to be shared across subdomains
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
        
        // Force session update after OAuth
        if (trigger === 'signIn') {
          console.log('🔄 Forcing session update after signIn');
          token.iat = Math.floor(Date.now() / 1000);
          token.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
          // Force session refresh by updating token
          token.sessionToken = `session_${Date.now()}`;
          // Force session update by changing a critical field
          token.updatedAt = Date.now();
          // Force session refresh by updating the token hash
          token.hash = `hash_${Date.now()}`;
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
        sub: token?.sub,
        sessionToken: token?.sessionToken
      });
      
      return token
    },
    async session({ session, token, user, trigger }) {
      console.log('📋 SESSION CALLBACK START:', { 
        trigger,
        hasToken: !!token, 
        hasUser: !!user,
        sessionUser: session.user?.id,
        timestamp: new Date().toISOString(),
        host: typeof window !== 'undefined' ? window.location.host : 'server'
      });
      
      if (token) {
        // Always ensure we have the latest token data
        session.user.id = token.id as string
        
        // Apply role and schoolId from token
        if (token.role) {
          (session.user as any).role = token.role
          console.log('🎭 Role applied to session:', token.role);
        }
        if (token.schoolId) {
          (session.user as any).schoolId = token.schoolId
          console.log('🏫 SchoolId applied to session:', token.schoolId);
        }
        
        // Force session update if token has been updated
        if (token.updatedAt) {
          console.log('🔄 Token updated, forcing session refresh');
          (session as any).updatedAt = token.updatedAt;
        }
        
        // Force session refresh if token hash changed
        if (token.hash) {
          console.log('🔄 Token hash changed, forcing session refresh');
          (session as any).hash = token.hash;
        }
        
        console.log('🔑 Token data applied to session:', {
          id: token.id,
          role: token.role,
          schoolId: token.schoolId
        });
      } else {
        console.log('⚠️ No token available in session callback');
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
        email: session.user?.email,
        timestamp: new Date().toISOString()
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
    options: { sameSite: 'lax', secure: false, httpOnly: true, maxAge: 900, domain: undefined }
  },
  sessionToken: {
    name: 'authjs.session-token',
    options: { sameSite: 'lax', secure: false, httpOnly: true, domain: undefined }
  },
  callbackUrl: {
    name: 'authjs.callback-url',
    options: { sameSite: 'lax', secure: false, domain: undefined }
  },
  csrfToken: {
    name: 'authjs.csrf-token',
    options: { sameSite: 'lax', secure: false, httpOnly: true, domain: undefined }
  }
});