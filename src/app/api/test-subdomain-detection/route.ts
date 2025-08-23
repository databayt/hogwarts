import { NextRequest } from 'next/server'

function extractSubdomain(request: NextRequest): string | null {
  const url = request.url;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0];
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

  console.log('🔍 TEST ENDPOINT - Subdomain extraction:', {
    url,
    host,
    hostname,
    rootDomain,
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
  const host = request.headers.get('host') || 'unknown'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  const subdomain = extractSubdomain(request)
  
  return Response.json({ 
    success: true,
    host,
    rootDomain,
    subdomain,
    subdomainDetection: {
      hostEndsWithRoot: rootDomain ? host?.endsWith("." + rootDomain) : false,
      dotRootDomain: rootDomain ? "." + rootDomain : null,
      subdomainEndIndex: rootDomain ? host.lastIndexOf("." + rootDomain) : -1,
      extractedSubdomain: subdomain
    },
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: "Subdomain detection test - using middleware logic"
  })
}

