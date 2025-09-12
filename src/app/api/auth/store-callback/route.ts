import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { callbackUrl } = await request.json();
    
    if (!callbackUrl) {
      return NextResponse.json({ error: "No callback URL provided" }, { status: 400 });
    }
    
    console.log('📝 Storing callback URL server-side:', callbackUrl);
    
    // Store the callback URL in a server-side cookie
    const cookieStore = cookies();
    cookieStore.set({
      name: 'oauth_callback_intended',
      value: callbackUrl,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 900, // 15 minutes
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.databayt.org' : undefined,
    });
    
    console.log('✅ Callback URL stored in server-side cookie');
    
    return NextResponse.json({ success: true, callbackUrl });
  } catch (error) {
    console.error('❌ Error storing callback URL:', error);
    return NextResponse.json({ error: "Failed to store callback URL" }, { status: 500 });
  }
}