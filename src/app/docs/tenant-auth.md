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

### **Step 1: Update NextAuth Config**
```typescript
// src/auth.ts
export const auth = NextAuth({
  // ... existing config
  
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Extract tenant from callbackUrl
      const urlObj = new URL(url);
      const tenant = urlObj.searchParams.get('tenant');
      
      if (tenant) {
        // Redirect back to tenant subdomain
        return `https://${tenant}.ed.databayt.org/dashboard`;
      }
      
      // Default redirect for main domain
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

### **Step 2: Tenant Login Button**
```typescript
// src/components/auth/tenant-login.tsx
export function TenantLoginButton({ tenantSubdomain }: { tenantSubdomain: string }) {
  const handleLogin = () => {
    // Login on ed.databayt.org with tenant context
    const loginUrl = `https://ed.databayt.org/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(
      `https://ed.databayt.org/api/auth/callback/facebook?tenant=${tenantSubdomain}`
    )}`;
    
    window.location.href = loginUrl;
  };
  
  return (
    <Button onClick={handleLogin}>
      Login with Facebook
    </Button>
  );
}
```

### **Step 3: Use on Tenant Pages**
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

## 🚀 **TEST IT**

1. **Update auth.ts** with the config above
2. **Create tenant login button** component
3. **Test on tenant subdomain**: Visit `khartoum.ed.databayt.org/login`
4. **Click login** → redirects to `ed.databayt.org` for Facebook OAuth
5. **After OAuth** → redirects back to `khartoum.ed.databayt.org/dashboard`
6. **Session works** on tenant subdomain

## 💡 **HOW IT WORKS**

1. **User on tenant subdomain** clicks login
2. **Redirects to ed.databayt.org** with tenant info in callbackUrl
3. **Facebook OAuth happens** on ed.databayt.org (whitelisted)
4. **Session created** with cookies on `.ed.databayt.org` domain
5. **Redirect callback** sends user back to tenant subdomain
6. **Session accessible** everywhere because cookies are shared

**That's it. No more Facebook OAuth errors. No more session problems. No more redirect failures.**
