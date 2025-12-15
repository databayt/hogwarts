/**
 * OAuth Callback URL Storage API
 *
 * Persists the intended destination URL before OAuth redirect.
 *
 * THE PROBLEM:
 * OAuth flow redirects user to provider (Google/Facebook) then back.
 * Original URL (e.g., /dashboard?tab=settings) is lost during redirect.
 *
 * THE SOLUTION:
 * 1. Client calls this API before initiating OAuth
 * 2. We store the callback URL in httpOnly cookie
 * 3. After OAuth success, auth callback reads cookie and redirects
 *
 * WHY HTTPONLY COOKIE (not localStorage):
 * - Survives cross-domain OAuth redirect
 * - httpOnly prevents XSS attacks reading the URL
 * - sameSite: 'lax' allows OAuth callback to read it
 * - Expires after 15 minutes (oauth shouldn't take longer)
 *
 * WHY NO DOMAIN IN COOKIE:
 * - Browser automatically scopes to current domain
 * - Explicit domain can cause issues with subdomain cookies
 * - Simplifies dev/prod/preview environment handling
 *
 * WHY SECURE ONLY IN PRODUCTION:
 * - localhost doesn't support HTTPS easily
 * - Development must use HTTP
 * - Production always uses HTTPS
 *
 * COOKIE NAME: 'oauth_callback_intended'
 * - Distinguishes from NextAuth's own cookies
 * - Clear naming prevents confusion
 *
 * VERBOSE LOGGING:
 * - OAuth debugging is notoriously difficult
 * - Logs help trace where callback URL is lost
 * - Should be reduced in production (TODO)
 *
 * @see /auth.ts - signIn callback reads this cookie
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    console.log('=====================================');
    console.log('📝 STORE-CALLBACK API CALLED');
    console.log('=====================================');
    
    // Log request details
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');
    
    console.log('📍 Request Details:', {
      method: request.method,
      url: request.url,
      origin,
      referer,
      userAgent: userAgent?.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });
    
    const { callbackUrl } = await request.json();
    
    if (!callbackUrl) {
      console.log('⚠️ No callback URL provided in request body');
      return NextResponse.json({ error: "No callback URL provided" }, { status: 400 });
    }
    
    console.log('🎯 Callback URL to store:', {
      callbackUrl,
      length: callbackUrl.length,
      startsWithSlash: callbackUrl.startsWith('/'),
      isFullUrl: callbackUrl.startsWith('http')
    });
    
    // Store the callback URL in a server-side cookie
    const cookieStore = await cookies();
    
    // List existing cookies before setting
    const existingCookies = cookieStore.getAll();
    console.log('🍪 Existing cookies before set:', {
      count: existingCookies.length,
      names: existingCookies.map(c => c.name),
      hasOauthCallback: existingCookies.some(c => c.name === 'oauth_callback_intended')
    });
    
    // Don't set domain in development to avoid cookie issues
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    const cookieOptions = {
      name: 'oauth_callback_intended',
      value: callbackUrl,
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: !isDevelopment, // Only secure in production
      maxAge: 900, // 15 minutes
      path: '/',
      // Remove domain specification entirely to let browser handle it
      // This ensures cookie works across OAuth redirects
    };
    
    console.log('🔧 Cookie options:', {
      ...cookieOptions,
      value: cookieOptions.value.substring(0, 50) + '...'
    });
    
    cookieStore.set(cookieOptions);
    
    // Verify the cookie was set
    const verificationCookie = cookieStore.get('oauth_callback_intended');
    console.log('✅ Verification after set:', {
      cookieExists: !!verificationCookie,
      cookieValue: verificationCookie?.value,
      matches: verificationCookie?.value === callbackUrl
    });
    
    // List all cookies after setting
    const afterCookies = cookieStore.getAll();
    console.log('🍪 Cookies after set:', {
      count: afterCookies.length,
      names: afterCookies.map(c => c.name),
      oauthCallbackCookie: afterCookies.find(c => c.name === 'oauth_callback_intended')
    });
    
    console.log('✅ Store-callback API completed successfully');
    console.log('=====================================\n');
    
    return NextResponse.json({ 
      success: true, 
      callbackUrl,
      stored: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in store-callback API:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: "Failed to store callback URL" }, { status: 500 });
  }
}