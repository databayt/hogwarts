# School Onboarding Best Practices

## Overview
This document outlines the best practices implemented for the school management system's onboarding flow, ensuring users can create or edit schools seamlessly with proper authorization and data consistency.

## Architecture & Design Patterns

### 1. School Access Control (`/lib/school-access.ts`)
- **Single Source of Truth**: All school access logic centralized in one module
- **Role-Based Access Control (RBAC)**: Hierarchical permission system
- **Graceful Fallbacks**: Automatic school creation for new users
- **Orphaned School Recovery**: Allow claiming of unassigned schools

### 2. Session Management
- **Automatic School Association**: Users always have a school context
- **Session Synchronization**: School changes immediately reflected in session
- **Multi-School Support**: Users can switch between schools they have access to

### 3. Error Handling & Recovery
- **Comprehensive Logging**: Every operation logged with context
- **Automatic Recovery**: System attempts to fix issues automatically
- **User-Friendly Errors**: Clear messages with actionable solutions

## Implementation Details

### School Creation Flow
```typescript
1. User Authentication Check
   ↓
2. Check Existing School Association
   ↓
3. If No School: Create New School
   ↓
4. Link User to School
   ↓
5. Sync Session Context
   ↓
6. Redirect to Onboarding
```

### Access Validation Pattern
```typescript
// Every onboarding page validates access
async function validateAccess(userId, schoolId) {
  // 1. Check platform admin privileges
  // 2. Check user-school association
  // 3. Check orphaned school status
  // 4. Allow or create fallback
}
```

### Database Schema Best Practices
```prisma
model School {
  id          String   @id @default(cuid())
  users       User[]   // Many-to-one relationship
  // Soft delete for data integrity
  isActive    Boolean  @default(true)
  // Audit fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  schoolId  String?  // Nullable for initial creation
  school    School?  @relation(...)
  role      UserRole @default(ADMIN)
}
```

## Security Considerations

### 1. Authorization Checks
- **Every Action Validated**: No trust in client-side data
- **School ID Verification**: Prevent cross-tenant access
- **Role-Based Permissions**: Enforce minimum required role

### 2. Data Isolation
- **Tenant Scoping**: All queries filtered by schoolId
- **Subdomain Isolation**: Each school has unique subdomain
- **Session Validation**: Regular session integrity checks

### 3. Audit Trail
- **Activity Logging**: Track all school modifications
- **User Attribution**: Every change linked to user
- **Timestamp Tracking**: createdAt/updatedAt on all records

## Performance Optimizations

### 1. Caching Strategy
```typescript
// In-memory cache for frequently accessed data
const schoolCache = new MemoryCache(60); // 60 second TTL

// Database query optimization
const school = await db.school.findUnique({
  where: { id },
  select: { /* only required fields */ }
});
```

### 2. Reduced Session Callbacks
- **Conditional Logging**: Only in development mode
- **Debounced Updates**: Prevent rapid session refreshes
- **Optimized Queries**: Select only needed fields

### 3. Progressive Enhancement
- **Optimistic UI Updates**: Immediate feedback
- **Background Synchronization**: Non-blocking operations
- **Lazy Loading**: Load data as needed

## Error Recovery Strategies

### 1. School ID Mismatch
```typescript
// Automatically redirect to correct school
if (sessionSchoolId !== urlSchoolId) {
  // Check if user has access to urlSchoolId
  // If not, redirect to their default school
  redirect(`/onboarding/${sessionSchoolId}`);
}
```

### 2. Orphaned Schools
```typescript
// Allow claiming orphaned schools
const orphanedSchool = await findOrphanedSchool(schoolId);
if (orphanedSchool && userIsAuthenticated) {
  await assignSchoolToUser(userId, schoolId);
}
```

### 3. Session Sync Issues
```typescript
// Force session refresh on critical updates
await db.user.update({
  where: { id: userId },
  data: { updatedAt: new Date() } // Triggers session refresh
});
```

## Testing Checklist

### Unit Tests
- [ ] School creation for new user
- [ ] School access validation
- [ ] Role-based permissions
- [ ] Error handling paths

### Integration Tests
- [ ] Complete onboarding flow
- [ ] School switching
- [ ] Session synchronization
- [ ] Multi-tenant isolation

### End-to-End Tests
- [ ] New user registration → School creation
- [ ] Existing user → School editing
- [ ] Multiple schools → Switching context
- [ ] Error recovery → Automatic fixes

## Common Issues & Solutions

### Issue 1: "User has no school"
**Solution**: Automatically create school in `ensureUserSchool()`

### Issue 2: "School ID mismatch"
**Solution**: Validate and redirect in `validateSchoolOwnership()`

### Issue 3: "Session not updating"
**Solution**: Force refresh with `syncUserSchoolContext()`

### Issue 4: "Cross-tenant access"
**Solution**: Strict validation in `canUserAccessSchool()`

## Monitoring & Observability

### Key Metrics
- School creation success rate
- Onboarding completion rate
- Average time to complete onboarding
- Error frequency by type

### Logging Strategy
```typescript
console.log("🏫 [CONTEXT]", { /* structured data */ });
console.warn("⚠️ [WARNING]", { /* issue details */ });
console.error("❌ [ERROR]", { /* error context */ });
```

### Alerting Thresholds
- Failed school creations > 5/hour
- Session sync failures > 10/hour
- Cross-tenant attempts > 3/hour

## Deployment Considerations

### Environment Variables
```env
# Required for multi-tenant support
NEXT_PUBLIC_ROOT_DOMAIN=databayt.org

# Session configuration
SESSION_UPDATE_AGE=300 # 5 minutes in production
SESSION_MAX_AGE=86400 # 24 hours
```

### Database Migrations
```bash
# Always backup before migrations
pnpm prisma migrate dev --name add_school_context

# Verify data integrity
pnpm prisma studio
```

### Rollback Plan
1. Keep previous version tagged
2. Database migrations reversible
3. Feature flags for gradual rollout
4. Monitor error rates post-deployment

## Future Enhancements

### Planned Improvements
1. **Batch School Operations**: Create multiple schools at once
2. **School Templates**: Pre-configured school types
3. **Invitation System**: Invite users to existing schools
4. **School Merging**: Combine duplicate schools
5. **Audit Log UI**: Visual activity timeline

### Technical Debt
1. Move from console.log to structured logging service
2. Implement distributed tracing for debugging
3. Add rate limiting on school creation
4. Optimize database indexes for school queries

## Resources

- [Next.js App Router Best Practices](https://nextjs.org/docs/app)
- [Prisma Multi-Tenancy Guide](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [NextAuth.js Session Management](https://next-auth.js.org/configuration/options#session)
- [OWASP Multi-Tenancy Security](https://owasp.org/www-project-top-ten/)

---

Last Updated: 2025-09-10
Version: 2.0.0