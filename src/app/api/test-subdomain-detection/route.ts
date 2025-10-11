import { NextRequest } from 'next/server'
import { secureDebugEndpoint, createDebugResponse, getSafeEnvVars } from '@/lib/debug-security';

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

  console.log('🔍 TEST ENDPOINT - Subdomain extraction (AUTHORIZED):', {
    url: url.split('?')[0], // Remove query params for security
    host,
    hostname,
    rootDomain: rootDomain ? '[CONFIGURED]' : '[NOT_SET]',
    environment: process.env.NODE_ENV
  });

  // Local development environment
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    if (hostname.includes('.localhost')) {
      const subdomain = hostname.split('.')[0];
      return subdomain;
    }
    return null;
  }

  // Production environment
  const rootDomainFormatted = rootDomain.split(':')[0];

  // Special handling for ed.databayt.org domain structure
  if (rootDomainFormatted === 'ed.databayt.org') {
    // Check if hostname is the main domain
    if (hostname === 'ed.databayt.org' || hostname === 'www.ed.databayt.org') {
      return null;
    }
    
    // Check if it's a school subdomain (*.databayt.org but not ed.databayt.org)
    if (hostname.endsWith('.databayt.org') && hostname !== 'ed.databayt.org') {
      const subdomain = hostname.replace('.databayt.org', '');
      return subdomain;
    }
  } else {
    // Regular subdomain detection for other domains
    const isSubdomain =
      hostname !== rootDomainFormatted &&
      hostname !== `www.${rootDomainFormatted}` &&
      hostname.endsWith(`.${rootDomainFormatted}`);

    if (isSubdomain) {
      const subdomain = hostname.replace(`.${rootDomainFormatted}`, '');
      return subdomain;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  return secureDebugEndpoint(request, async () => {
    const host = request.headers.get('host') || 'unknown'
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
    const subdomain = extractSubdomain(request)
    
    return createDebugResponse({ 
      success: true,
      host,
      rootDomain: rootDomain ? '[CONFIGURED]' : '[NOT_SET]',
      subdomain,
      subdomainDetection: {
        hostEndsWithRoot: rootDomain ? host?.endsWith("." + rootDomain) : false,
        dotRootDomain: rootDomain ? "[CONFIGURED]" : null,
        subdomainEndIndex: rootDomain ? host.lastIndexOf("." + rootDomain) : -1,
        extractedSubdomain: subdomain
      },
      environment: getSafeEnvVars(),
      message: "Subdomain detection test (secured) - using middleware logic"
    });
  });
}

