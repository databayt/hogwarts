import { NextRequest, NextResponse } from 'next/server';
import { secureDebugEndpoint, createDebugResponse, getSafeEnvVars } from '@/lib/debug-security';

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async (req) => {
  try {
    // Use safe environment variables
    const envCheck = getSafeEnvVars();

    // Only show OAuth URLs are configured, not the actual URLs with secrets
    const oauthStatus = {
      facebook: {
        clientIdConfigured: !!process.env.FACEBOOK_CLIENT_ID,
        clientSecretConfigured: !!process.env.FACEBOOK_CLIENT_SECRET,
        callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/facebook`
      },
      google: {
        clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`
      }
    };

    return createDebugResponse({
      success: true,
      environment: envCheck,
      oauthStatus,
      message: 'OAuth configuration test completed (secured)'
    });
  } catch (error) {
    console.error('OAuth test error:', error);
    return createDebugResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
  });
}
