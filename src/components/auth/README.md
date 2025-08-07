# Authentication Module

## Overview
This authentication module is built on Next.js App Router with Auth.js (formerly NextAuth). It provides a comprehensive solution for user authentication including OAuth providers (Google, Facebook), email/password login, two-factor authentication, email verification, and password reset functionality.

## Features
- Multi-provider authentication (Credentials, Google, Facebook)
- JWT-based authentication with session management
- User role-based access control (DEVELOPER, ADMIN, TEACHER, STUDENT, GUARDIAN, etc.)
- Two-factor authentication
- Email verification flow
- Password reset functionality
- Automatic redirection for protected routes
- Multi-tenant user support with school isolation
- Elegant public route handling for documentation

## Current Directory Structure

### Core Authentication Files
- `src/auth.ts` - Main Auth.js configuration with callbacks and session management
- `src/auth.config.ts` - Provider configurations (Google, Facebook, Credentials)
- `src/middleware.ts` - Auth-based route protection with smart public route handling
- `src/routes.ts` - Route definitions for authentication and public access
- `src/next-auth.d.ts` - TypeScript declarations for extended user types

### Authentication Components (`src/components/auth/`)
- `user.ts` - User database queries with multi-tenant support
- `user-info.tsx` - User information display component
- `user-button.tsx` - User dropdown/menu button
- `social.tsx` - OAuth provider login buttons
- `logout-button.tsx` - Logout functionality
- `login-button.tsx` - Login trigger button
- `role-gate.tsx` - Role-based access control component
- `card-wrapper.tsx` - Authentication form wrapper
- `header.tsx` - Authentication form headers
- `back-button.tsx` - Navigation back button
- `form-error.tsx` - Error message display
- `form-success.tsx` - Success message display
- `validation.ts` - Zod schemas for form validation
- `tokens.ts` - Token generation and management
- `mail.ts` - Email sending functionality
- `auth.ts` - Auth utility functions
- `account.ts` - Account management utilities
- `admin-action.ts` - Admin-specific actions
- `use-current-user.ts` - Hook for current user data
- `use-current-role.ts` - Hook for current user role

### Authentication Feature Directories
- `login/` - Login form and server actions
- `join/` - User registration form and actions
- `reset/` - Password reset request components
- `password/` - Password management and reset
- `verification/` - Email verification and 2FA
- `error/` - Error handling components
- `setting/` - User settings and profile management

### Authentication Route Pages (`src/app/(auth)/`)
- `login/` - Login page
- `join/` - Registration page
- `reset/` - Password reset page
- `new-password/` - New password setup page
- `new-verification/` - Email verification page
- `error/` - Authentication error page
- `layout.tsx` - Auth pages layout

### API Routes (`src/app/api/`)
- `auth/` - NextAuth.js API routes
- `admin/` - Admin-specific API endpoints

## Route Protection Strategy

### Public Routes
The root `/docs` route is explicitly listed in publicRoutes, and any route that starts with `/docs/` will automatically be public thanks to the `pathname.startsWith("/docs/")` check in the middleware. This covers all current and future docs routes without needing to list them individually. It's more maintainable since you don't need to update routes.ts when adding new docs pages. This is a more elegant solution that ensures all documentation routes are public by default.

### Protected Routes
- Platform routes (`/dashboard`, `/project`, `/task`, etc.) require authentication
- Role-based access control through `RoleGate` component
- Automatic redirect to login with callback URL preservation

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
import { auth } from "@/auth";

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

## Multi-Tenant Architecture

### User Model Features
- **School Isolation**: Users are associated with specific schools via `schoolId`
- **Compound Unique Constraint**: Same email can exist across different schools
- **Role-Based Access**: DEVELOPER, ADMIN, TEACHER, STUDENT, GUARDIAN, ACCOUNTANT, STAFF, USER
- **OAuth Support**: Google and Facebook integration with automatic email verification

### Database Queries
- `getUserByEmail()` uses `findFirst()` to handle multi-tenant email uniqueness
- `getUserById()` for secure user lookups by ID
- Account linking for OAuth providers

## Extending the Module
To extend this authentication module:
1. Update the `auth.config.ts` file to add new providers
2. Modify the `auth.ts` callbacks for custom logic
3. Add new components in the `src/components/auth/` directory
4. Update the database schema for additional user fields
5. Extend the middleware for new route protection patterns

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
