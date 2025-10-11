import { NextRequest } from 'next/server';
import { secureDebugEndpoint, createDebugResponse, getSafeEnvVars } from '@/lib/debug-security';

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
  const host = request.headers.get('host') || '';
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  const url = new URL(request.url);
  
  // Detect subdomain
  let subdomain = null;
  let subdomainType = 'none';
  
  // Production detection
  if (host.endsWith('.databayt.org') && host !== 'ed.databayt.org') {
    subdomain = host.split('.')[0];
    subdomainType = 'production';
  }
  // Development detection
  else if (host.includes('.localhost') && host !== 'localhost:3000' && host !== 'localhost') {
    subdomain = host.split('.')[0];
    subdomainType = 'development';
  }
  // Vercel preview
  else if (host.includes('---') && host.endsWith('.vercel.app')) {
    subdomain = host.split('---')[0];
    subdomainType = 'vercel';
  }
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    request: {
      host,
      pathname: url.pathname,
      search: url.search,
      href: url.href,
      origin: url.origin,
      referer,
      userAgent: userAgent.slice(0, 100) + '...'
    },
    subdomain: {
      detected: subdomain,
      type: subdomainType,
      isSubdomain: !!subdomain
    },
    environment: getSafeEnvVars(),
    detection: {
      hostParts: host.split('.'),
      endsWithDatabayt: host.endsWith('.databayt.org'),
      notEdDatabayt: host !== 'ed.databayt.org',
      includesLocalhost: host.includes('.localhost'),
      notPlainLocalhost: host !== 'localhost:3000' && host !== 'localhost',
      includesDashes: host.includes('---'),
      endsWithVercel: host.endsWith('.vercel.app')
    }
  };
  
  console.log('🔍 SUBDOMAIN DEBUG API CALLED (AUTHORIZED):', debugInfo);
  
  return createDebugResponse(debugInfo);
  });
}