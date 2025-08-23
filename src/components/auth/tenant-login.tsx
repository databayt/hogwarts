"use client";

import { Button } from "@/components/ui/button";

export function TenantLoginButton({ tenantSubdomain }: { tenantSubdomain: string }) {
  const handleLogin = () => {
    // Determine base URL based on environment
    const baseUrl = process.env.NODE_ENV === "production" 
      ? "https://ed.databayt.org"
      : "http://localhost:3000";
    
    // Login on main domain with tenant context
    const loginUrl = `${baseUrl}/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(
      `${baseUrl}/api/auth/callback/facebook?tenant=${tenantSubdomain}`
    )}`;
    
    console.log('🔗 Redirecting to login:', loginUrl);
    window.location.href = loginUrl;
  };
  
  return (
    <Button onClick={handleLogin} className="w-full">
      Login with Facebook
    </Button>
  );
}