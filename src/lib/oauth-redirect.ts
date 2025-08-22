/**
 * OAuth Redirect Utilities for Multi-tenant Subdomains
 */

export function getOAuthRedirectUrl(provider: string, callbackUrl?: string | null) {
  if (typeof window === 'undefined') return null;
  
  const currentHost = window.location.hostname;
  const isSubdomain = currentHost.includes('.localhost') && currentHost !== 'localhost';
  
  if (isSubdomain && process.env.NODE_ENV === 'development') {
    // For subdomains in development, use main domain for OAuth
    const mainDomain = 'http://localhost:3000';
    const currentSubdomain = currentHost.split('.')[0];
    
    // Store subdomain in session storage for post-auth redirect
    sessionStorage.setItem('oauth_subdomain', currentSubdomain);
    if (callbackUrl) {
      sessionStorage.setItem('oauth_callback', callbackUrl);
    }
    
    return `${mainDomain}/api/auth/signin/${provider}`;
  }
  
  return null; // Use normal OAuth flow
}

export function handlePostOAuthRedirect() {
  if (typeof window === 'undefined') return;
  
  const subdomain = sessionStorage.getItem('oauth_subdomain');
  const callback = sessionStorage.getItem('oauth_callback');
  
  if (subdomain && process.env.NODE_ENV === 'development') {
    // Clear session storage
    sessionStorage.removeItem('oauth_subdomain');
    sessionStorage.removeItem('oauth_callback');
    
    // Redirect to subdomain
    const subdomainUrl = `http://${subdomain}.localhost:3000${callback || '/dashboard'}`;
    window.location.href = subdomainUrl;
  }
}
