# GitHub Issues for Production Readiness

The following issues should be created in the GitHub repository to track production readiness fixes. Copy each issue template below into a new GitHub issue.

---

## Issue 1: Critical Security - Fix Multi-Tenant Isolation

**Labels**: `🔴 critical`, `security`, `onboarding`, `bug`

**Title**: [CRITICAL] Fix multi-tenant security isolation in onboarding flow

**Description**:

### Problem
Multiple onboarding server actions lack proper multi-tenant isolation, allowing potential cross-tenant data access. Schools could potentially access other schools' data.

### Files Affected
- `src/components/onboarding/actions.ts` (lines 62, 89, 118, 223)
- `src/components/onboarding/title/actions.ts` (line 28)
- `src/components/onboarding/description/actions.ts` (line 36) 
- `src/components/onboarding/capacity/actions.ts` (line 22)
- `src/components/onboarding/location/actions.ts`
- `src/components/onboarding/branding/actions.ts`

### Current Code (VULNERABLE)
```typescript
const listing = await db.school.update({
  where: { id },
  // TODO: Add multi-tenant safety
  // schoolId: session.schoolId 
  data: { ...data, updatedAt: new Date() },
});
```

### Required Fix
```typescript
const listing = await db.school.update({
  where: { 
    id,
    schoolId: session.schoolId  // Ensure user can only access their school
  },
  data: { ...data, updatedAt: new Date() },
});
```

### Acceptance Criteria
- [ ] All database queries in onboarding actions include schoolId validation
- [ ] Remove all TODO comments about multi-tenant safety
- [ ] Add tests to verify tenant isolation
- [ ] Verify no cross-tenant data access is possible

### Priority
🔴 **CRITICAL** - Must be fixed before production deployment

---

## Issue 2: Remove Debug Endpoints from Production

**Labels**: `🔴 critical`, `security`, `api`, `bug`

**Title**: [CRITICAL] Remove or secure debug endpoints exposing sensitive data

**Description**:

### Problem
Multiple debug endpoints expose sensitive session and authentication data without proper access controls.

### Files Affected
- `src/app/api/debug-session/route.ts`
- `src/app/api/debug-subdomain/route.ts`
- `src/app/api/debug-subdomain-auth/route.ts`
- `src/app/api/test-oauth/route.ts`
- `src/app/api/test-subdomain/route.ts`

### Current Risk
- Session data exposed to unauthorized users
- Authentication bypass information revealed
- Internal system state leaked

### Required Action
**Option 1: Remove entirely** (Recommended)
- Delete all debug endpoint files
- Remove from routing

**Option 2: Secure with DEVELOPER role**
```typescript
const session = await auth();
if (!session?.user || session.user.role !== "DEVELOPER") {
  return new Response("Forbidden", { status: 403 });
}
```

### Acceptance Criteria
- [ ] All debug endpoints removed or secured
- [ ] No sensitive data exposed to unauthorized users
- [ ] Production build doesn't include debug routes

### Priority
🔴 **CRITICAL** - Information disclosure vulnerability

---

## Issue 3: Fix Unsafe Database Type Casting

**Labels**: `🔴 critical`, `security`, `api`, `bug`

**Title**: [CRITICAL] Remove unsafe database type casting that bypasses Prisma safety

**Description**:

### Problem
Unsafe type casting `(db as any)` bypasses Prisma's built-in type safety and could lead to runtime errors or security issues.

### Files Affected
- `src/app/api/students/[id]/route.ts:9`

### Current Code (UNSAFE)
```typescript
const student = await (db as any).student.findUnique({
  where: { id: params.id }
});
```

### Required Fix
```typescript
const student = await db.student.findUnique({
  where: { id: params.id }
});
```

### Root Cause
Likely missing Prisma model definition or import issue

### Acceptance Criteria
- [ ] Remove all `(db as any)` type casts
- [ ] Ensure proper Prisma model definitions
- [ ] Add proper error handling for database operations
- [ ] Verify type safety is maintained

### Priority
🔴 **CRITICAL** - Bypasses safety checks

---

## Issue 4: Implement API Rate Limiting

**Labels**: `🟠 high`, `security`, `api`, `enhancement`

**Title**: [HIGH] Add rate limiting to all API endpoints to prevent abuse

**Description**:

### Problem
No rate limiting is implemented on any API endpoints, making the application vulnerable to DoS attacks and API abuse.

### Impact
- Potential DoS attacks
- Resource exhaustion
- API abuse by malicious users
- Poor performance under high load

### Files Affected
All API routes in `src/app/api/`

### Required Implementation
1. **Install rate limiting library**
   ```bash
   pnpm add @upstash/ratelimit @upstash/redis
   ```

2. **Create rate limiting middleware**
   ```typescript
   // src/lib/rate-limit.ts
   import { Ratelimit } from "@upstash/ratelimit";
   import { Redis } from "@upstash/redis";
   
   export const ratelimit = new Ratelimit({
     redis: Redis.fromEnv(),
     limiter: Ratelimit.slidingWindow(10, "10 s"),
   });
   ```

3. **Apply to API routes**
   ```typescript
   const { success } = await ratelimit.limit(identifier);
   if (!success) {
     return new Response("Rate limit exceeded", { status: 429 });
   }
   ```

### Rate Limits Recommendation
- Auth endpoints: 5 requests per minute
- Onboarding actions: 10 requests per minute  
- General API: 100 requests per minute
- Admin endpoints: 50 requests per minute

### Acceptance Criteria
- [ ] Rate limiting implemented on all API routes
- [ ] Different limits for different endpoint types
- [ ] Proper error responses for rate limit exceeded
- [ ] Redis configuration for rate limiting storage
- [ ] Testing for rate limiting functionality

### Priority
🟠 **HIGH** - Security and stability concern

---

## Issue 5: Secure Environment Configuration

**Labels**: `🟠 high`, `config`, `security`, `bug`

**Title**: [HIGH] Make critical environment variables required for production

**Description**:

### Problem
Critical environment variables like `DATABASE_URL` and `AUTH_SECRET` are marked as optional, which could cause silent failures in production.

### Files Affected
- `src/env.mjs`

### Current Configuration Issues
```typescript
DATABASE_URL: z.string().url().optional(), // Should be required!
AUTH_SECRET: z.string().optional(),        // Should be required!
```

### Required Fix
```typescript
DATABASE_URL: z.string().url(),
AUTH_SECRET: z.string().min(32),
NEXTAUTH_URL: z.string().url(),
```

### Additional Requirements
1. **Create separate schemas for dev/prod**
2. **Add validation for production-critical vars**
3. **Document all required environment variables**

### Acceptance Criteria
- [ ] Critical environment variables are required
- [ ] Proper validation for each variable type
- [ ] Documentation of all required env vars
- [ ] Clear error messages for missing variables
- [ ] Separate dev/production environment schemas

### Priority
🟠 **HIGH** - Could cause production failures

---

## Issue 6: Complete Onboarding Feature Implementation

**Labels**: `🟡 medium`, `onboarding`, `feature`, `enhancement`

**Title**: [MEDIUM] Complete incomplete onboarding features or remove from flow

**Description**:

### Problem
Multiple onboarding steps have incomplete functionality marked with TODO comments, leading to broken user experience.

### Incomplete Features (from ISSUE.md)
- [ ] SEO preview in title step
- [ ] Maps API integration in location step
- [ ] Geocoding in location step
- [ ] CSV parsing in import step
- [ ] Column mapping in import step
- [ ] Data validation in import step
- [ ] Invitation code generation in join step
- [ ] Role management in join step
- [ ] Approval workflow in join step
- [ ] Directory settings in visibility step
- [ ] Preview mode in visibility step
- [ ] Payment schedule selection in price step
- [ ] Stripe integration in price step
- [ ] Custom discount creation
- [ ] Discount scheduling
- [ ] Terms acceptance in legal step
- [ ] Document upload in legal step

### Approach
**Phase 1: Critical Path Features**
- Complete CSV import functionality
- Implement Stripe integration for payments
- Add basic role management

**Phase 2: Enhancement Features**  
- Add maps integration
- Implement SEO preview
- Add advanced discount features

**Phase 3: Nice-to-Have Features**
- Directory settings
- Preview modes
- Advanced approval workflows

### Acceptance Criteria
- [ ] All critical path features completed
- [ ] Remove incomplete features from UI if not implemented
- [ ] Update ISSUE.md with completion status
- [ ] Add tests for completed features
- [ ] Update documentation

### Priority
🟡 **MEDIUM** - Impacts user experience but not security

---

## Issue 7: Implement Comprehensive Error Handling

**Labels**: `🟡 medium`, `dx`, `reliability`, `enhancement`

**Title**: [MEDIUM] Add consistent error handling across all server actions

**Description**:

### Problem
Server actions have inconsistent error handling, leading to poor user experience and potential information leakage through error messages.

### Files Affected
All files in `src/components/onboarding/*/actions.ts`

### Current Issues
- Inconsistent error response formats
- Generic error messages
- Potential information leakage
- No proper error logging
- Missing validation error handling

### Required Implementation

1. **Create error handling utilities**
   ```typescript
   // src/lib/error-handling.ts
   export class AppError extends Error {
     constructor(public message: string, public code: string, public status: number) {
       super(message);
     }
   }
   
   export function handleServerError(error: unknown) {
     // Standardized error handling
   }
   ```

2. **Standardize action responses**
   ```typescript
   interface ActionResponse<T> {
     success: boolean;
     data?: T;
     error?: string;
     code?: string;
   }
   ```

3. **Add proper validation**
   ```typescript
   try {
     const validatedData = schema.parse(data);
     // Process action
   } catch (error) {
     if (error instanceof z.ZodError) {
       return { success: false, error: "Validation failed", code: "VALIDATION_ERROR" };
     }
     // Handle other errors
   }
   ```

### Acceptance Criteria
- [ ] Consistent error response format across all actions
- [ ] Proper validation error handling
- [ ] No information leakage in error messages
- [ ] Error logging for debugging
- [ ] User-friendly error messages
- [ ] Proper HTTP status codes

### Priority
🟡 **MEDIUM** - Improves reliability and UX

---

## Issue 8: Add Health Check and Monitoring Endpoints

**Labels**: `🟡 medium`, `ops`, `monitoring`, `enhancement`

**Title**: [MEDIUM] Implement health check endpoints for production monitoring

**Description**:

### Problem
No health check endpoints exist for monitoring application status in production.

### Required Endpoints

1. **Basic Health Check** - `/api/health`
   ```typescript
   // Basic application health
   {
     status: "healthy",
     timestamp: "2025-08-25T10:00:00Z",
     uptime: 3600
   }
   ```

2. **Readiness Check** - `/api/ready`
   ```typescript
   // Database connectivity and dependencies
   {
     status: "ready",
     checks: {
       database: "healthy",
       auth: "healthy"
     }
   }
   ```

3. **Metrics Endpoint** - `/api/metrics` (optional)
   ```typescript
   // Application metrics for monitoring
   {
     activeUsers: 42,
     schoolsOnboarding: 5,
     avgResponseTime: 150
   }
   ```

### Implementation Requirements
- Check database connectivity
- Validate essential services
- Return appropriate HTTP status codes
- Include timing information
- Add basic application metrics

### Acceptance Criteria
- [ ] `/api/health` endpoint implemented
- [ ] `/api/ready` endpoint implemented  
- [ ] Proper HTTP status codes (200, 503)
- [ ] Database connectivity check
- [ ] Response time within 100ms
- [ ] Documentation for monitoring setup

### Priority
🟡 **MEDIUM** - Essential for production operations

---

## Issue 9: Remove Debug Logging from Production Code

**Labels**: `🟡 medium`, `performance`, `cleanup`, `bug`

**Title**: [MEDIUM] Clean up console.log statements and implement proper logging

**Description**:

### Problem
Extensive `console.log` statements throughout the codebase create performance issues and log noise in production.

### Files Affected (partial list)
- `src/auth.ts` - Multiple debug statements
- `src/middleware.ts` - Subdomain detection logging
- `src/components/onboarding/use-listing.tsx` - Context state logging
- Multiple action files with debug output

### Current Issues
- Performance degradation from excessive logging
- Log noise in production
- Potential information disclosure
- No structured logging format

### Required Implementation

1. **Remove debug console.log statements**
   ```typescript
   // Remove these
   console.log('🎯 Creating new listing with data:', data);
   console.log('✅ New listing created:', newListing.id);
   console.log('📥 Loading listing:', id);
   ```

2. **Implement proper logging**
   ```typescript
   // src/lib/logger.ts
   import winston from 'winston';
   
   export const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.Console({
         format: winston.format.simple()
       })
     ]
   });
   ```

3. **Use structured logging**
   ```typescript
   logger.info('School created', { 
     schoolId: school.id, 
     userId: session.user.id,
     timestamp: new Date().toISOString()
   });
   ```

### Logging Strategy
- **Development**: Debug level, console output
- **Production**: Info level, structured JSON
- **Error Tracking**: Integrate with Sentry or similar

### Acceptance Criteria
- [ ] Remove all console.log debug statements
- [ ] Implement structured logging library
- [ ] Configure different log levels for dev/prod
- [ ] Add essential business event logging
- [ ] Error logging with context information
- [ ] Performance impact assessment

### Priority
🟡 **MEDIUM** - Performance and maintainability

---

## Implementation Timeline

### Week 1 (Critical Issues)
- [ ] Issue 1: Fix multi-tenant isolation
- [ ] Issue 2: Remove debug endpoints  
- [ ] Issue 3: Fix unsafe type casting

### Week 2 (High Priority)
- [ ] Issue 4: Implement rate limiting
- [ ] Issue 5: Secure environment config
- [ ] Issue 7: Error handling improvements

### Week 3 (Medium Priority)
- [ ] Issue 6: Complete onboarding features
- [ ] Issue 8: Health check endpoints
- [ ] Issue 9: Remove debug logging

---

*These issues should be created in the GitHub repository and assigned to the development team for immediate action.*