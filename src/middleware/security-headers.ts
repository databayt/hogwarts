/**
 * Security Headers Middleware
 * Implements comprehensive security headers including CSP, HSTS, etc.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function addSecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    };
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' blob: data: https:;
    connect-src 'self' https://api.stripe.com https://*.vercel.app https://*.databayt.org wss://*.databayt.org;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    media-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Apply security headers
  const headers = new Headers(response.headers);

  // CSP
  headers.set('Content-Security-Policy', cspHeader);
  headers.set('X-Nonce', nonce);

  // HSTS - Strict Transport Security
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()'
  );

  // X-XSS-Protection (legacy but still useful for older browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // DNS Prefetch Control
  headers.set('X-DNS-Prefetch-Control', 'on');

  // Prevent IE from opening downloads in the context of the web application
  headers.set('X-Download-Options', 'noopen');

  // Remove server identification
  headers.delete('X-Powered-By');
  headers.delete('Server');

  // Add custom security headers
  headers.set('X-Request-Id', request.headers.get('x-request-id') || '');

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://ed.databayt.org',
      'https://*.databayt.org',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
    ].filter(Boolean);

    if (origin && allowedOrigins.some(allowed => origin.match(allowed.replace('*', '.*')))) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      headers.set('Access-Control-Max-Age', '86400');
    }
  }

  // Return response with security headers
  const securedResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  headers.forEach((value, key) => {
    securedResponse.headers.set(key, value);
  });

  return securedResponse;
}

/**
 * Generate CSP nonce for inline scripts
 */
export function generateCSPNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64');
}

/**
 * Get CSP meta tag for pages
 */
export function getCSPMetaTag(nonce: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'nonce-${nonce}' 'strict-dynamic';">`;
}