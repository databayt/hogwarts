# Onboarding Block - Production Readiness Tracker

## 🚨 Critical Issues for Production

### P0 - Blockers (Must fix before production)

#### 1. Debug Logging in Production Code

- **Issue**: Extensive console.log statements throughout actions.ts
- **Files**: `src/components/onboarding/actions.ts` (lines 123-237)
- **Impact**: Performance degradation, potential security info leakage
- **Fix**: Remove all debug console.log statements or wrap in development-only conditions

```typescript
// Replace with:
if (process.env.NODE_ENV === 'development') {
  console.log(...);
}
```

#### 2. Authentication Fallback Logic ✅ RESOLVED

- **Issue**: Complex try-catch fallback in `getListing()` suggests auth flow issues
- **Files**: `src/components/onboarding/actions.ts`, `src/lib/school-access.ts`
- **Impact**: ~~Potential security vulnerability, unreliable auth state~~
- **Fix**: Implemented atomic transactions with Prisma `$transaction` in `school-access.ts`
  - School creation and user linking now happen atomically
  - Race conditions handled with idempotent responses
  - Session refresh triggers ensure immediate schoolId access
  - Fallback logic deprecated (logged as warning for monitoring)

#### 3. Missing Error Boundaries

- **Issue**: Some steps lack proper error handling for failed data fetches
- **Impact**: White screen of death on errors
- **Fix**: Wrap all step components with ErrorBoundary

### P1 - High Priority (Should fix before production)

#### 1. External Service Integrations

##### Maps API Integration

- **Status**: Not implemented
- **Steps Affected**: Location
- **Required Actions**:
  - [ ] Integrate Google Maps or Mapbox API
  - [ ] Implement geocoding for addresses
  - [ ] Add location picker component
  - [ ] Store latitude/longitude in database

##### Payment Processing (Stripe)

- **Status**: Not implemented
- **Steps Affected**: Price, Discount
- **Required Actions**:
  - [ ] Set up Stripe Connect for schools
  - [ ] Implement subscription billing
  - [ ] Add payment method collection
  - [ ] Create invoice generation system

##### File Upload Service

- **Status**: Partially implemented
- **Steps Affected**: Import, Branding (logo)
- **Required Actions**:
  - [ ] Complete CSV/Excel parser for Import step
  - [ ] Add file size validation
  - [ ] Implement virus scanning
  - [ ] Set up CDN for uploaded files

#### 2. Data Import Parser

- **Status**: UI complete, parser missing
- **Files**: `src/components/onboarding/import/`
- **Required Actions**:
  - [ ] Implement CSV parsing logic
  - [ ] Add Excel file support
  - [ ] Create column mapping interface
  - [ ] Add data validation and sanitization
  - [ ] Implement batch import with progress tracking

#### 3. DNS Configuration for Subdomains

- **Status**: Form complete, DNS setup missing
- **Files**: `src/components/onboarding/subdomain/`
- **Required Actions**:
  - [ ] Integrate with DNS provider (Cloudflare/Route53)
  - [ ] Implement subdomain availability checking
  - [ ] Add SSL certificate provisioning
  - [ ] Create subdomain verification process

### P2 - Medium Priority (Nice to have for production)

#### 1. Invitation & Role Management

- **Status**: Basic implementation
- **Steps Affected**: Join
- **Required Actions**:
  - [ ] Generate unique invitation codes
  - [ ] Implement role-based access control
  - [ ] Add approval workflow for teachers/staff
  - [ ] Create invitation email templates

#### 2. Legal Document Management

- **Status**: UI complete, documents missing
- **Steps Affected**: Legal
- **Required Actions**:
  - [ ] Add terms of service template
  - [ ] Add privacy policy template
  - [ ] Implement version control for legal docs
  - [ ] Add consent tracking with timestamps

#### 3. Performance Optimizations

- [ ] Implement step data caching
- [ ] Add optimistic UI updates
- [ ] Reduce bundle size with dynamic imports
- [ ] Add prefetching for next steps
- [ ] Implement virtual scrolling for large lists

### P3 - Low Priority (Post-launch improvements)

#### 1. Enhanced Features

- [ ] Multi-language support
- [ ] Bulk operations for admin
- [ ] Advanced analytics dashboard
- [ ] A/B testing framework
- [ ] Customizable onboarding flows

#### 2. Testing Coverage

- [ ] Unit tests for all validation schemas
- [ ] Integration tests for server actions
- [ ] E2E tests for critical paths
- [ ] Performance testing
- [ ] Security penetration testing

## 📊 Production Readiness Checklist

### Core Functionality

- [x] All steps have UI components
- [x] Form validation implemented
- [x] Server actions configured
- [x] Database models created
- [x] Navigation flow working
- [ ] All external services integrated
- [ ] Error recovery mechanisms
- [ ] Data persistence across sessions

### Security

- [ ] Remove all debug logging
- [ ] Input sanitization complete
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented
- [ ] SQL injection prevention
- [ ] XSS protection
- [x] Authentication properly secured (atomic transactions, session sync)

### Performance

- [ ] Page load time < 3s
- [ ] Time to interactive < 5s
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching strategy defined

### Monitoring

- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] Performance monitoring
- [ ] User session recording
- [ ] Conversion funnel tracking

### Documentation

- [x] README.md updated
- [x] ISSUE.md created
- [ ] API documentation
- [ ] User guide created
- [ ] Admin documentation
- [ ] Deployment guide

## 🔄 Recent Updates (December 2024)

### Completed

- ✅ Updated README.md with current architecture
- ✅ All UI components implemented
- ✅ Form validation with Zod schemas
- ✅ Server actions with auth
- ✅ Database schema defined
- ✅ **Legacy code cleanup** (December 6, 2024):
  - Removed `action.ts` (superseded by `actions.ts`)
  - Removed `use-optimized-listing.tsx` (unused)
  - Removed `enums.ts` (Airbnb/rental legacy)
  - Removed `host-refactor-plan.md` (old planning doc)
  - Cleaned up legacy types in `types.ts`

### In Progress

- 🔄 External service integrations
- 🔄 Testing implementation

### Recently Completed (December 6, 2024)

- ✅ **Production-ready atomic school-user linking**
  - Implemented Prisma `$transaction` for atomic operations
  - Added `createdByUserId` field for owner tracking
  - Race condition handling with idempotent responses
  - Session refresh triggers for immediate schoolId access
  - New API endpoint: `/api/onboarding/create-school`

### Blocked

- ❌ Maps API (waiting for API key)
- ❌ Stripe integration (waiting for account setup)
- ❌ DNS provider (waiting for decision)

---

## ✅ External Dependencies Investigation (COMPLETED)

**Status**: RESOLVED (December 6, 2024)

Investigation results:

| File                         | Usage                      | Action Taken                             |
| ---------------------------- | -------------------------- | ---------------------------------------- |
| `onboarding-auth.ts`         | Only used by `actions.ts`  | Moved to `components/onboarding/auth.ts` |
| `onboarding-optimization.ts` | Never imported (dead code) | Deleted                                  |
| `onboarding.config.ts`       | Never imported (dead code) | Deleted                                  |

**Result**: Onboarding system is now **100% consolidated** into two directories:

- `src/app/[lang]/onboarding/` (routes)
- `src/components/onboarding/` (components)

---

## 🧹 Technical Debt Backlog

### Configuration Consolidation

- [ ] **HOSTING_STEPS defined in 3 locations**: `host-footer.tsx`, `config.client.ts`, `config.ts`
  - Consolidate to single source of truth in `config.ts`
  - Make `STEP_GROUPS` a derived utility
  - Remove hardcoded arrays from `host-footer.tsx`

### Naming Consistency

- [ ] **Action file naming inconsistency**: Some subdirectories use `action.ts`, others use `actions.ts`
  - Standardize to `actions.ts` (plural) across all steps

## 🎯 Sprint Planning

### Current Sprint (Week 1-2)

1. Remove all debug logging
2. Fix authentication fallback
3. Implement error boundaries
4. Begin Maps API integration

### Next Sprint (Week 3-4)

1. Complete Maps integration
2. Start Stripe integration
3. Implement CSV parser
4. Add invitation system

### Future Sprints

- Legal document templates
- DNS configuration
- Performance optimizations
- Testing suite

## 📝 Notes

- The UI is production-ready and should remain unchanged
- Focus on backend integrations and data processing
- Prioritize security fixes before feature additions
- Consider gradual rollout with feature flags

---

## 🔐 Authentication Integration

### Current Flow

```
Marketing Page → Get Started → OAuth/Credentials → User Created (no schoolId)
       ↓
Redirect to /onboarding → initializeSchoolSetup()
       ↓
School Created + User.schoolId Linked + User.role = ADMIN
       ↓
Complete 16 Steps → Subdomain Setup → Smart Redirect to school.databayt.org
```

### Key Integration Points

| Step                    | Auth Action                | Notes                                 |
| ----------------------- | -------------------------- | ------------------------------------- |
| Get Started             | Triggers auth flow         | User must login/register first        |
| initializeSchoolSetup() | Creates school, links user | Sets user.schoolId, user.role = ADMIN |
| Subdomain Step          | Sets school.domain         | Enables school.databayt.org routing   |
| Congratulations         | Redirects to subdomain     | Smart redirect in auth.ts             |

### Authentication Requirements

1. **All onboarding actions require authentication** via `getAuthContext()`
2. **School ownership verified** via `requireSchoolOwnership()`
3. **schoolId linked** at initializeSchoolSetup() step
4. **Role set to ADMIN** for school creator

### User Registration Options (Post-Onboarding)

After school setup, admins can add users via:

| Option                  | Status          | Notes                                 |
| ----------------------- | --------------- | ------------------------------------- |
| OAuth Self-Registration | Available       | Students/teachers use Google/Facebook |
| Credentials (Bulk)      | Not Implemented | CSV import with role assignment       |
| Invitation Links        | Not Implemented | Pre-assigned roles                    |
| School Join Codes       | Not Implemented | Simple codes like "HOGWARTS-2024"     |

### Related Auth Issues

See [Authentication ISSUE.md](/src/components/auth/ISSUE.md) for:

- **P0**: New OAuth users lack school context initially
- **P1**: Missing invitation system for member onboarding
- **P1**: Missing bulk user creation for school admins
- **P1**: Missing school join codes

---

## 🚀 Launch Criteria

Minimum requirements for production launch:

1. All P0 issues resolved
2. At least 50% of P1 issues resolved
3. Security checklist complete
4. Performance targets met
5. Error tracking configured
6. Backup and recovery tested

---

**Last Updated**: December 6, 2024
**Assigned Team**: Platform Engineering
**Target Launch**: Q1 2025
