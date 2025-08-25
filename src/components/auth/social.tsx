"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";


import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

// Function to clean Facebook URL hash
const cleanUrlHash = () => {
  // Only run on client side
  if (typeof window !== "undefined") {
    // Check if URL has the Facebook hash fragment
    if (window.location.hash === "#_=_") {
      // Clean the hash
      const cleanUrl = window.location.href.replace(/#.*$/, "");
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }
};

export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const tenant = searchParams.get("tenant");
  
  console.log('🚀 Social component loaded on:', {
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    href: typeof window !== 'undefined' ? window.location.href : 'server'
  });
  
  // Clean URL hash on component mount - this will handle Facebook redirects
  useEffect(() => {
    cleanUrlHash();
    
    // Debug: Log component mount
    console.log('Social component mounted on:', {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      href: window.location.href,
      callbackUrl
    });
    
    // Additional debug info
    console.log('Window location details:', {
      protocol: window.location.protocol,
      host: window.location.host,
      hostname: window.location.hostname,
      port: window.location.port,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      href: window.location.href
    });
    
    // Test if we're in a subdomain context
    const isSubdomain = window.location.hostname.includes('.localhost') && window.location.hostname !== 'localhost';
    console.log('Subdomain detection:', {
      hostname: window.location.hostname,
      isSubdomain,
      includesLocalhost: window.location.hostname.includes('.localhost'),
      notLocalhost: window.location.hostname !== 'localhost'
    });
  }, []);

  const onClick = (provider: "google" | "facebook") => {
    // Ensure we're on client side
    if (typeof window === 'undefined') {
      console.log('❌ onClick called on server side, aborting');
      return;
    }
    
    // Check if we're on a subdomain
    const currentHost = window.location.hostname;
    const isProdSubdomain = currentHost.endsWith('.databayt.org') && currentHost !== 'ed.databayt.org';
    const isDevSubdomain = currentHost.includes('.localhost') && currentHost !== 'localhost';
    const isSubdomain = isProdSubdomain || isDevSubdomain;
    
    console.log('🔍 Host detection debug:', {
      currentHost,
      isProdSubdomain,
      isDevSubdomain,
      isSubdomain,
      endsWithDatabayt: currentHost.endsWith('.databayt.org'),
      notEdDatabayt: currentHost !== 'ed.databayt.org'
    });
    
    console.log('🚀 OAUTH FLOW INITIATED:', {
      provider,
      currentHost,
      isSubdomain,
      callbackUrl,
      tenant,
      currentUrl: window.location.href
    });
    
    // Determine tenant - use subdomain detection or URL parameter
    let tenantSubdomain = null;
    
    if (isSubdomain) {
      tenantSubdomain = currentHost.split('.')[0];
      console.log('🎯 Tenant from subdomain detection:', tenantSubdomain);
    } else if (tenant) {
      tenantSubdomain = tenant;
      console.log('🎯 Tenant from URL parameter:', tenantSubdomain);
    }
    
    // If we have a tenant (either from subdomain or parameter), use custom OAuth flow
    if (tenantSubdomain) {
      // Use appropriate URL based on environment
      const dashboardUrl = process.env.NODE_ENV === 'production' 
        ? `https://${tenantSubdomain}.databayt.org/dashboard`
        : `http://${tenantSubdomain}.localhost:3000/dashboard`;
      
      console.log('🔗 TENANT OAUTH INITIATED:', { 
        tenantSubdomain, 
        provider,
        dashboardUrl,
        currentHost,
        environment: process.env.NODE_ENV,
        source: isSubdomain ? 'subdomain_detection' : 'url_parameter',
        isProdSubdomain,
        isDevSubdomain
      });
      
      // Store tenant info for fallback
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('oauth_tenant', tenantSubdomain);
        sessionStorage.setItem('oauth_callback_url', dashboardUrl);
        console.log('💾 Stored OAuth context:', { 
          tenant: tenantSubdomain, 
          callbackUrl: dashboardUrl 
        });
      }
      
      signIn(provider, {
        callbackUrl: `${dashboardUrl}?tenant=${tenantSubdomain}`,
      });
      return;
    }
    
    // Default OAuth flow for main domain
    console.log('Using NextAuth signIn for OAuth:', {
      provider,
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
      currentHost
    });
    
    signIn(provider, {
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
  }

  return (
    <div className="space-y-4">
      {/* Debug test button */}
      {/* <Button
        size="sm"
        variant="outline"
        onClick={() => {
          console.log('Debug button clicked!');
          console.log('Current location:', window.location.href);
          console.log('Hostname:', window.location.hostname);
        }}
        className="w-full"
      >
        🐛 Debug Test Button
      </Button> */}
      
      <div className="grid md:gap-4 gap-3 grid-cols-2">
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          onClick={() => onClick("google")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Google
        </Button>
        <Button
          size="lg"
          className="w-full"
          variant="outline"
          onClick={() => {
            console.log('Facebook button clicked!');
            onClick("facebook");
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              fill="currentColor"
            />
          </svg>
          Facebook
        </Button>
      </div>
    </div>
  );
};
