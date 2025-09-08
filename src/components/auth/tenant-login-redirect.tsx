"use client";

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface TenantLoginRedirectProps {
  subdomain: string;
  className?: string;
}

export function TenantLoginRedirect({ subdomain, className }: TenantLoginRedirectProps) {
  const handleLogin = () => {
    // Store tenant info for post-auth redirect
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('oauth_tenant', subdomain);
      console.log('💾 Stored tenant for auth:', subdomain);
    }
    
    // Redirect to central auth with tenant context
    const loginUrl = process.env.NODE_ENV === 'production'
      ? `https://ed.databayt.org/login?tenant=${subdomain}`
      : `http://localhost:3000/login?tenant=${subdomain}`;
      
    console.log('🔗 TENANT LOGIN REDIRECT:', { 
      subdomain, 
      loginUrl, 
      environment: process.env.NODE_ENV 
    });
    
    window.location.href = loginUrl;
  };

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <h2>Login Required</h2>
      <p className="text-muted-foreground">
        Please log in to access the {subdomain} dashboard.
      </p>
      <Button onClick={handleLogin} className="w-full">
        Login to {subdomain}
      </Button>
    </div>
  );
}
