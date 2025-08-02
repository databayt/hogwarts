# Authentication Module

## Overview
This authentication module is built on Next.js App Router with Auth.js (formerly NextAuth). It provides a comprehensive solution for user authentication including OAuth providers (Google, Facebook), email/password login, two-factor authentication, email verification, and password reset functionality.

## Features
- Multi-provider authentication (Credentials, Google, Facebook)
- JWT-based authentication with session management
- User role-based access control
- Two-factor authentication
- Email verification flow
- Password reset functionality
- Automatic redirection for protected routes

## Directory Structure
- `auth.ts` - Main Auth.js configuration and setup
- `auth.config.ts` - Provider configurations
- `middleware.ts` - Auth-based route protection
- `routes.ts` - Route definitions for authentication
- `src/components/auth/` - Auth components and utilities
  - `login/` - Login form and actions
  - `join/` - Registration form and actions
  - `reset/` - Password reset components
  - `password/` - Password management
  - `verification/` - Email verification
  - `error/` - Error handling components
  - `settings/` - User settings related to auth

## Environment Configuration
Required environment variables:
```
AUTH_SECRET=your_auth_secret

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

# Email
RESEND_API_KEY=

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage
### Protected Routes
Use the `auth()` function from your route handlers to protect routes:

```typescript
import { auth } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session) {
    // Handle unauthorized access
  }
  
  return <div>Protected Content</div>;
}
```

### Client Components
Use the provided hooks for client components:

```typescript
"use client";
import { useCurrentUser } from "@/components/auth/use-current-user";

export default function UserComponent() {
  const user = useCurrentUser();
  
  return <div>Hello, {user?.name}</div>;
}
```

### Role-Based Access
Use the `RoleGate` component for role-based permissions:

```typescript
import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";

<RoleGate allowedRole={UserRole.ADMIN}>
  <AdminPanel />
</RoleGate>
```

## Extending the Module
To extend this authentication module:
1. Update the `auth.config.ts` file to add new providers
2. Modify the `auth.ts` callbacks for custom logic
3. Add new components in the `src/components/auth/` directory
4. Update the database schema for additional user fields

## Troubleshooting
- Ensure all environment variables are properly set
- Check callback URLs in provider consoles match your application
- For Facebook OAuth specifically, verify the app domain and callback URLs are configured correctly

## Vercel Deployment Notes
When deploying to Vercel, ensure:

1. **Environment Variables**:
   - Set `NEXTAUTH_URL` to your production URL (`https://yourdomain.com`)
   - Configure all OAuth provider credentials in Vercel environment settings
   - Add `NODE_ENV=production` to environment variables

2. **Facebook OAuth Configuration**:
   - Callback URL in Facebook Developer Console must exactly match: `https://yourdomain.com/api/auth/callback/facebook`
   - App must be in "Live" mode, not "Development Mode"
   - "Facebook Login" product must be added to your app with proper permissions

3. **Build Configuration**:
   - Use the provided `next.config.js` with proper Prisma configuration
   - Make sure `vercel-build.js` is correctly set up to generate Prisma client
   - Verify your `schema.prisma` has `binaryTargets = ["native", "rhel-openssl-3.0.x"]`

4. **Error Handling**:
   - For debugging authentication issues, check `/api/auth/debug/facebook` endpoint
   - Review server logs in Vercel dashboard for detailed error information
   - Ensure API routes have proper error handling to provide useful error messages
