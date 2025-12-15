# Deployment Guide: Geo Real-Time Attendance System

**Target Environment**: Vercel + Neon PostgreSQL
**Deployment Strategy**: Gradual rollout with feature flags
**Rollback Time**: < 5 minutes

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedure](#rollback-procedure)
- [Monitoring Setup](#monitoring-setup)

---

## Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing (unit, integration, E2E)
  ```bash
  pnpm test
  pnpm test:e2e
  ```
- [ ] Test coverage ≥ 80%
  ```bash
  pnpm test --coverage
  ```
- [ ] No TypeScript errors
  ```bash
  pnpm build
  ```
- [ ] ESLint passes
  ```bash
  pnpm lint
  ```
- [ ] Code reviewed and approved (GitHub PR)
- [ ] PDR.md approved by stakeholders

### Database Readiness

- [ ] PostGIS extension verified on Neon
  ```sql
  SELECT PostGIS_version();
  -- Expected: 3.4.0 or higher
  ```
- [ ] Prisma migrations generated
  ```bash
  pnpm prisma migrate dev --name add-geo-attendance
  ```
- [ ] Migration tested on staging database
- [ ] Database backup created (automatic on Neon)
- [ ] Spatial indexes performance tested
  ```sql
  EXPLAIN ANALYZE SELECT * FROM geo_fences WHERE ...;
  ```

### Infrastructure Readiness

- [ ] Dependencies installed and lockfile updated
  ```bash
  pnpm install
  git add pnpm-lock.yaml
  git commit -m "chore: update lockfile for geofence dependencies"
  ```
- [ ] Environment variables configured (Vercel)
- [ ] Cron job scheduled (Vercel Cron)
- [ ] Rate limiting configured
- [ ] Sentry error tracking enabled

### Security Readiness

- [ ] Input validation schemas reviewed (Zod)
- [ ] Authentication middleware verified
- [ ] schoolId scoping verified on all queries
- [ ] Rate limiting tested (20 req/10s)
- [ ] HTTPS enforced (required for Geolocation API)

---

## Environment Setup

### 1. Neon PostgreSQL Configuration

#### Enable PostGIS Extension

1. Login to Neon Console: https://console.neon.tech
2. Select your project → Database
3. Open SQL Editor
4. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   SELECT PostGIS_version(); -- Verify installation
   ```

#### Connection String

**Format**:

```
DATABASE_URL="postgresql://<user>:<password>@<host>.neon.tech/<database>?sslmode=require"
```

**Example**:

```
DATABASE_URL="postgresql://hogwarts_user:abc123@ep-cool-mountain-123456.us-east-2.aws.neon.tech/hogwarts?sslmode=require"
```

**Pooling** (optional for serverless):

```
DATABASE_POOLING_URL="postgresql://<user>:<password>@<host>-pooler.neon.tech/<database>?sslmode=require"
```

### 2. Vercel Environment Variables

Navigate to: **Vercel Dashboard → Project → Settings → Environment Variables**

| Variable                       | Value                                   | Environment                      |
| ------------------------------ | --------------------------------------- | -------------------------------- |
| `DATABASE_URL`                 | `postgresql://...`                      | Production, Preview, Development |
| `CRON_SECRET`                  | Generate with `openssl rand -base64 32` | Production only                  |
| `NEXT_PUBLIC_GEOFENCE_ENABLED` | `false` (initially)                     | Production                       |
| `NODE_ENV`                     | `production`                            | Production                       |

**Feature Flag**: Set `NEXT_PUBLIC_GEOFENCE_ENABLED=false` initially for gradual rollout.

### 3. Vercel Cron Configuration

**File**: `vercel.json` (root directory)

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-locations",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule**: Daily at 2:00 AM UTC (cleanup old location traces)

**Verification**:

```bash
# After deployment, check cron logs in Vercel Dashboard
# Navigate to: Deployments → [Latest] → Functions → /api/cron/cleanup-locations
```

---

## Database Migration

### Staging Environment

#### Step 1: Generate Migration

```bash
# Ensure you're on staging branch
git checkout staging

# Generate migration
pnpm prisma migrate dev --name add-geo-attendance

# This creates:
# prisma/migrations/<timestamp>_add_geo_attendance/migration.sql
```

#### Step 2: Review Migration SQL

```bash
cat prisma/migrations/<timestamp>_add_geo_attendance/migration.sql
```

**Expected Contents**:

- CREATE TABLE statements (geo_fences, location_traces, geo_attendance_events)
- CREATE INDEX statements (GiST, BRIN, B-tree)
- CREATE FUNCTION (notify_geofence_event)
- CREATE TRIGGER (geofence_event_trigger)

#### Step 3: Apply to Staging Database

```bash
# Deploy migration to staging
pnpm prisma migrate deploy

# Verify tables created
pnpm prisma studio
# Open browser → Check geo_fences, location_traces, geo_attendance_events tables
```

#### Step 4: Verify Spatial Indexes

```sql
-- Connect to staging database
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('geo_fences', 'location_traces')
ORDER BY tablename, indexname;

-- Expected output:
-- geo_fences | idx_geo_fences_geom | CREATE INDEX ... USING GIST ...
-- location_traces | idx_location_traces_geom | CREATE INDEX ... USING GIST ...
-- location_traces | idx_location_traces_timestamp_brin | CREATE INDEX ... USING BRIN ...
```

#### Step 5: Test Triggers

```sql
-- Insert test geofence event
INSERT INTO geo_attendance_events (
  id, school_id, student_id, geofence_id, event_type, lat, lon, timestamp
) VALUES (
  'test_event_123', 'test_school', 'test_student', 'test_geofence', 'ENTER', 24.7136, 46.6753, NOW()
);

-- Check PostgreSQL notification log (should see NOTIFY message)
-- If using pgAdmin/psql, listen to channel:
LISTEN geofence_events_test_school;
-- You should receive notification payload
```

### Production Environment

#### Step 1: Backup Database

Neon automatically backs up every 24 hours, but create manual snapshot:

1. Neon Console → Branches → Create Branch
2. Name: `pre-geo-migration-backup-2025-01-19`
3. Source: `main` branch

#### Step 2: Deploy Migration (During Maintenance Window)

**Recommended Time**: Off-peak hours (2:00 AM - 4:00 AM local time)

```bash
# Switch to production database
# Update DATABASE_URL in .env to production

# Deploy migration
pnpm prisma migrate deploy

# Monitor migration progress
# Expected time: 2-5 minutes for empty tables
```

#### Step 3: Verify Production Migration

```bash
# Check migration status
pnpm prisma migrate status

# Expected output:
# Database schema is up to date!

# Verify tables exist
pnpm prisma studio
```

---

## Deployment Steps

### Phase 1: Deploy to Staging (1 Day Before Production)

#### Step 1: Merge Feature Branch

```bash
git checkout staging
git merge feature/geofence-attendance
git push origin staging
```

#### Step 2: Automatic Deployment (Vercel)

Vercel automatically deploys `staging` branch to preview URL:

- **URL**: `https://hogwarts-git-staging-your-team.vercel.app`

#### Step 3: Verify Staging Deployment

```bash
# Check deployment status
vercel ls

# Expected output:
# hogwarts    staging    Ready    <timestamp>    https://hogwarts-git-staging-...
```

**Manual Verification**:

1. Open staging URL
2. Login as admin
3. Navigate to `/admin/attendance/geofences`
4. Create test geofence
5. Verify geofence appears on live map
6. Login as student
7. Navigate to `/student/attendance`
8. Enable location tracking
9. Verify location submissions in Network tab (200 OK)

#### Step 4: Run E2E Tests Against Staging

```bash
# Set BASE_URL to staging
BASE_URL=https://hogwarts-git-staging-your-team.vercel.app pnpm test:e2e

# All tests should pass
```

### Phase 2: Deploy to Production (Gradual Rollout)

#### Step 1: Feature Flag (Initially Disabled)

Set environment variable in Vercel:

```
NEXT_PUBLIC_GEOFENCE_ENABLED=false
```

This hides geofence UI from all users.

#### Step 2: Merge to Main Branch

```bash
git checkout main
git merge staging
git push origin main
```

Vercel automatically deploys to production:

- **URL**: `https://ed.databayt.org`

#### Step 3: Verify Production Deployment (Feature Hidden)

1. Open production URL
2. Login as admin
3. Verify `/admin/attendance/geofences` is NOT accessible (404 or hidden nav)
4. Geofence backend is deployed but not exposed to users

#### Step 4: Gradual Rollout Schedule

**Day 1-2: Pilot School (1 school, 100 students)**

1. Enable feature flag for pilot school only:

   ```typescript
   // In middleware or feature flag service
   const PILOT_SCHOOLS = ["school_cm5a1b2c3d4e5f6g7h8i9"]

   function isGeofenceEnabled(schoolId: string) {
     return PILOT_SCHOOLS.includes(schoolId)
   }
   ```

2. Monitor metrics:
   - Error rate: Should be < 1%
   - p95 latency: Should be < 200ms
   - Location submissions: 100 students × 120 updates/day = 12,000 req/day
   - Storage growth: ~120 MB/day

3. Gather feedback from pilot school admin

**Day 3-4: Expand to 5 Schools (500 students)**

1. Add 4 more schools to `PILOT_SCHOOLS` array
2. Monitor metrics:
   - Error rate: Should be < 1%
   - p95 latency: Should be < 200ms
   - Location submissions: 60,000 req/day
   - Storage growth: ~600 MB/day

**Day 5-7: Expand to 20 Schools (2,000 students)**

1. Add 15 more schools
2. Monitor metrics:
   - Error rate: Should be < 1%
   - p95 latency: Should be < 200ms
   - Location submissions: 240,000 req/day
   - Storage growth: ~2.4 GB/day

**Day 8+: Full Rollout (All Schools)**

1. Set environment variable globally:

   ```
   NEXT_PUBLIC_GEOFENCE_ENABLED=true
   ```

2. Monitor for 24 hours, then consider stable

---

## Post-Deployment Verification

### Automated Checks (Vercel Deployment Logs)

- [ ] Build succeeded (no TypeScript errors)
- [ ] Deployment completed (no 500 errors)
- [ ] Functions deployed (`/api/geo/location`, `/api/cron/cleanup-locations`)
- [ ] Environment variables loaded

### Manual Verification Checklist

#### Database Connectivity

```bash
# Connect to production database
pnpm prisma studio

# Verify tables:
# - geo_fences
# - location_traces
# - geo_attendance_events

# Check record counts (should be 0 initially):
SELECT COUNT(*) FROM geo_fences;
SELECT COUNT(*) FROM location_traces;
SELECT COUNT(*) FROM geo_attendance_events;
```

#### API Endpoints

```bash
# Test location submission endpoint
curl -X POST https://ed.databayt.org/api/geo/location \
  -H 'Content-Type: application/json' \
  -H 'Cookie: session-token=YOUR_SESSION_TOKEN' \
  -d '{
    "studentId": "test_student",
    "lat": 24.7136,
    "lon": 46.6753
  }'

# Expected response: HTTP 200 OK
# {"success":true,"timestamp":"2025-01-19T..."}
```

#### WebSocket Server

**Option 1: wscat**

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket server
wscat -c wss://ed.databayt.org/api/geo/ws

# Expected output:
# Connected (press CTRL+C to quit)
# < {"type":"connected","message":"WebSocket connected"}
```

**Option 2: Browser Console**

```javascript
const ws = new WebSocket("wss://ed.databayt.org/api/geo/ws")
ws.onopen = () => console.log("Connected")
ws.onmessage = (e) => console.log("Message:", JSON.parse(e.data))

// Expected output:
// Connected
// Message: {type: "connected", message: "WebSocket connected"}
```

#### Cron Job

```bash
# Manually trigger cron job
curl https://ed.databayt.org/api/cron/cleanup-locations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected response: HTTP 200 OK
# {"success":true,"deletedTraces":0,"timestamp":"2025-01-19T..."}

# Verify in Vercel Dashboard:
# Deployments → [Latest] → Functions → /api/cron/cleanup-locations
# Should see execution logs
```

#### Monitoring Dashboards

**Sentry**: https://sentry.io/organizations/your-org/projects/hogwarts

- [ ] No new errors related to geofencing
- [ ] Error rate < 1%

**Vercel Analytics**: https://vercel.com/your-team/hogwarts/analytics

- [ ] `/api/geo/location` endpoint shows requests
- [ ] p95 latency < 200ms
- [ ] No 5xx errors

---

## Rollback Procedure

### Trigger Conditions

Rollback immediately if:

- ✅ Error rate > 1% for 5+ minutes
- ✅ p95 latency > 500ms for 5+ minutes
- ✅ Database CPU > 90% for 10+ minutes
- ✅ Critical bug reported by users

### Rollback Steps (< 5 Minutes)

#### Step 1: Disable Feature Flag

**Option A: Environment Variable (Instant)**

```bash
# Vercel Dashboard
# Settings → Environment Variables → Edit NEXT_PUBLIC_GEOFENCE_ENABLED
# Change value to: false
# Redeploy: Deployments → [Latest] → Redeploy
```

**Option B: Code-Level Flag (Requires Redeployment)**

```typescript
// src/lib/feature-flags.ts
export const GEOFENCE_ENABLED = false // Set to false
```

```bash
git add .
git commit -m "fix: disable geofence feature (rollback)"
git push origin main
# Vercel auto-deploys in ~2 minutes
```

#### Step 2: Verify Feature Disabled

```bash
# Check production site
# Navigate to /admin/attendance/geofences
# Expected: 404 or hidden from navigation

# Verify no location submissions
# Monitor Vercel logs - should see no /api/geo/location requests
```

#### Step 3: Communicate to Users

**Email Template**:

```
Subject: Temporary Service Maintenance - Geofence Attendance

Dear School Administrators,

We have temporarily disabled the geofence attendance feature while we address a technical issue.

Impact:
- Geofence tracking: Disabled
- Manual attendance: Still available
- Historical data: Not affected

We expect to restore service within [ETA].

For assistance, contact support@databayt.org

Best regards,
Engineering Team
```

#### Step 4: Investigate Root Cause

```bash
# Check Sentry error logs
# Check Vercel function logs
# Check database slow query log

# Common issues:
# - Missing spatial index (run CREATE INDEX manually)
# - Database connection pool exhausted (increase pool size)
# - Rate limiting too strict (adjust limits)
```

### Database Rollback (If Migration Failed)

**Option A: Restore from Neon Branch**

```bash
# Neon Console → Branches → Select backup branch
# Promote to main
# WARNING: This reverts ALL database changes since backup
```

**Option B: Revert Migration (Safer)**

```bash
# Identify migration to revert
pnpm prisma migrate status

# Create revert migration
pnpm prisma migrate dev --name revert_geo_attendance

# Manually edit migration SQL:
# DROP TABLE geo_attendance_events;
# DROP TABLE location_traces;
# DROP TABLE geo_fences;
# DROP FUNCTION notify_geofence_event();
# DROP TRIGGER geofence_event_trigger;

# Apply revert
pnpm prisma migrate deploy
```

---

## Monitoring Setup

### Sentry Error Tracking

#### 1. Create Sentry Project

1. Sentry.io → Projects → Create Project
2. Name: `hogwarts-geofence`
3. Platform: Next.js
4. Copy DSN: `https://abc123@o123.ingest.sentry.io/456`

#### 2. Configure Sentry

**File**: `sentry.client.config.ts` (already exists)

Add geofence-specific tags:

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Tag geofence-related errors
    if (event.request?.url?.includes("/api/geo/")) {
      event.tags = { ...event.tags, module: "geofencing" }
    }
    return event
  },
})
```

#### 3. Custom Metrics

```typescript
// In geo-service.ts
import * as Sentry from '@sentry/nextjs'

export async function processGeofenceEvents(...) {
  const start = Date.now()

  try {
    // ... geofence logic ...

    Sentry.metrics.increment('geo.geofence.checked')
    Sentry.metrics.timing('geo.geofence.duration', Date.now() - start)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { module: 'geofencing' },
      extra: { studentId, location }
    })
    throw error
  }
}
```

### Vercel Analytics

**Enable**:

1. Vercel Dashboard → Project → Analytics → Enable
2. Add to `app/layout.tsx`:

   ```typescript
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

**Custom Events**:

```typescript
import { track } from "@vercel/analytics"

track("geofence_created", { type: "SCHOOL_GROUNDS" })
track("location_submitted", { accuracy: 10 })
```

### Database Performance Monitoring

#### Enable Slow Query Log

```sql
-- In Neon console
ALTER DATABASE hogwarts SET log_min_duration_statement = 50; -- Log queries > 50ms

-- View slow queries
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 50
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### Monitor Index Usage

```sql
-- Check if spatial indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('geo_fences', 'location_traces')
ORDER BY idx_scan DESC;

-- Expected: idx_scan > 0 for all indexes
```

### Alerts Configuration

**Vercel Integrations → Slack**

Create alerts for:

1. **Error Rate > 1%**
   - Notification: Slack #alerts channel
   - Action: Page on-call engineer

2. **p95 Latency > 500ms**
   - Notification: Slack #performance channel
   - Action: Investigate slow queries

3. **Database Storage > 80%**
   - Notification: Email to ops@databayt.org
   - Action: Review data retention policy

4. **Cron Job Failure**
   - Notification: Slack #ops channel
   - Action: Check database connectivity

---

## Continuous Monitoring (Post-Deployment)

### Daily Checks (Automated)

- [ ] Error rate < 1% (Sentry)
- [ ] p95 latency < 200ms (Vercel Analytics)
- [ ] Cron job executed successfully (Vercel logs)
- [ ] Storage growth < 3 GB/day (Neon dashboard)

### Weekly Reviews

- [ ] Review Sentry error trends
- [ ] Analyze slow query log
- [ ] Check index usage statistics
- [ ] Review user feedback

### Monthly Reviews

- [ ] Analyze storage growth trend
- [ ] Review data retention policy
- [ ] Optimize database queries
- [ ] Update documentation

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: DevOps Team
