import { NextRequest } from 'next/server'
import { secureDebugEndpoint, createDebugResponse, getSafeEnvVars } from '@/lib/debug-security';

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
  const host = request.headers.get('host') || 'unknown'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  const subdomain = request.headers.get('x-subdomain')
  
  return createDebugResponse({ 
    success: true,
    host,
    rootDomain,
    subdomain,
    message: "Subdomain test endpoint working (secured)",
    env: getSafeEnvVars()
  });
  });
}
