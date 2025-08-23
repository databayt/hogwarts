"use client";

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface TenantLoginRedirectProps {
  subdomain: string;
  className?: string;
}

export function TenantLoginRedirect({ subdomain, className }: TenantLoginRedirectProps) {
  const handleLogin = () => {
    // Redirect to central auth with tenant context
    const loginUrl = `https://ed.databayt.org/login?tenant=${subdomain}`;
    console.log('🔗 Redirecting to central login:', loginUrl);
    window.location.href = loginUrl;
  };

  return (
    <div className={`text-center space-y-4 ${className}`}>
      <h2 className="text-2xl font-bold">Login Required</h2>
      <p className="text-muted-foreground">
        Please log in to access the {subdomain} dashboard.
      </p>
      <Button onClick={handleLogin} className="w-full">
        Login to {subdomain}
      </Button>
    </div>
  );
}
