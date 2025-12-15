/**
 * OAuth Subdomain Test API - Cross-Domain Flow Debugging
 *
 * Tests OAuth URL construction from subdomain context.
 *
 * WHY THIS EXISTS:
 * - OAuth happens on main domain (localhost:3000)
 * - User starts on subdomain (school.localhost:3000)
 * - Callback URL must preserve subdomain context
 *
 * THE PROBLEM:
 * 1. User on school.localhost:3000 clicks "Login with Google"
 * 2. Redirects to Google on accounts.google.com
 * 3. Google redirects back to callback URL
 * 4. Callback URL must be localhost:3000 (registered)
 * 5. But user expects to return to school.localhost:3000
 *
 * THE SOLUTION:
 * - callbackUrl parameter encodes the subdomain URL
 * - OAuth flow preserves this in state
 * - After auth, redirect to original subdomain
 *
 * WHY LOCALHOST:3000 FOR SIGNIN:
 * - OAuth providers require registered callback URLs
 * - Can't register *.localhost (wildcard)
 * - Main domain handles OAuth, then redirects to subdomain
 *
 * SECURITY:
 * - Protected by secureDebugEndpoint
 * - Shows constructed URLs (safe to expose)
 * - Helps verify correct OAuth flow setup
 *
 * DEBUG OUTPUT:
 * - Current request context (host, subdomain)
 * - Constructed OAuth URLs with encoded callbacks
 * - Timestamp for log correlation
 */

import { NextRequest } from 'next/server';
import { secureDebugEndpoint, createDebugResponse } from '@/lib/debug-security';

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
  try {
    const url = request.url;
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0];
    const pathname = new URL(url).pathname;
    
    // Extract subdomain
    let subdomain = null;
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
      if (fullUrlMatch && fullUrlMatch[1]) {
        subdomain = fullUrlMatch[1];
      } else if (hostname.includes('.localhost')) {
        subdomain = hostname.split('.')[0];
      }
    }
    
    // Test OAuth URLs from subdomain perspective
    const oauthUrls = {
      facebook: `http://localhost:3000/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(`http://${hostname}/dashboard`)}`,
      google: `http://localhost:3000/api/auth/signin/google?callbackUrl=${encodeURIComponent(`http://${hostname}/dashboard`)}`
    };
    
    const debugInfo = {
      url,
      host,
      hostname,
      pathname,
      subdomain,
      oauthUrls,
      timestamp: new Date().toISOString()
    };
    
    console.log('OAuth subdomain test (AUTHORIZED):', debugInfo);
    
    return createDebugResponse({
      success: true,
      debugInfo,
      message: 'OAuth subdomain test completed (secured)'
    });
  } catch (error) {
    console.error('OAuth subdomain test error:', error);
    return createDebugResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
  });
}
