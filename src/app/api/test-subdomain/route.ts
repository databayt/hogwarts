import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'unknown'
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  const subdomain = request.headers.get('x-subdomain')
  
  return Response.json({ 
    success: true,
    host,
    rootDomain,
    subdomain,
    timestamp: new Date().toISOString(),
    message: "Subdomain test endpoint working",
    env: {
      NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
      NODE_ENV: process.env.NODE_ENV
    }
  })
}
