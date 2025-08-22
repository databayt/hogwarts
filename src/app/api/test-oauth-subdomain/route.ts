import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
    
    console.log('OAuth subdomain test:', debugInfo);
    
    return NextResponse.json({
      success: true,
      debugInfo,
      message: 'OAuth subdomain test completed'
    });
  } catch (error) {
    console.error('OAuth subdomain test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
