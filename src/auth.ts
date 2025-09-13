import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "@/lib/db"
import authConfig from "./auth.config"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { cookies } from "next/headers"

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: process.env.NODE_ENV === 'production' ? 5 * 60 : 60 * 60, // 5 minutes in prod (for critical updates), 1 hour in dev
    generateSessionToken: () => {
      const token = `session_${Date.now()}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Generated session token:', token);
      }
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
        secure: process.env.NODE_ENV === "production",
        maxAge: 900, // 15 minutes
        domain: process.env.NODE_ENV === "production" ? '.databayt.org' : undefined,
      },
    },
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.databayt.org' : undefined,
        maxAge: 24 * 60 * 60, // 24 hours
      },
    },
    callbackUrl: {
      name: `authjs.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.databayt.org' : undefined,
      },
    },
    csrfToken: {
      name: `authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.databayt.org' : undefined,
      },
    },
    // Add explicit configuration for all NextAuth cookies
    state: {
      name: `authjs.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.databayt.org' : undefined,
      },
    },
    nonce: {
      name: `authjs.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? '.databayt.org' : undefined,
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 [DEBUG] JWT CALLBACK START:', { 
          trigger, 
          hasUser: !!user, 
          hasAccount: !!account,
          timestamp: new Date().toISOString()
        });
      }
      
      if (user) {
        console.log('👤 [DEBUG] User data received:', { 
          id: user.id, 
          email: user.email,
          hasRole: 'role' in user,
          hasSchoolId: 'schoolId' in user,
          userKeys: Object.keys(user),
          userRole: (user as any).role,
          userSchoolId: (user as any).schoolId
        });
        
        token.id = user.id
        // Only set role and schoolId if they exist on the user object
        if ('role' in user) {
          token.role = (user as any).role
          console.log('🎭 [DEBUG] Role set in token:', token.role);
        }
        if ('schoolId' in user) {
          token.schoolId = (user as any).schoolId
          console.log('🏫 [DEBUG] SchoolId set in token:', token.schoolId);
        }
        
        // Ensure we have a proper session token
        if (account) {
          token.provider = account.provider
          token.providerAccountId = account.providerAccountId
          console.log('🔗 [DEBUG] Account linked:', { provider: account.provider, id: account.providerAccountId });
        }
        
        // Force session update after OAuth
        if (trigger === 'signIn') {
          console.log('🔄 [DEBUG] Forcing session update after signIn');
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
      console.log('🔐 [DEBUG] JWT CALLBACK END:', {
        tokenId: token?.id,
        hasRole: !!token?.role,
        hasSchoolId: !!token?.schoolId,
        tokenRole: token?.role,
        tokenSchoolId: token?.schoolId,
        provider: token?.provider,
        iat: token?.iat,
        exp: token?.exp,
        sub: token?.sub,
        sessionToken: token?.sessionToken,
        updatedAt: token?.updatedAt,
        hash: token?.hash
      });
      
      return token
    },
    async session({ session, token, user, trigger }) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 [DEBUG] SESSION CALLBACK START:', { 
          trigger,
          hasToken: !!token, 
          hasUser: !!user,
          sessionUser: session.user?.id,
          timestamp: new Date().toISOString(),
          host: typeof window !== 'undefined' ? window.location.host : 'server'
        });
      }
      
      if (token) {
        console.log('🔑 [DEBUG] Token data available:', {
          tokenId: token.id,
          tokenRole: token.role,
          tokenSchoolId: token.schoolId,
          tokenUpdatedAt: token.updatedAt,
          tokenHash: token.hash
        });
        
        // Always ensure we have the latest token data
        session.user.id = token.id as string
        
        // Apply role and schoolId from token
        if (token.role) {
          (session.user as any).role = token.role
          console.log('🎭 [DEBUG] Role applied to session:', token.role);
        }
        if (token.schoolId) {
          (session.user as any).schoolId = token.schoolId
          console.log('🏫 [DEBUG] SchoolId applied to session:', token.schoolId);
        }
        
        // Force session update if token has been updated
        if (token.updatedAt) {
          console.log('🔄 [DEBUG] Token updated, forcing session refresh');
          (session as any).updatedAt = token.updatedAt;
        }
        
        // Force session refresh if token hash changed
        if (token.hash) {
          console.log('🔄 [DEBUG] Token hash changed, forcing session refresh');
          (session as any).hash = token.hash;
        }
        
        console.log('✅ [DEBUG] Token data applied to session:', {
          id: token.id,
          role: token.role,
          schoolId: token.schoolId
        });
      } else {
        console.log('⚠️ [DEBUG] No token available in session callback');
      }
      
      // Debug session state
      console.log('📋 [DEBUG] SESSION CALLBACK END:', {
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
      console.log('=====================================');
      console.log('🔄 REDIRECT CALLBACK START');
      console.log('=====================================');
      console.log('📍 Input Parameters:', {
        url,
        baseUrl,
        urlLength: url?.length,
        baseUrlLength: baseUrl?.length
      });
      
      // Try to get callback URL from the original request if possible
      // This is a workaround for NextAuth not properly passing callbackUrl through OAuth
      let intendedCallbackUrl: string | null = null;
      
      // Check if we're coming from an OAuth callback
      if (url.includes('/api/auth/callback/')) {
        console.log('🔐 OAuth callback detected - checking for stored callback URL');
        // The callback URL should have been stored before OAuth redirect
        // We'll check for it in multiple places below
      }
      
      // Check if this is an OAuth callback
      const isOAuthCallback = url.includes('/api/auth/callback/');
      if (isOAuthCallback) {
        const provider = url.match(/callback\/(\w+)/)?.[1];
        console.log('🔐 OAUTH CALLBACK DETECTED:', {
          provider,
          url,
          urlLength: url.length,
          hasHash: url.includes('#'),
          hashContent: url.includes('#') ? url.split('#')[1] : null,
          hasQuery: url.includes('?'),
          queryContent: url.includes('?') ? url.split('?')[1]?.split('#')[0] : null,
          timestamp: new Date().toISOString()
        });
        
        // Log request headers if available (for debugging)
        if (typeof process !== 'undefined' && process.env) {
          console.log('🌍 Environment:', {
            NODE_ENV: process.env.NODE_ENV,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL
          });
        }
      }
      
      // Handle Facebook redirect with #_=_ hash FIRST - clean it completely
      if (url.includes('#_=_')) {
        console.log('📘 Facebook redirect detected, cleaning hash');
        console.log('Original URL with hash:', url);
        
        // Clean the Facebook hash and redirect appropriately
        const cleanUrl = url.replace(/#.*$/, '');
        console.log('🎯 Cleaned Facebook URL:', cleanUrl);
        
        // Check if the cleaned URL has callback parameters
        try {
          const cleanUrlObj = new URL(cleanUrl, baseUrl);
          console.log('📘 Facebook cleaned URL analysis:', {
            pathname: cleanUrlObj.pathname,
            search: cleanUrlObj.search,
            searchParams: Array.from(cleanUrlObj.searchParams.entries()),
            hasCallbackUrl: cleanUrlObj.searchParams.has('callbackUrl')
          });
        } catch (e) {
          console.log('Error parsing cleaned URL:', e);
        }
        
        // Continue with the cleaned URL
        url = cleanUrl;
      }

      // PRIORITY: Check for callbackUrl parameter first (from login redirect)
      console.log('\n🎯 CHECKING FOR CALLBACK URL...');
      let callbackUrl: string | null = intendedCallbackUrl;
      
      // First check if this is coming back from OAuth and we had a stored callback
      const isReturningFromOAuth = url.includes('/api/auth/callback/');
      console.log('🔐 OAuth return check:', { isReturningFromOAuth, url });
      
      // Method 0: Check server-side cookies using Next.js cookies helper
      if (!callbackUrl) {
        try {
          console.log('🔍 Method 0 - Checking server-side cookies...');
          const cookieStore = await cookies();
          
          // List ALL server-side cookies for debugging
          const allCookies = cookieStore.getAll();
          console.log('🍪 ALL SERVER-SIDE COOKIES:', {
            count: allCookies.length,
            cookies: allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 50) + '...' }))
          });
          
          const oauthCallbackCookie = cookieStore.get('oauth_callback_intended');
          if (oauthCallbackCookie) {
            callbackUrl = oauthCallbackCookie.value;
            console.log('✅ Method 0 - Server-side cookie FOUND:', {
              callbackUrl,
              cookieName: 'oauth_callback_intended',
              fullValue: oauthCallbackCookie.value
            });
            // Clear the cookie after use
            cookieStore.delete('oauth_callback_intended');
            console.log('🗑️ Deleted oauth_callback_intended cookie');
          } else {
            console.log('❌ Method 0 - No oauth_callback_intended cookie found');
            // Check if any cookies start with oauth
            const oauthRelatedCookies = allCookies.filter(c => c.name.toLowerCase().includes('oauth') || c.name.toLowerCase().includes('callback'));
            console.log('🔍 OAuth-related cookies found:', oauthRelatedCookies.length > 0 ? oauthRelatedCookies : 'NONE');
          }
        } catch (error) {
          console.log('⚠️ Could not check server-side cookies:', error);
        }
      }
      
      try {
        // Method 1: Parse as URL and check searchParams
        const urlObj = new URL(url, baseUrl);
        console.log('📊 URL Object Analysis:', {
          href: urlObj.href,
          pathname: urlObj.pathname,
          search: urlObj.search,
          searchParams: Array.from(urlObj.searchParams.entries()),
          hash: urlObj.hash
        });
        // Only check URL params if we don't already have a callback URL from cookies
        if (!callbackUrl) {
          callbackUrl = urlObj.searchParams.get('callbackUrl') || urlObj.searchParams.get('redirect');
        }
        console.log('🔍 Method 1 - URL searchParams:', { 
          callbackUrl, 
          hasCallbackParam: urlObj.searchParams.has('callbackUrl'),
          hasRedirectParam: urlObj.searchParams.has('redirect'),
          allParams: Object.fromEntries(urlObj.searchParams.entries()),
          skipped: !!callbackUrl
        });
        
        // Method 2: Check if the URL itself contains a callback parameter
        if (!callbackUrl && url.includes('callbackUrl=')) {
          const match = url.match(/callbackUrl=([^&]+)/);
          if (match) {
            callbackUrl = decodeURIComponent(match[1]);
            console.log('🔍 Method 2 - URL regex match:', { callbackUrl, match: match[1] });
          }
        }
        
        // Method 3: Check baseUrl for callback parameter (during OAuth flow)
        if (!callbackUrl && baseUrl) {
          try {
            const baseUrlObj = new URL(baseUrl);
            const baseCallbackUrl = baseUrlObj.searchParams.get('callbackUrl');
            if (baseCallbackUrl) {
              callbackUrl = baseCallbackUrl;
              console.log('🔍 Method 3 - baseUrl searchParams:', { callbackUrl });
            }
          } catch (error) {
            console.log('❌ Error parsing baseUrl for callback:', error);
          }
        }
        
        // Method 4: Check cookies for stored callback URL
        if (!callbackUrl && typeof document !== 'undefined') {
          try {
            const cookies = document.cookie.split(';');
            
            // Check for NextAuth callback cookie
            const callbackCookie = cookies.find(cookie => cookie.trim().startsWith('authjs.callback-url='));
            if (callbackCookie) {
              callbackUrl = decodeURIComponent(callbackCookie.split('=')[1]);
              console.log('🔍 Method 4a - NextAuth cookie callback:', { callbackUrl });
            }
            
            // Check for our custom OAuth callback cookie
            if (!callbackUrl) {
              const oauthCookie = cookies.find(cookie => cookie.trim().startsWith('oauth_callback_intended='));
              if (oauthCookie) {
                callbackUrl = decodeURIComponent(oauthCookie.split('=')[1]);
                console.log('🔍 Method 4b - OAuth intended cookie callback:', { callbackUrl });
                // Clear the cookie after use
                document.cookie = 'oauth_callback_intended=; path=/; max-age=0';
              }
            }
          } catch (error) {
            console.log('❌ Error reading callback from cookies:', error);
          }
        }
        
        // Method 5: Check session storage for intended callback URL (OAuth flow)
        if (!callbackUrl && typeof window !== 'undefined' && window.sessionStorage) {
          try {
            const intendedCallback = window.sessionStorage.getItem('oauth_callback_intended');
            const allStorageKeys = Object.keys(window.sessionStorage);
            console.log('💾 Session Storage Check:', {
              intendedCallback,
              hasIntendedCallback: !!intendedCallback,
              allKeys: allStorageKeys,
              allValues: allStorageKeys.reduce((acc, key) => {
                acc[key] = window.sessionStorage.getItem(key);
                return acc;
              }, {} as Record<string, string | null>)
            });
            if (intendedCallback) {
              callbackUrl = intendedCallback;
              console.log('🔍 Method 5 - session storage intended callback:', { callbackUrl });
              // Clear it after use
              window.sessionStorage.removeItem('oauth_callback_intended');
            }
          } catch (error) {
            console.log('❌ Error reading intended callback from session storage:', error);
          }
        }
        
        console.log('\n📋 CALLBACK URL RESOLUTION SUMMARY:', {
          found: !!callbackUrl,
          value: callbackUrl,
          type: typeof callbackUrl
        });
        
        if (callbackUrl) {
          console.log('\n✅ CALLBACK URL FOUND!');
          console.log('🎯 Attempting redirect to:', callbackUrl);
          // Validate callback URL is from same origin for security
          try {
            const callbackUrlObj = new URL(callbackUrl, baseUrl);
            const baseUrlObj = new URL(baseUrl);
            
            // Check if it's a relative URL or same origin
            if (callbackUrl.startsWith('/') || 
                callbackUrlObj.origin === baseUrlObj.origin) {
              console.log('✅ CALLBACK URL VALIDATED - Redirecting:', callbackUrl);
              
              // If it's a relative URL, make it absolute with the current baseUrl
              if (callbackUrl.startsWith('/')) {
                const absoluteUrl = `${baseUrl}${callbackUrl}`;
                console.log('✅ RETURNING CALLBACK URL (relative->absolute):', {
                  original: callbackUrl,
                  absolute: absoluteUrl
                });
                console.log('=====================================');
                console.log('🔄 REDIRECT CALLBACK END');
                console.log('=====================================\n');
                return absoluteUrl;
              }
              console.log('✅ RETURNING CALLBACK URL (absolute):', callbackUrl);
              console.log('=====================================');
              console.log('🔄 REDIRECT CALLBACK END');
              console.log('=====================================\n');
              return callbackUrl;
            } else {
              console.log('⚠️ SECURITY: Callback URL origin mismatch, ignoring:', { 
                callbackOrigin: callbackUrlObj.origin, 
                baseOrigin: baseUrlObj.origin,
                callbackPath: callbackUrlObj.pathname
              });
            }
          } catch (error) {
            console.log('❌ Error validating callback URL:', error);
            // If it's a relative path, still try to use it
            if (callbackUrl.startsWith('/')) {
              const absoluteUrl = `${baseUrl}${callbackUrl}`;
              console.log('📍 Using relative callback URL (fallback):', {
                original: callbackUrl,
                absolute: absoluteUrl
              });
              console.log('=====================================');
              console.log('🔄 REDIRECT CALLBACK END');
              console.log('=====================================\n');
              return absoluteUrl;
            }
          }
        }
      } catch (error) {
        console.log('❌ Error parsing callback URL:', error);
      }
      
      // Debug: Log the exact URL and baseUrl we're working with
      console.log('🔍 RAW URL ANALYSIS:', {
        originalUrl: url,
        baseUrl: baseUrl,
        hasHash: url.includes('#'),
        hasQueryParams: url.includes('?'),
        isFullUrl: url.startsWith('http')
      });
      
      // Extract host information from the callback URL which preserves the original domain
      let originalHost = '';
      try {
        // If url is a full URL, extract the host from it
        if (url.startsWith('http')) {
          const urlObj = new URL(url);
          originalHost = urlObj.host;
        } else {
          // If url is relative, use baseUrl
          const baseUrlObj = new URL(baseUrl);
          originalHost = baseUrlObj.host;
        }
        
        console.log('🔍 Host detection:', { originalHost, url, baseUrl });
        
        // Enhanced subdomain detection for both production and development
        let detectedSubdomain = null;
        
        // Production subdomain detection - EXCLUDE ed.databayt.org as main domain
        if (originalHost.endsWith('.databayt.org') && originalHost !== 'ed.databayt.org') {
          detectedSubdomain = originalHost.split('.')[0];
          console.log('🎯 PRODUCTION SUBDOMAIN DETECTED:', { 
            host: originalHost, 
            subdomain: detectedSubdomain 
          });
        }
        // Development subdomain detection  
        else if (originalHost.includes('.localhost') && originalHost !== 'localhost:3000' && originalHost !== 'localhost') {
          detectedSubdomain = originalHost.split('.')[0];
          console.log('🎯 DEVELOPMENT SUBDOMAIN DETECTED:', { 
            host: originalHost, 
            subdomain: detectedSubdomain 
          });
        }
        
        // Debug: Log what we're NOT detecting as subdomain
        if (originalHost.endsWith('.databayt.org') && originalHost === 'ed.databayt.org') {
          console.log('🏢 MAIN DOMAIN IDENTIFIED (not subdomain):', { 
            host: originalHost,
            reason: 'explicitly excluded from subdomain detection'
          });
        }
        
        // Direct subdomain redirect if detected
        if (detectedSubdomain) {
          const tenantDashboardUrl = process.env.NODE_ENV === "production"
            ? `https://${detectedSubdomain}.databayt.org/dashboard`
            : `http://${detectedSubdomain}.localhost:3000/dashboard`;
          
          console.log('🚀 DIRECT SUBDOMAIN REDIRECT:', { 
            subdomain: detectedSubdomain,
            redirectUrl: tenantDashboardUrl,
            environment: process.env.NODE_ENV,
            source: 'host_detection'
          });
          
          return tenantDashboardUrl;
        }
        
        // If we're on the main domain (ed.databayt.org), check for callback URL first
        if (originalHost === 'ed.databayt.org') {
          // Don't immediately redirect to dashboard - check if we have a callback URL
          console.log('🏢 MAIN DOMAIN DETECTED:', { 
            host: originalHost,
            hasCallbackUrl: !!callbackUrl,
            callbackUrl,
            environment: process.env.NODE_ENV,
            source: 'main_domain_detection'
          });
          
          // If we have a callback URL, use it
          if (callbackUrl) {
            console.log('✅ Using callback URL on main domain:', callbackUrl);
            // Continue to validate and use the callback URL below
          } else {
            // Only default to dashboard if no callback URL
            const mainDomainDashboard = process.env.NODE_ENV === "production"
              ? 'https://ed.databayt.org/dashboard'
              : 'http://localhost:3000/dashboard';
            
            console.log('🏢 MAIN DOMAIN DEFAULT REDIRECT (no callback):', { 
              host: originalHost,
              redirectUrl: mainDomainDashboard
            });
            
            return mainDomainDashboard;
          }
        }
        
        // Additional safety check: if host contains 'ed.databayt.org' in any form, treat as main domain
        if (originalHost.includes('ed.databayt.org')) {
          console.log('🏢 MAIN DOMAIN SAFETY CHECK:', { 
            host: originalHost,
            hasCallbackUrl: !!callbackUrl,
            callbackUrl,
            environment: process.env.NODE_ENV,
            source: 'safety_check'
          });
          
          // If we have a callback URL, use it
          if (callbackUrl) {
            console.log('✅ Using callback URL on main domain (safety check):', callbackUrl);
            // Continue to validate and use the callback URL below
          } else {
            const mainDomainDashboard = process.env.NODE_ENV === "production"
              ? 'https://ed.databayt.org/dashboard'
              : 'http://localhost:3000/dashboard';
            
            console.log('🏢 MAIN DOMAIN SAFETY REDIRECT (no callback):', { 
              host: originalHost,
              redirectUrl: mainDomainDashboard
            });
            
            return mainDomainDashboard;
          }
        }
      } catch (error) {
        console.log('❌ Error parsing URLs:', error);
        // Fall back to baseUrl parsing
        const baseUrlObj = new URL(baseUrl);
        originalHost = baseUrlObj.host;
      }
      
      // If we still don't have a host, use baseUrl as fallback
      if (!originalHost) {
        try {
          const baseUrlObj = new URL(baseUrl);
          originalHost = baseUrlObj.host;
          console.log('🔄 Fallback host detection:', { originalHost, baseUrl });
        } catch (error) {
          console.log('❌ Error in fallback host detection:', error);
        }
      }
      
      // Final check: if we're on ed.databayt.org, check callback URL first
      if (originalHost === 'ed.databayt.org') {
        console.log('🏢 FINAL MAIN DOMAIN CHECK:', { 
          host: originalHost,
          hasCallbackUrl: !!callbackUrl,
          callbackUrl,
          environment: process.env.NODE_ENV,
          source: 'final_fallback'
        });
        
        if (callbackUrl) {
          console.log('✅ Using callback URL on main domain (final check):', callbackUrl);
          // Continue to validate and use the callback URL below
        } else {
          const mainDomainDashboard = process.env.NODE_ENV === "production"
            ? 'https://ed.databayt.org/dashboard'
            : 'http://localhost:3000/dashboard';
          
          console.log('🏢 FINAL MAIN DOMAIN REDIRECT (no callback):', { 
            host: originalHost,
            redirectUrl: mainDomainDashboard
          });
          
          return mainDomainDashboard;
        }
      }
      
      // Extract tenant from callbackUrl if present - check multiple sources
      let tenant = null;
      
      // Method 1: Check URL searchParams
      try {
        const urlObj = new URL(url, baseUrl);
        tenant = urlObj.searchParams.get('tenant');
        console.log('🔍 Tenant from URL params:', { tenant, url: urlObj.href });
      } catch (error) {
        console.log('❌ Error parsing URL for tenant:', error);
      }
      
      // Method 2: Check if URL contains tenant info in path
      if (!tenant && url.includes('/callback/')) {
        const urlMatch = url.match(/tenant=([^&]+)/);
        if (urlMatch) {
          tenant = urlMatch[1];
          console.log('🔍 Tenant from URL regex match:', tenant);
        }
      }
      
      // Method 3: Check baseUrl for tenant info
      if (!tenant) {
        try {
          const baseUrlObj = new URL(baseUrl);
          tenant = baseUrlObj.searchParams.get('tenant');
          if (tenant) {
            console.log('🔍 Tenant from baseUrl params:', { tenant, baseUrl });
          }
        } catch (error) {
          console.log('❌ Error parsing baseUrl for tenant:', error);
        }
      }
      
      // Method 4: Check session storage for tenant (client-side fallback)
      // Note: This won't work on server-side, but useful for debugging
      if (!tenant && typeof window !== 'undefined') {
        try {
          const sessionTenant = window.sessionStorage?.getItem('oauth_tenant');
          if (sessionTenant) {
            tenant = sessionTenant;
            console.log('🔍 Tenant from session storage:', { tenant });
            // Clear it after use
            window.sessionStorage.removeItem('oauth_tenant');
          }
        } catch (error) {
          console.log('❌ Error accessing session storage:', error);
        }
      }
      
      if (tenant) {
        // Redirect back to tenant subdomain
        const tenantUrl = process.env.NODE_ENV === "production" 
          ? `https://${tenant}.databayt.org/dashboard`
          : `http://${tenant}.localhost:3000/dashboard`;
        console.log('🔄 Redirecting to tenant via parameter:', { tenant, tenantUrl, originalUrl: url });
        return tenantUrl;
      }
      
      console.log('⚠️ No tenant parameter found in:', { url, baseUrl });
      
      // Handle OAuth callback completion
      if (url.includes('/api/auth/callback/')) {
        console.log('🔄 OAuth callback detected, processing redirect');
        // Let the default behavior handle the redirect
        // The middleware will handle subdomain routing
      }

      // Log all redirect attempts for debugging
      console.log('🔄 Processing redirect:', { url, baseUrl });
      
      // Check if this is an error
      if (url.includes('/error')) {
        console.log('❌ Error page detected, investigating...');
      }

      // Final redirect decision
      console.log('\n🎯 FINAL REDIRECT DECISION');
      console.log('Current state:', {
        hasCallbackUrl: !!callbackUrl,
        callbackUrl,
        url,
        baseUrl,
        urlStartsWithSlash: url.startsWith("/"),
        isSameOrigin: url.startsWith("http") ? new URL(url).origin === baseUrl : false
      });
      
      // Default behavior - redirect to dashboard on current domain
      if (url.startsWith("/")) {
        const finalUrl = `${baseUrl}/dashboard`;
        console.log('📍 Relative URL - defaulting to dashboard:', {
          reason: 'URL starts with /',
          originalUrl: url,
          finalUrl
        });
        console.log('=====================================');
        console.log('🔄 REDIRECT CALLBACK END');
        console.log('=====================================\n');
        return finalUrl;
      }
      else if (new URL(url).origin === baseUrl) {
        // If it's the same origin, redirect to dashboard
        const dashboardUrl = `${baseUrl}/dashboard`;
        console.log('📍 Same origin - defaulting to dashboard:', {
          reason: 'Same origin as baseUrl',
          originalUrl: url,
          finalUrl: dashboardUrl
        });
        console.log('=====================================');
        console.log('🔄 REDIRECT CALLBACK END');
        console.log('=====================================\n');
        return dashboardUrl;
      }
      
      const externalDashboard = `${baseUrl}/dashboard`;
      console.log('📍 External URL - defaulting to dashboard:', {
        reason: 'External URL',
        originalUrl: url,
        finalUrl: externalDashboard
      });
      console.log('=====================================');
      console.log('🔄 REDIRECT CALLBACK END');
      console.log('=====================================\n');
      return externalDashboard
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
const cookieDomain = process.env.NODE_ENV === "production" ? '.databayt.org' : undefined;
console.log('🍪 Cookie configuration:', {
  environment: process.env.NODE_ENV,
  cookieDomain,
  pkceCodeVerifier: {
    name: 'authjs.pkce.code_verifier',
    options: { sameSite: 'lax', secure: process.env.NODE_ENV === "production", httpOnly: true, maxAge: 900, domain: cookieDomain }
  },
  sessionToken: {
    name: 'authjs.session-token',
    options: { sameSite: 'lax', secure: process.env.NODE_ENV === "production", httpOnly: true, domain: cookieDomain }
  },
  callbackUrl: {
    name: 'authjs.callback-url',
    options: { sameSite: 'lax', secure: process.env.NODE_ENV === "production", domain: cookieDomain }
  },
  csrfToken: {
    name: 'authjs.csrf-token',
    options: { sameSite: 'lax', secure: process.env.NODE_ENV === "production", httpOnly: true, domain: cookieDomain }
  }
});