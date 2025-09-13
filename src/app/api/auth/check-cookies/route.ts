import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  console.log('=====================================');
  console.log('🍪 CHECK-COOKIES API CALLED');
  console.log('=====================================');
  
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('📋 All server-side cookies:', {
      count: allCookies.length,
      cookies: allCookies.map(c => ({
        name: c.name,
        value: c.value?.substring(0, 100)
      }))
    });
    
    // Check for specific OAuth-related cookies
    const oauthCallbackCookie = cookieStore.get('oauth_callback_intended');
    const authCookies = allCookies.filter(c => 
      c.name.includes('auth') || 
      c.name.includes('oauth') || 
      c.name.includes('callback') ||
      c.name.includes('next-auth')
    );
    
    const result = {
      timestamp: new Date().toISOString(),
      totalCookies: allCookies.length,
      oauthCallbackCookie: oauthCallbackCookie ? {
        exists: true,
        value: oauthCallbackCookie.value
      } : {
        exists: false,
        value: null
      },
      authRelatedCookies: authCookies.map(c => ({
        name: c.name,
        valuePreview: c.value?.substring(0, 50) + '...'
      })),
      allCookieNames: allCookies.map(c => c.name)
    };
    
    console.log('📊 Cookie check result:', result);
    console.log('=====================================\n');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error checking cookies:', error);
    return NextResponse.json({ 
      error: "Failed to check cookies",
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}