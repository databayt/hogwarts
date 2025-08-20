import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'unknown'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  
  // Test the exact logic from middleware
  let subdomain: string | null = null
  
  if (rootDomain && host && host.endsWith("." + rootDomain)) {
    const dotRootDomain = "." + rootDomain
    const subdomainEndIndex = host.lastIndexOf(dotRootDomain)
    if (subdomainEndIndex > 0) {
      subdomain = host.substring(0, subdomainEndIndex)
    }
  }
  
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
    timestamp: new Date().toISOString(),
    message: "Subdomain detection test"
  })
}
