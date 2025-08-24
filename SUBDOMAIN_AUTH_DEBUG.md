# Subdomain Authentication Debug Summary

## Current Status: FIXED ✅

**Root Cause Found**: Browsers reject cookies with `domain: '.localhost'` for security reasons. The solution is to use `lvh.me` which resolves to 127.0.0.1 and supports subdomains.

**Solution Applied**: Changed all localhost references to `lvh.me` so cookies can be properly shared across subdomains.

## Issue Description

When a user logs in from a subdomain (e.g., `khartoum.localhost:3000`):
1. ✅ OAuth authentication flow works correctly
2. ✅ JWT and session callbacks execute successfully 
3. ✅ User is redirected back to subdomain `/dashboard`
4. ❌ Client-side `useSession()` returns `status: 'unauthenticated'`
5. ❌ User gets redirected back to login page (infinite loop)

## Evidence from Logs

**Server-side authentication is working:**
```
🔐 JWT CALLBACK END: { tokenId: 'user_2pjQhdQfDOYJrHE3...', hasRole: true, hasSchoolId: true }
📋 SESSION CALLBACK END: { sessionId: 'user_2pjQhdQfDOYJrHE3...', hasRole: true, hasSchoolId: true }
🎉 SIGN IN EVENT: { userId: 'user_2pjQhdQfDOYJrHE3...', provider: 'facebook' }
```

**Client-side components not loading:**
- `ClientCookieDebug` component not showing console output
- `SessionDebugPanel` component not appearing
- Suggests client-side session detection is failing completely

## Technical Configuration

### Cookie Configuration ✅ CORRECT
```typescript
cookies: {
  sessionToken: {
    name: 'authjs.session-token',
    options: {
      domain: '.localhost',  // Should share across subdomains
      httpOnly: true,
      sameSite: 'lax',
      secure: false (development)
    }
  }
  // All other cookies also configured with domain: '.localhost'
}
```

### NextAuth Configuration ✅ CORRECT
```typescript
session: { strategy: "jwt" },
trustHost: true,  // Allows subdomain requests
debug: true (development)
```

### Client-side Setup ✅ CORRECT
```typescript
// Root layout uses client-only SessionProvider
<SessionProvider>  // No server-side session passed
  <ClientDashboardContent />
</SessionProvider>
```

## Where We're Stuck

**Root Cause Unknown**: Despite all configurations being correct, the `/api/auth/session` endpoint on subdomains is not returning the authenticated session data.

**Possible Issues:**
1. **Cookie Domain**: Despite setting `domain: '.localhost'`, cookies may not be sharing properly
2. **NextAuth Internal Issue**: The `auth()` function may not be reading subdomain cookies correctly
3. **Browser Security**: Modern browsers may block cross-subdomain cookie sharing on localhost
4. **Middleware Interference**: Request routing may be affecting cookie headers
5. **Session Storage**: JWT tokens may not be persisting correctly across domains

## Files Modified

### Core Authentication
- `src/auth.ts` - Enhanced cookie configuration and debugging
- `src/auth.config.ts` - OAuth provider configuration
- `src/components/auth/social.tsx` - Subdomain-aware OAuth flow

### Debugging Components
- `src/components/auth/client-cookie-debug.tsx` - Browser cookie inspection
- `src/components/auth/session-debug-panel.tsx` - Interactive session API testing
- `src/components/auth/subdomain-session-provider.tsx` - Client session management
- `src/app/api/debug-session/route.ts` - Server-side session inspection

### Dashboard Integration
- `src/app/s/[subdomain]/(platform)/dashboard/page.tsx` - Added all debug components
- `src/components/platform/dashboard/client-dashboard-content.tsx` - Client-side rendering
- `src/app/layout.tsx` - Client-only SessionProvider

## Debug Tools Added

### 1. Interactive Session Debug Panel
- Location: Bottom-right corner of dashboard
- Features: Test different session API endpoints with buttons
- Tests: `useSession()`, `getSession()`, `/api/auth/session`, `/api/debug-session`

### 2. Enhanced Cookie Inspector  
- Logs all browser cookies to console
- Specifically checks for `authjs.session-token`
- Shows cookie sharing status across subdomains

### 3. Server-side Session API
- Endpoint: `/api/debug-session`
- Returns: Complete session state, cookie headers, environment info
- Accessible on both domains for comparison

## Next Steps to Resolve

### 1. Test Cookie Sharing (HIGH PRIORITY)
```bash
# Test these URLs after logging in:
http://localhost:3000/api/debug-session
http://khartoum.localhost:3000/api/debug-session
```
Compare cookie headers and session data returned.

### 2. Browser Cookie Investigation
Open browser DevTools → Application → Cookies:
- Check if `authjs.session-token` exists on `.localhost` domain
- Verify cookie is accessible from both `localhost:3000` and `khartoum.localhost:3000`

### 3. Manual Session API Testing
Use the debug panel buttons to test:
- Does `/api/auth/session` return different data on main vs subdomain?
- Does `getSession()` work differently than `useSession()`?

### 4. Alternative Solutions to Try
1. **Force Cookie Domain**: Manually set cookies via JavaScript
2. **Session Storage Fallback**: Store JWT tokens in localStorage
3. **Server-side Session**: Pass session data via props instead of client hooks
4. **Custom Session Provider**: Bypass NextAuth's client-side session management

## Environment Details

- **Development**: `localhost:3000` with subdomains `*.localhost:3000`
- **NextAuth**: v5 with JWT strategy
- **Framework**: Next.js 14 with App Router
- **Authentication**: Google + Facebook OAuth
- **Database**: PostgreSQL with Prisma

## Log Pattern for Success

When working correctly, we should see:
```
🍪 CLIENT COOKIE DEBUG: { hostname: 'khartoum.localhost', authCookies: 2+ }
✅ SESSION TOKEN FOUND ON SUBDOMAIN
🔍 SUBDOMAIN SESSION PROVIDER: { status: 'authenticated', hasSession: true }
🎯 CLIENT DASHBOARD CONTENT: { status: 'authenticated', userId: 'user_...' }
```

Currently seeing: **NONE of these client-side logs appear**

## ✅ SOLUTION IMPLEMENTED

### Root Cause
Browsers reject `.localhost` cookies for security. Chrome, Safari, Firefox all block cross-subdomain cookie sharing for `.localhost` domains.

### Fix Applied
1. **Changed cookie domain**: `.localhost` → `.lvh.me`
2. **Updated environment variables**: `localhost:3000` → `lvh.me:3000`
3. **Updated all auth URLs**: Redirect URLs now use `lvh.me` 
4. **Updated middleware**: Subdomain detection works with `lvh.me`

### Files Changed
- `src/auth.ts` - Cookie domain configuration
- `src/middleware.ts` - Subdomain detection
- `src/components/auth/social.tsx` - OAuth redirects
- `.env.local` - Environment URLs

### How to Test
1. **Main domain**: Visit `http://lvh.me:3000`
2. **Subdomain**: Visit `http://khartoum.lvh.me:3000`
3. **Login flow**: Login from subdomain should now work correctly

### Why lvh.me Works
- `lvh.me` resolves to `127.0.0.1` (localhost)
- Browsers allow `.lvh.me` cross-subdomain cookies
- No DNS setup required - works out of the box