# Development Guide: Geo Real-Time Attendance System

**Getting Started Time**: ~30 minutes
**Prerequisites**: Node.js 20+, pnpm 9+, PostgreSQL 16+ (or Neon account)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Local Environment Setup](#local-environment-setup)
- [Development Workflow](#development-workflow)
- [Debugging Guide](#debugging-guide)
- [Code Style Guide](#code-style-guide)
- [Common Issues](#common-issues)

---

## Quick Start

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/hogwarts.git
cd hogwarts

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### 2. Setup Database

**Option A: Neon (Cloud - Recommended)**

1. Create account: https://console.neon.tech
2. Create project: `hogwarts-dev`
3. Copy connection string
4. Enable PostGIS:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   SELECT PostGIS_version();
   ```
5. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://user:pass@host.neon.tech/hogwarts?sslmode=require"
   ```

**Option B: Local PostgreSQL**

```bash
# Install PostgreSQL (macOS)
brew install postgresql@16 postgis

# Start PostgreSQL
brew services start postgresql@16

# Create database
createdb hogwarts_dev

# Enable PostGIS
psql hogwarts_dev -c "CREATE EXTENSION postgis;"

# Update .env.local
DATABASE_URL="postgresql://localhost:5432/hogwarts_dev"
```

### 3. Run Migrations

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Verify tables created
pnpm prisma studio
# Open browser → Check geo_fences, location_traces, geo_attendance_events
```

### 4. Start Development Server

```bash
# Start Next.js with custom WebSocket server
pnpm dev

# Open browser
# http://localhost:3000
```

**Expected Output**:

```
✅ Connected to PostgreSQL for LISTEN/NOTIFY
🚀 Server ready on http://localhost:3000
🔌 WebSocket ready on ws://localhost:3000/api/geo/ws
```

---

## Local Environment Setup

### Environment Variables

**File**: `.env.local`

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/hogwarts_dev?sslmode=prefer"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Feature Flags
NEXT_PUBLIC_GEOFENCE_ENABLED="true"

# Development
NODE_ENV="development"
PORT="3000"

# Optional: Mock geolocation (for testing without GPS)
NEXT_PUBLIC_MOCK_GEOLOCATION="true"
NEXT_PUBLIC_MOCK_LAT="24.7136"
NEXT_PUBLIC_MOCK_LON="46.6753"
```

### Install Additional Tools

```bash
# Install global tools
pnpm add -g @prisma/cli vitest wscat

# Verify installations
prisma --version
vitest --version
wscat --version
```

### Browser Extensions (Recommended)

1. **React Developer Tools**: Debug React components
2. **Geolocation Emulator**: Mock GPS coordinates
3. **WebSocket King**: Test WebSocket connections

---

## Development Workflow

### Daily Workflow

#### 1. Start Development Session

```bash
# Pull latest changes
git pull origin main

# Install new dependencies (if any)
pnpm install

# Start dev server
pnpm dev
```

#### 2. Create Feature Branch

```bash
# Create branch from main
git checkout -b feature/geo-add-polygon-editing

# Naming convention:
# - feature/* (new functionality)
# - fix/* (bug fixes)
# - chore/* (maintenance)
# - docs/* (documentation)
```

#### 3. Make Changes

**Recommended Order**:

1. **Write test first** (TDD approach)

   ```typescript
   // geo-service.test.ts
   it("should detect polygon geofence", async () => {
     // ... test code
   })
   ```

2. **Implement feature**

   ```typescript
   // geo-service.ts
   export async function checkPolygonGeofence(...) {
     // ... implementation
   }
   ```

3. **Run tests**

   ```bash
   pnpm test src/lib/geo-service.test.ts
   ```

4. **Manual testing**
   - Open browser → Test feature
   - Check Network tab → Verify API calls
   - Check Console → No errors

#### 4. Code Quality Checks

```bash
# TypeScript type checking
pnpm build

# ESLint
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix

# Run all tests
pnpm test

# Check test coverage
pnpm test --coverage
```

#### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit format
git commit -m "feat(geo): add polygon geofence editing

- Add polygon drawing on Leaflet map
- Save polygon as GeoJSON
- Validate polygon has at least 3 vertices

Closes #123"

# Push to remote
git push origin feature/geo-add-polygon-editing
```

**Conventional Commit Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

#### 6. Create Pull Request

```bash
# Open GitHub
# Create PR from feature branch → main
# Title: "feat(geo): Add polygon geofence editing"
# Description: Link to issue, screenshots, testing checklist
```

---

## Debugging Guide

### Debug API Routes

#### Method 1: Console Logging

```typescript
// src/app/api/geo/location/route.ts
export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log("📍 Location received:", body)

  const result = await submitLocation(body)
  console.log("✅ Location saved:", result)

  return NextResponse.json(result)
}
```

**View Logs**: Terminal running `pnpm dev`

#### Method 2: VS Code Debugger

**File**: `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

**Usage**:

1. Set breakpoint in `route.ts`
2. Press F5 → Select "Next.js: debug server-side"
3. Submit location from browser
4. Debugger pauses at breakpoint

### Debug Server Actions

```typescript
// actions.ts
'use server'

export async function submitLocation(input: LocationInput) {
  console.log('🚀 submitLocation called:', input)

  const { schoolId } = await getTenantContext()
  console.log('🏫 schoolId:', schoolId)

  debugger // Pause here when using VS Code debugger

  const result = await saveLocationTrace(...)
  console.log('💾 Trace saved:', result)

  return { success: true }
}
```

### Debug React Components

#### React DevTools

1. Install extension: https://react.dev/learn/react-developer-tools
2. Open browser → F12 → Components tab
3. Select component → View props, state, hooks

#### Console Logging

```typescript
// GeoTracker component
export function GeoTracker({ studentId, enabled }: Props) {
  const [status, setStatus] = useState('inactive')

  useEffect(() => {
    console.log('🔄 GeoTracker useEffect:', { studentId, enabled })

    if (enabled) {
      console.log('📍 Starting location watch...')
      const watchId = navigator.geolocation.watchPosition(...)
    }
  }, [enabled])

  console.log('🎨 GeoTracker render:', { status })

  return <div>...</div>
}
```

### Debug WebSocket

#### Using wscat

```bash
# Connect to local WebSocket
wscat -c ws://localhost:3000/api/geo/ws

# Expected output:
# Connected
# < {"type":"connected","message":"WebSocket connected"}

# Trigger geofence event (in another terminal)
curl -X POST http://localhost:3000/api/geo/location ...

# wscat should receive:
# < {"type":"geofence_event","data":{...}}
```

#### Using Browser Console

```javascript
// Open browser console (F12)
const ws = new WebSocket("ws://localhost:3000/api/geo/ws")

ws.onopen = () => console.log("🔌 WebSocket connected")
ws.onmessage = (e) => console.log("📨 Received:", JSON.parse(e.data))
ws.onerror = (e) => console.error("❌ WebSocket error:", e)
ws.onclose = () => console.log("🔌 WebSocket disconnected")
```

### Debug Database Queries

#### Enable Prisma Query Logging

**File**: `src/lib/db.ts`

```typescript
export const db = new PrismaClient({
  log: ["query", "info", "warn", "error"],
})
```

**Output** (in terminal):

```
prisma:query SELECT * FROM geo_fences WHERE school_id = $1 [school_123]
prisma:info Query took 12ms
```

#### View SQL Queries

```typescript
// In geo-service.ts
const geofences = await db.geoFence.findMany({
  where: { schoolId, isActive: true },
})

// Prisma generates SQL:
// SELECT * FROM geo_fences WHERE school_id = 'school_123' AND is_active = true;
```

**Manually Test SQL**:

```bash
# Open Prisma Studio
pnpm prisma studio

# OR connect to database directly
psql $DATABASE_URL

# Run query
SELECT * FROM geo_fences WHERE school_id = 'school_123';
```

### Debug PostGIS Queries

```typescript
// Test ST_Contains query
const result = await db.$queryRaw`
  SELECT
    ST_Contains(
      ST_GeomFromGeoJSON(${polygonGeoJSON}),
      ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)
    ) as inside
`

console.log("📍 Point inside polygon:", result[0].inside)
```

**Explain Query Plan**:

```sql
EXPLAIN ANALYZE
SELECT
  ST_Contains(
    ST_GeomFromGeoJSON('{"type":"Polygon",...}'),
    ST_SetSRID(ST_MakePoint(46.6753, 24.7136), 4326)
  ) as inside;

-- Expected output:
-- Index Scan using idx_geo_fences_geom ... (cost=0.14..8.16 rows=1)
```

---

## Code Style Guide

### TypeScript

#### Prefer Explicit Types

```typescript
// ❌ BAD: Implicit any
function processLocation(data) { ... }

// ✅ GOOD: Explicit types
function processLocation(data: LocationUpdate): Promise<void> { ... }
```

#### Use Interface for Props

```typescript
// ❌ BAD: Verbose naming
interface GeoTrackerComponentProps {
  studentId: string
}

// ✅ GOOD: Simple "Props"
interface Props {
  studentId: string
  enabled: boolean
}

export function GeoTracker({ studentId, enabled }: Props) { ... }
```

#### Avoid `any`

```typescript
// ❌ BAD
const result: any = await db.$queryRaw`...`

// ✅ GOOD
const result = await db.$queryRaw<Array<{ inside: boolean }>>`...`
```

### React Components

#### Server Components by Default

```typescript
// ✅ GOOD: Server component (no "use client")
export async function GeofenceContent({ dictionary }: Props) {
  const geofences = await getGeofences() // Server-side data fetching

  return <div>...</div>
}
```

#### Client Components When Needed

```typescript
// ✅ GOOD: Client component (needs browser APIs)
'use client'

export function GeoTracker({ studentId }: Props) {
  useEffect(() => {
    navigator.geolocation.watchPosition(...) // Browser API
  }, [])

  return <div>...</div>
}
```

#### Props Interface Pattern

```typescript
// ✅ GOOD: Always use "interface Props"
interface Props {
  dictionary?: Dictionary
  lang?: Locale
}

export function MyComponent({ dictionary, lang }: Props) { ... }
```

### Server Actions

#### Follow Pattern

```typescript
"use server" // MUST be first line

export async function myAction(input: ActionInput) {
  // 1. Auth check
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // 2. Tenant context
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // 3. Validation
  const validated = schema.parse(input)

  // 4. Execute with schoolId
  await db.model.create({
    data: { ...validated, schoolId },
  })

  // 5. Revalidate
  revalidatePath("/path")

  return { success: true as const }
}
```

### Naming Conventions

#### Files

```typescript
// Lowercase with hyphens
geo - service.ts
live - map.tsx
use - geolocation.ts

// Test files
geo - service.test.ts
live - map.test.tsx
```

#### Components

```typescript
// PascalCase
export function GeoTracker() { ... }
export function GeoLiveMap() { ... }
```

#### Functions

```typescript
// camelCase
export function calculateDistance() { ... }
export async function submitLocation() { ... }
```

#### Constants

```typescript
// SCREAMING_SNAKE_CASE
export const UPDATE_INTERVAL = 30000
export const MAX_ACCURACY = 50
```

### Imports

#### Order

```typescript
// 1. React
import { useEffect, useState } from "react"
// 2. Next.js
import { NextRequest, NextResponse } from "next/server"
// 4. Internal imports (sorted by path)
import { auth } from "@/auth"
// 3. Third-party libraries
import { z } from "zod"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"

import { calculateDistance } from "./geo-service"
// 5. Types
import type { Coordinates } from "./types"
```

---

## Common Issues

### Issue 1: "PostGIS extension not found"

**Symptom**:

```
Error: function st_geomfromgeojson does not exist
```

**Solution**:

```sql
-- In Neon console or psql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_version(); -- Verify installation
```

### Issue 2: "Geolocation not supported"

**Symptom**:

- Browser console: `navigator.geolocation is undefined`

**Solution**:

1. Use HTTPS (required for Geolocation API)
   - Development: Use `localhost` (HTTP allowed)
   - Production: Must use HTTPS

2. Grant permission:
   - Chrome: Settings → Site Settings → Location → Allow

3. Test browser compatibility:
   ```javascript
   if (!navigator.geolocation) {
     alert("Geolocation not supported. Use Chrome/Safari/Firefox.")
   }
   ```

### Issue 3: WebSocket connection fails

**Symptom**:

```
WebSocket connection to 'ws://localhost:3000/api/geo/ws' failed
```

**Solution**:

1. Verify custom server is running:

   ```bash
   # Check terminal output
   # Should see: 🔌 WebSocket server ready on ws://localhost:3000/api/geo/ws
   ```

2. Check `package.json` script:

   ```json
   {
     "scripts": {
       "dev": "node server.js" // NOT "next dev"
     }
   }
   ```

3. Test WebSocket manually:
   ```bash
   wscat -c ws://localhost:3000/api/geo/ws
   ```

### Issue 4: Rate limiting blocks all requests

**Symptom**:

- HTTP 429 Too Many Requests on every location submission

**Solution**:

1. Clear rate limit cache:

   ```typescript
   // In src/lib/rate-limit.ts
   export const rateLimitStore = new Map() // This is in-memory, restart server to clear
   ```

2. Adjust rate limit (development only):

   ```typescript
   export const RATE_LIMITS = {
     GEO_LOCATION: {
       windowMs: 10000,
       maxRequests: 100, // Increase for development
     },
   }
   ```

3. Restart dev server:
   ```bash
   # Ctrl+C
   pnpm dev
   ```

### Issue 5: "Cannot find module 'leaflet'"

**Symptom**:

```
Module not found: Can't resolve 'leaflet'
```

**Solution**:

1. Install dependencies:

   ```bash
   pnpm add leaflet react-leaflet @types/leaflet
   ```

2. Import Leaflet CSS:

   ```typescript
   // In app/layout.tsx or component
   import "leaflet/dist/leaflet.css"
   ```

3. Use dynamic import (avoid SSR issues):
   ```typescript
   const MapContainer = dynamic(
     () => import("react-leaflet").then((mod) => mod.MapContainer),
     { ssr: false }
   )
   ```

### Issue 6: Prisma client not generated

**Symptom**:

```
Error: @prisma/client did not initialize yet
```

**Solution**:

```bash
# Generate Prisma client
pnpm prisma generate

# Verify generation
ls node_modules/.prisma/client
# Should see: index.js, index.d.ts, ...
```

### Issue 7: Database connection timeout

**Symptom**:

```
Error: Can't reach database server at `host.neon.tech:5432`
```

**Solution**:

1. Check `DATABASE_URL` in `.env.local`:

   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host.neon.tech/dbname?sslmode=require
   ```

2. Test connection manually:

   ```bash
   psql $DATABASE_URL
   # Should connect successfully
   ```

3. Check Neon dashboard:
   - Verify database is active (not paused)
   - Check connection limits (Neon Free tier: 100 connections)

### Issue 8: TypeScript errors in components

**Symptom**:

```
Type 'string | null' is not assignable to type 'string'
```

**Solution**:

1. Handle null values:

   ```typescript
   // ❌ BAD
   const name: string = student.name // Error if name is nullable

   // ✅ GOOD
   const name = student.name || "Unknown"
   const name = student.name ?? "Unknown"
   ```

2. Use type guards:
   ```typescript
   if (geofence.centerLat && geofence.centerLon && geofence.radiusMeters) {
     // TypeScript knows these are not null here
     const distance = calculateDistance(...)
   }
   ```

---

## Development Tips

### 1. Hot Reload Issues

If changes don't reflect in browser:

```bash
# Stop server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
pnpm dev
```

### 2. Mock Geolocation for Testing

```typescript
// In GeoTracker component
const mockGeolocation = {
  getCurrentPosition: (success) => {
    success({
      coords: {
        latitude: 24.7136,
        longitude: 46.6753,
        accuracy: 10,
      },
    })
  },
  watchPosition: (success) => {
    setInterval(() => {
      success({
        coords: {
          latitude: 24.7136 + Math.random() * 0.001,
          longitude: 46.6753 + Math.random() * 0.001,
          accuracy: 10,
        },
      })
    }, 5000)
    return 1 // watchId
  },
  clearWatch: (id) => {},
}

if (process.env.NEXT_PUBLIC_MOCK_GEOLOCATION === "true") {
  Object.defineProperty(navigator, "geolocation", {
    value: mockGeolocation,
  })
}
```

### 3. Seed Test Data

```bash
# Create seed script
pnpm tsx prisma/seeds/geo-test-data.ts

# Or add to package.json
{
  "scripts": {
    "db:seed:geo": "tsx prisma/seeds/geo-test-data.ts"
  }
}

pnpm db:seed:geo
```

### 4. Quick Database Reset

```bash
# Reset database (deletes all data)
pnpm prisma migrate reset

# Confirm: y

# Re-seed
pnpm db:seed:geo
```

### 5. Format Code on Save

**File**: `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: Engineering Team
