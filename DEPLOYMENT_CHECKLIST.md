# Deployment Checklist for School Management System

## Pre-Deployment Verification

### ✅ TypeScript & Build
- [x] All TypeScript errors resolved (except test files)
- [x] Production build completes successfully: `pnpm build`
- [x] No critical warnings in build output

### ✅ Onboarding Optimization
- [x] Session callbacks optimized to reduce logging in production
- [x] Rate limiting implemented for API calls
- [x] Caching layer added for frequently accessed data
- [x] Debouncing implemented for form inputs

## Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=your_neon_database_url

# Authentication
AUTH_SECRET=your_auth_secret
NEXTAUTH_URL=https://ed.databayt.org

# OAuth Providers (optional but recommended)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# Domain Configuration
NEXT_PUBLIC_ROOT_DOMAIN=databayt.org
```

### Production Settings
1. **Session Configuration**
   - Session update interval: 5 minutes (reduced from 1 hour)
   - Session max age: 24 hours
   - JWT strategy enabled

2. **Cookie Configuration**
   - Domain: `.databayt.org` (for subdomain support)
   - Secure: true (HTTPS only)
   - SameSite: lax

3. **Performance Optimizations**
   - API rate limiting: 500ms minimum between calls
   - Response caching: 60-300 seconds based on data type
   - Debounced inputs: 500ms delay
   - Retry logic: 3 attempts with exponential backoff

## Deployment Steps

### 1. Database Migration
```bash
# Run migrations in production
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

### 2. Build & Deploy
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build the application
pnpm build

# Start production server
pnpm start
```

### 3. Post-Deployment Verification

#### Onboarding Flow
- [ ] Test creating a new school
- [ ] Verify subdomain reservation works
- [ ] Complete full onboarding process
- [ ] Verify session persistence across steps

#### Performance Checks
- [ ] No excessive session callbacks in logs
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] No memory leaks during extended use

#### Multi-Tenant Functionality
- [ ] Subdomain routing works correctly
- [ ] School isolation is maintained
- [ ] Cross-tenant access is properly blocked

## Monitoring Setup

### Recommended Monitoring
1. **Application Performance**
   - Track API response times
   - Monitor session callback frequency
   - Watch for error rates

2. **Database Performance**
   - Query execution times
   - Connection pool usage
   - Slow query logging

3. **User Experience**
   - Onboarding completion rates
   - Error frequency by step
   - Time to complete onboarding

## Troubleshooting Guide

### Common Issues & Solutions

#### 1. Excessive Session Callbacks
**Symptom**: Multiple session validations per second in logs
**Solution**: 
- Check `updateAge` setting in auth.ts
- Verify caching is enabled
- Use OptimizedListingProvider instead of regular ListingProvider

#### 2. Slow Onboarding Performance
**Symptom**: Pages taking > 3 seconds to load
**Solution**:
- Enable production caching
- Check database query performance
- Verify CDN is configured for static assets

#### 3. Session Loss Between Steps
**Symptom**: Users logged out during onboarding
**Solution**:
- Verify cookie domain settings
- Check session maxAge configuration
- Ensure AUTH_SECRET is set correctly

## Rollback Plan

If issues occur after deployment:

1. **Quick Rollback**
   ```bash
   # Revert to previous deployment
   git checkout [previous-version-tag]
   pnpm install --frozen-lockfile
   pnpm build
   pnpm start
   ```

2. **Database Rollback** (if schema changed)
   ```bash
   pnpm prisma migrate reset --skip-seed
   pnpm prisma migrate deploy
   ```

3. **Cache Clearing**
   - Clear CDN cache
   - Reset Redis/memory caches
   - Clear browser caches for affected users

## Security Checklist

- [ ] All debug logging disabled in production
- [ ] Environment variables properly secured
- [ ] HTTPS enforced on all routes
- [ ] Rate limiting enabled on API endpoints
- [ ] SQL injection prevention verified
- [ ] XSS protection headers configured
- [ ] CSRF tokens properly implemented

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **API Response Time**: < 500ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Session Callback Frequency**: < 1 per minute per user

## Contact Information

For deployment issues, contact:
- Technical Lead: [Your contact]
- DevOps Team: [Team contact]
- On-call Engineer: [On-call contact]

---

Last Updated: 2025-09-10
Version: 1.0.0