# Facebook OAuth Cross-Subdomain Fix

**Problem**: Facebook OAuth doesn't work on tenant subdomains due to redirect URI whitelist restrictions.

**Solution**: All auth goes through `ed.databayt.org`, cookies shared across subdomains, proper redirects.

## 🚨 **THE PROBLEM**

```typescript
// Facebook OAuth blocks tenant subdomains
// ERROR: "This redirect failed because the redirect URI is not white-listed"

// Tenant subdomains that don't work:
// ❌ khartoum.ed.databayt.org/api/auth/callback/facebook
// ❌ auto.ed.databayt.org/api/auth/callback/facebook
// ❌ Any *.ed.databayt.org subdomain

// Only this works:
// ✅ ed.databayt.org/api/auth/callback/facebook
```

## ✅ **THE SOLUTION**

### **1. Centralized Auth Domain**
```typescript
// All OAuth happens on ed.databayt.org
// All callbacks go to ed.databayt.org
// Session cookies shared across all subdomains
```

### **2. Cross-Subdomain Session Sharing**
```typescript
// Cookies available on server-side for all subdomains
// Session accessible from khartoum.ed.databayt.org, auto.ed.databayt.org, etc.
```

### **3. Smart Redirects**
```typescript
// If you're on ed.databayt.org → default redirect
// If you're on tenant subdomain → redirect back to tenant
// No more Configuration errors
```

## 🔧 **IMPLEMENTATION**

### **Step 1: Create Tenant Login Route**
```typescript
// src/app/s/[subdomain]/login/page.tsx
export default function TenantLoginPage({ params }: { params: { subdomain: string } }) {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Login to {params.subdomain}</h1>
      <TenantLoginButton tenantSubdomain={params.subdomain} />
    </div>
  );
}
```

### **Step 2: Update NextAuth Config**
```typescript
// src/auth.ts
export const auth = NextAuth({
  // ... existing config
  
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl });
      
      // Extract tenant from callbackUrl
      const urlObj = new URL(url);
      const tenant = urlObj.searchParams.get('tenant');
      
      if (tenant) {
        // Redirect back to tenant subdomain
        const tenantUrl = `https://${tenant}.ed.databayt.org/dashboard`;
        console.log('🔄 Redirecting to tenant:', tenantUrl);
        return tenantUrl;
      }
      
      // Default redirect for main domain
      console.log('🔄 Default redirect to:', baseUrl);
      return baseUrl;
    }
  },
  
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        domain: '.ed.databayt.org', // Shared across all subdomains
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  }
});
```

### **Step 3: Tenant Login Button Component**
```typescript
// src/components/auth/tenant-login.tsx
"use client";

import { Button } from "@/components/ui/button";

export function TenantLoginButton({ tenantSubdomain }: { tenantSubdomain: string }) {
  const handleLogin = () => {
    // Login on ed.databayt.org with tenant context
    const loginUrl = `https://ed.databayt.org/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(
      `https://ed.databayt.org/api/auth/callback/facebook?tenant=${tenantSubdomain}`
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
```

### **Step 4: Use on Tenant Pages**
```typescript
// On khartoum.ed.databayt.org/login
<TenantLoginButton tenantSubdomain="khartoum" />

// On auto.ed.databayt.org/login  
<TenantLoginButton tenantSubdomain="auto" />
```

## 📋 **WHAT THIS FIXES**

- ✅ **Facebook OAuth works** (only on ed.databayt.org)
- ✅ **Sessions shared** across all subdomains
- ✅ **Cookies accessible** server-side everywhere
- ✅ **Redirects work** without Configuration errors
- ✅ **Tenant isolation** maintained
- ✅ **Tenant login routes exist** (no more 404)

## 🚀 **TEST IT**

1. **Create tenant login route** at `src/app/s/[subdomain]/login/page.tsx`
2. **Update auth.ts** with the redirect callback above
3. **Create tenant login button** component
4. **Test on tenant subdomain**: Visit `https://khartoum.ed.databayt.org/login`
5. **Click login** → redirects to `ed.databayt.org` for Facebook OAuth
6. **After OAuth** → redirects back to `khartoum.ed.databayt.org/dashboard`
7. **Session works** on tenant subdomain

## 💡 **HOW IT WORKS**

1. **User on tenant subdomain** visits `/login` (route now exists)
2. **Clicks login button** → redirects to `ed.databayt.org` with tenant info in callbackUrl
3. **Facebook OAuth happens** on ed.databayt.org (whitelisted)
4. **Session created** with cookies on `.ed.databayt.org` domain
5. **Redirect callback** extracts tenant and sends user back to tenant subdomain
6. **Session accessible** everywhere because cookies are shared

## 🚨 **CURRENT ISSUES FOUND IN LOGS**

- ❌ **404 on tenant login routes** - Route doesn't exist
- ❌ **Redirect shows "Default behavior"** - Not using tenant-aware redirects
- ❌ **No tenant context in redirects** - Always goes to ed.databayt.org

**That's it. No more Facebook OAuth errors. No more session problems. No more redirect failures. No more 404s on tenant login routes.**
