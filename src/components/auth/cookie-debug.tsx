'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CookieInfo {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  expires?: string;
}

export function CookieDebug() {
  const [cookies, setCookies] = useState<CookieInfo[]>([]);
  const [authCookies, setAuthCookies] = useState<CookieInfo[]>([]);
  const [hostname, setHostname] = useState<string>('');
  const [isSubdomain, setIsSubdomain] = useState<boolean>(false);

  useEffect(() => {
    // Get hostname
    const currentHostname = window.location.hostname;
    setHostname(currentHostname);
    
    // Check if this is a subdomain
    const isSub = currentHostname.includes('.') && 
                  currentHostname !== 'localhost' && 
                  !currentHostname.startsWith('www.');
    setIsSubdomain(isSub);

    // Get all cookies
    const allCookies = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value: value || '' };
    });

    // Filter auth-related cookies
    const auth = allCookies.filter(cookie => 
      cookie.name.startsWith('authjs.') || 
      cookie.name.includes('session') ||
      cookie.name.includes('auth')
    );

    setCookies(allCookies);
    setAuthCookies(auth);

    console.log('🍪 CLIENT COOKIE DEBUG:', {
      hostname: currentHostname,
      isSubdomain: isSub,
      totalCookies: allCookies.length,
      authCookies: auth.length,
      allCookies: allCookies,
      authCookies: auth
    });
  }, []);

  const testSessionAPI = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      console.log('🔍 Session API Response:', data);
      
      // Also test the debug session API
      const debugResponse = await fetch('/api/debug-session');
      const debugData = await debugResponse.json();
      console.log('🔍 Debug Session API Response:', debugData);
      
      alert(`Session API: ${JSON.stringify(data, null, 2)}\n\nDebug API: ${JSON.stringify(debugData, null, 2)}`);
    } catch (error) {
      console.error('❌ Error testing session API:', error);
      alert(`Error: ${error}`);
    }
  };

  const clearCookies = () => {
    // Clear all auth cookies
    authCookies.forEach(cookie => {
      document.cookie = `${cookie.name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    
    // Reload to see the effect
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🍪 Cookie Debug Panel
          <Badge variant={isSubdomain ? "destructive" : "secondary"}>
            {isSubdomain ? "Subdomain" : "Main Domain"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Debugging cookie configuration for {hostname}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">All Cookies ({cookies.length})</h3>
            <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm">
              {cookies.map((cookie, index) => (
                <div key={index} className="mb-1 p-1 bg-gray-50 rounded">
                  <strong>{cookie.name}</strong>: {cookie.value.slice(0, 50)}
                  {cookie.value.length > 50 && '...'}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Auth Cookies ({authCookies.length})</h3>
            <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm">
              {authCookies.map((cookie, index) => (
                <div key={index} className="mb-1 p-1 bg-blue-50 rounded">
                  <strong>{cookie.name}</strong>: {cookie.value.slice(0, 50)}
                  {cookie.value.length > 50 && '...'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={testSessionAPI} variant="outline">
            🔍 Test Session API
          </Button>
          <Button onClick={clearCookies} variant="destructive">
            🗑️ Clear Auth Cookies
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Hostname:</strong> {hostname}</p>
          <p><strong>Is Subdomain:</strong> {isSubdomain ? 'Yes' : 'No'}</p>
          <p><strong>Expected Cookie Domain:</strong> {isSubdomain ? '.databayt.org' : 'Specific domain'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
