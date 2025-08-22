import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.url;
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0];
    const pathname = new URL(url).pathname;
    
    // Extract subdomain using the same logic as middleware
    let subdomain = null;
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const fullUrlMatch = url.match(/http:\/\/([^.]+)\.localhost/);
      if (fullUrlMatch && fullUrlMatch[1]) {
        subdomain = fullUrlMatch[1];
      } else if (hostname.includes('.localhost')) {
        subdomain = hostname.split('.')[0];
      }
    }
    
    const debugInfo = {
      url,
      host,
      hostname,
      pathname,
      subdomain,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      timestamp: new Date().toISOString()
    };
    
    console.log('Debug subdomain info:', debugInfo);
    
    return NextResponse.json({
      success: true,
      debugInfo,
      message: 'Subdomain debug information'
    });
  } catch (error) {
    console.error('Subdomain debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
