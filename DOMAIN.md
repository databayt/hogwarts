# DOMAIN.md - Subdomain Implementation for Production

This document traces the complete implementation of subdomain-based multi-tenancy in the Hogwarts School Management System, from development to production deployment.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Details](#implementation-details)
3. [Production Deployment](#production-deployment)
4. [DNS Configuration](#dns-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Testing & Validation](#testing--validation)
7. [Troubleshooting](#troubleshooting)
8. [Security Considerations](#security-considerations)

## Architecture Overview

### Multi-Tenant Design Pattern

The system implements a **subdomain-based multi-tenant architecture** where:

- **Root Domain**: `ed.databayt.org` (configurable via `NEXT_PUBLIC_ROOT_DOMAIN`)
- **Tenant Subdomains**: Each school gets a unique subdomain (e.g., `khartoum.databayt.org`)
- **Data Isolation**: All database operations are scoped by `schoolId`
- **Shared Infrastructure**: Single codebase, database, and deployment

### Request Flow Architecture

```
User Request → Middleware → Header Injection → Server Resolution → Database Query
     ↓              ↓            ↓              ↓              ↓
  khartoum.    Extract      x-subdomain    getTenantContext  WHERE schoolId = ?
  hogwarts.app subdomain    header         → schoolId        (tenant-scoped)
```

## Implementation Details

### 1. Middleware Implementation (`src/middleware.ts`)

The middleware handles subdomain extraction and header injection:

```typescript
// Subdomain → tenant mapping (attach x-subdomain header)
try {
  const host = nextUrl.hostname
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN // e.g. "hogwarts.app"
  
  // Dev convenience: /?x-school=<domain>
  const devDomainParam = nextUrl.searchParams.get("x-school")
  
  let subdomain: string | null = null
  if (devDomainParam) {
    subdomain = devDomainParam
  } else if (rootDomain && host.endsWith("." + rootDomain)) {
    subdomain = host.slice(0, -(rootDomain.length + 1)) || null
  }
  
  if (subdomain) {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-subdomain", subdomain)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
} catch {}
```

**Key Features:**
- **Development Mode**: Supports `?x-school=<domain>` for local testing
- **Production Mode**: Automatically extracts subdomain from hostname
- **Header Propagation**: Injects `x-subdomain` header for server-side resolution
- **Error Handling**: Graceful fallback if subdomain parsing fails

### 2. Tenant Context Resolution (`src/components/platform/operator/lib/tenant.ts`)

Server-side tenant resolution with fallback hierarchy:

```typescript
export async function getTenantContext(): Promise<TenantContext> {
  const session = await auth();
  const cookieStore = await cookies();
  const hdrs = await headers();
  
  // 1) Impersonation cookie overrides (operator/dev only)
  const impersonatedSchoolId = cookieStore.get("impersonate_schoolId")?.value ?? null;
  
  // 2) Header from middleware carries subdomain; resolve to schoolId
  let headerSchoolId: string | null = null;
  const subdomain = hdrs.get("x-subdomain");
  if (subdomain) {
    const school = await db.school.findUnique({ where: { domain: subdomain } });
    headerSchoolId = school?.id ?? null;
  }
  
  // 3) Fallback to session user's schoolId
  const schoolId = impersonatedSchoolId ?? headerSchoolId ?? session?.user?.schoolId ?? null;
  const role = (session?.user?.role as UserRole | undefined) ?? null;
  const isPlatformAdmin = role === "DEVELOPER";
  
  return { schoolId, requestId: null, role, isPlatformAdmin };
}
```

**Resolution Priority:**
1. **Impersonation Cookie** (highest priority - operator override)
2. **Subdomain Header** (from middleware)
3. **Session User** (fallback for direct access)
4. **Null** (no tenant context)

### 3. Database Schema (`prisma/models/school.prisma`)

Multi-tenant data model with proper isolation:

```prisma
model School {
  id        String   @id @default(cuid())
  name      String
  domain    String   @unique // e.g. "khartoum" for khartoum.hogwarts.app
  // ... other fields
}

model Student {
  id        String   @id @default(cuid())
  name      String
  schoolId  String   // Foreign key to School
  school    School   @relation(fields: [schoolId], references: [id])
  
  // Unique constraints scoped by schoolId
  @@unique([schoolId, emailAddress])
  @@unique([schoolId, studentId])
}
```

**Key Principles:**
- Every business table includes `schoolId` field
- Unique constraints are scoped by `schoolId`
- Foreign key relationships maintain referential integrity
- Data isolation is enforced at the database level

## Production Deployment

### 1. Vercel Deployment Configuration

#### Build Configuration (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during production builds
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

#### Build Scripts (`package.json`)

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Build Process:**
1. **Prisma Generation**: Creates Prisma client with proper binary targets
2. **Next.js Build**: Compiles application with tenant-aware middleware
3. **Post-install Hook**: Ensures Prisma client is available in production

### 2. Environment Variables

#### Production Environment (`env`)

```bash
# Multi-tenancy Configuration
NEXT_PUBLIC_ROOT_DOMAIN=hogwarts.app
DEFAULT_SCHOOL_DOMAIN=demo
ALLOW_SCHOOL_SIGNUP=true

# Database (Neon Postgres)
DATABASE_URL="postgresql://neondb_owner:...@ep-fancy-art-aemvq040-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://neondb_owner:...@ep-fancy-art-aemvq040-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Authentication
AUTH_SECRET=your_production_auth_secret
NEXTAUTH_URL=https://hogwarts.app

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# Email Service
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@hogwarts.app
```

#### Vercel Environment Variables

Set these in your Vercel project dashboard:

```bash
# Required for subdomain functionality
NEXT_PUBLIC_ROOT_DOMAIN=hogwarts.app

# Database
DATABASE_URL=your_neon_database_url
DIRECT_URL=your_neon_direct_url

# Authentication
AUTH_SECRET=your_production_auth_secret
NEXTAUTH_URL=https://hogwarts.app

# OAuth (update callback URLs for production)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
```

## DNS Configuration

### 1. Root Domain Setup

#### Primary Domain Configuration

```bash
# Root domain DNS records
hogwarts.app.          IN  A      76.76.19.36    # Vercel IP
www.hogwarts.app.      IN  CNAME  hogwarts.app.  # www redirect
```

#### Vercel Domain Configuration

1. **Add Custom Domain**: In Vercel dashboard, add `hogwarts.app`
2. **Verify Ownership**: Complete DNS verification
3. **Configure Redirects**: Set up www → non-www redirect

### 2. Subdomain Wildcard Configuration

#### Wildcard DNS Record

```bash
# Wildcard subdomain for dynamic tenant creation
*.hogwarts.app.        IN  CNAME  hogwarts.app.  # All subdomains point to root
```

**Benefits:**
- **Dynamic Creation**: New schools automatically get working subdomains
- **No Manual DNS**: No need to create individual DNS records per school
- **Scalability**: Supports unlimited number of schools

#### Alternative: Individual Subdomain Records

For production environments requiring explicit control:

```bash
# Individual school subdomains
khartoum.hogwarts.app. IN  CNAME  hogwarts.app.
omdurman.hogwarts.app. IN  CNAME  hogwarts.app.
portsudan.hogwarts.app. IN CNAME  hogwarts.app.
```

### 3. SSL/TLS Configuration

#### Automatic Certificate Generation

Vercel automatically provisions SSL certificates for:
- Root domain: `hogwarts.app`
- Wildcard subdomains: `*.hogwarts.app`
- Individual subdomains: `khartoum.hogwarts.app`

#### Certificate Validation

```bash
# Verify SSL certificates
openssl s_client -connect khartoum.hogwarts.app:443 -servername khartoum.hogwarts.app
openssl s_client -connect hogwarts.app:443 -servername hogwarts.app
```

## Environment Configuration

### 1. Development vs Production

#### Development Environment

```bash
# Local development with subdomain simulation
NEXT_PUBLIC_ROOT_DOMAIN=localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Test with URL parameters
http://localhost:3000/dashboard?x-school=khartoum
```

#### Production Environment

```bash
# Production subdomain routing
NEXT_PUBLIC_ROOT_DOMAIN=hogwarts.app
NEXT_PUBLIC_APP_URL=https://hogwarts.app

# Direct subdomain access
buthttps://khartoum.hogwarts.app/dashboard
```

### 2. Environment-Specific Features

#### Development Features

- **URL Parameter Override**: `?x-school=<domain>` for testing
- **Local Subdomains**: `khartoum.localhost:3000` (if configured)
- **Debug Endpoints**: `/operator/tenant-debug` for tenant verification

#### Production Features

- **Automatic Subdomain Routing**: Based on hostname
- **SSL Termination**: Automatic HTTPS for all subdomains
- **CDN Distribution**: Global edge network via Vercel

## Testing & Validation

### 1. Local Development Testing

#### URL Parameter Testing

```bash
# Test different schools locally
http://localhost:3000/dashboard?x-school=khartoum
http://localhost:3000/dashboard?x-school=omdurman
http://localhost:3000/dashboard?x-school=portsudan
```

#### Tenant Debug Page

Visit `/operator/tenant-debug` to verify:
- Current tenant context
- School-specific data counts
- Tenant switching functionality

### 2. Production Validation

#### Subdomain Access Testing

```bash
# Verify subdomain routing
https://khartoum.hogwarts.app/dashboard
https://omdurman.hogwarts.app/dashboard
https://portsudan.hogwarts.app/dashboard
```

#### Cross-Tenant Isolation Testing

1. **Login to School A**: `khartoum.hogwarts.app`
2. **Verify Data Isolation**: Only School A data visible
3. **Switch to School B**: `omdurman.hogwarts.app`
4. **Verify Data Isolation**: Only School B data visible

### 3. Automated Testing

#### Unit Tests

```typescript
// Test tenant context resolution
describe('getTenantContext', () => {
  it('should resolve subdomain from header', async () => {
    const headers = new Headers();
    headers.set('x-subdomain', 'khartoum');
    
    // Mock implementation and verify schoolId resolution
  });
});
```

#### Integration Tests

```typescript
// Test complete request flow
describe('Subdomain Middleware', () => {
  it('should inject x-subdomain header', async () => {
    const response = await fetch('https://khartoum.hogwarts.app/api/test');
    expect(response.headers.get('x-subdomain')).toBe('khartoum');
  });
});
```

## Troubleshooting

### 1. Common Issues

#### Subdomain Not Resolving

**Symptoms:**
- "No active tenant detected" error
- Data from wrong school showing
- 404 errors on subdomain routes

**Solutions:**
1. **Check DNS**: Verify wildcard DNS record exists
2. **Environment Variables**: Ensure `NEXT_PUBLIC_ROOT_DOMAIN` is set
3. **Database**: Verify school record exists with correct domain
4. **Middleware**: Check browser console for middleware errors

#### SSL Certificate Issues

**Symptoms:**
- Browser security warnings
- Mixed content errors
- Subdomain SSL failures

**Solutions:**
1. **Vercel Configuration**: Ensure domain is properly added to Vercel
2. **DNS Propagation**: Wait for DNS changes to propagate (up to 24 hours)
3. **Certificate Validation**: Check Vercel dashboard for certificate status

### 2. Debug Tools

#### Tenant Debug Endpoint

```bash
# Check current tenant context
GET /operator/tenant-debug

# Response includes:
{
  "schoolId": "school_123",
  "schoolName": "Khartoum School",
  "domain": "khartoum",
  "dataCounts": {
    "students": 150,
    "teachers": 25,
    "classes": 12
  }
}
```

#### Middleware Logging

```typescript
// Add logging to middleware for debugging
console.log('Hostname:', nextUrl.hostname);
console.log('Root Domain:', process.env.NEXT_PUBLIC_ROOT_DOMAIN);
console.log('Extracted Subdomain:', subdomain);
```

### 3. Performance Monitoring

#### Vercel Analytics

Monitor subdomain performance:
- **Page Load Times**: Per subdomain
- **Error Rates**: Identify tenant-specific issues
- **User Experience**: Core Web Vitals per school

#### Database Performance

Monitor tenant-specific queries:
```sql
-- Check query performance by school
SELECT 
  school.domain,
  COUNT(*) as query_count,
  AVG(execution_time) as avg_execution_time
FROM query_logs ql
JOIN schools school ON ql.school_id = school.id
GROUP BY school.domain;
```

## Security Considerations

### 1. Tenant Isolation

#### Data Access Control

```typescript
// Always scope queries by schoolId
export async function getStudents() {
  const { schoolId } = await getTenantContext();
  if (!schoolId) throw new Error("Missing tenant context");
  
  return db.student.findMany({ 
    where: { schoolId } // Critical: Always include schoolId
  });
}
```

#### Unique Constraints

```prisma
// Ensure uniqueness within tenant scope only
model Student {
  schoolId String
  email    String
  
  @@unique([schoolId, email]) // Same email allowed across schools
}
```

### 2. Authentication & Authorization

#### Session Security

```typescript
// JWT includes schoolId for tenant context
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.schoolId = user.schoolId;
    }
    return token;
  }
}
```

#### Role-Based Access Control

```typescript
// Verify user belongs to current tenant
export async function updateStudent(studentId: string, data: any) {
  const { schoolId, role } = await getTenantContext();
  
  // Verify student belongs to current school
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId }
  });
  
  if (!student) throw new Error("Student not found in current school");
  
  // Check role permissions
  if (role !== 'ADMIN' && role !== 'TEACHER') {
    throw new Error("Insufficient permissions");
  }
  
  return db.student.update({
    where: { id: studentId },
    data
  });
}
```

### 3. Network Security

#### HTTPS Enforcement

```typescript
// Middleware redirects HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production' && !nextUrl.protocol.includes('https')) {
  return NextResponse.redirect(
    `https://${nextUrl.host}${nextUrl.pathname}${nextUrl.search}`
  );
}
```

#### CORS Configuration

```typescript
// Restrict CORS to allowed domains
const allowedOrigins = [
  'https://hogwarts.app',
  'https://*.hogwarts.app', // Allow all subdomains
  'http://localhost:3000'   // Development only
];
```

## Deployment Checklist

### Pre-Deployment

- [ ] **DNS Configuration**: Wildcard subdomain record configured
- [ ] **Environment Variables**: All production variables set in Vercel
- [ ] **Database**: Production database migrated and seeded
- [ ] **SSL Certificates**: Domain verified in Vercel
- [ ] **OAuth Providers**: Callback URLs updated for production

### Deployment

- [ ] **Build Success**: Prisma client generated successfully
- [ ] **Middleware**: Subdomain extraction working
- [ ] **Database Connection**: Production database accessible
- [ ] **Authentication**: OAuth providers configured correctly

### Post-Deployment

- [ ] **Subdomain Testing**: All school subdomains accessible
- [ ] **Data Isolation**: Tenant data properly separated
- [ ] **SSL Verification**: HTTPS working on all subdomains
- [ ] **Performance**: Page load times acceptable
- [ ] **Monitoring**: Error tracking and analytics configured

## Conclusion

The subdomain implementation provides a robust, scalable foundation for multi-tenant school management. Key success factors include:

1. **Proper DNS Configuration**: Wildcard subdomain support
2. **Environment Management**: Clear separation of dev/prod configs
3. **Security Implementation**: Tenant isolation at all layers
4. **Monitoring & Debugging**: Tools for production troubleshooting
5. **Performance Optimization**: Efficient tenant context resolution

This architecture supports unlimited school tenants while maintaining data isolation and providing a seamless user experience across all subdomains.

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: Development Team  
**Documentation**: [Domain Guide](../src/app/docs/domain/page.mdx)
